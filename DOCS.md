# THREE.BasicThirdPersonGame

## Documentation

This is the GitHub version of the [official documentation](http://matthiasschuetz.com/three-basicthirdpersongame/docs). Feel free to extend it.

**Table of Contents**

- [Libraries](#libraries)
- [Display](#display)
- [Basic concept](#basic-concept)
- [Game modules](#game-modules)
- [Start the game](#start-the-game)
- [Game loop](#game-loop)
- [Cannon.js coordinates](#cannonjs-coordinates)
- [Player and level setup](#player-and-level-setup)
- [Jumping](#jumping)
- [Importing 3D models](#importing-3d-models)
- [Basic user interface](#basic-user-interface)
- [Final example](#final-example)

### Libraries

Before diving into core concepts and code snippets of THREE.BasicThirdPersonGame, we'll have a short look at the basis of the micro-framework: [THREE.js](http://threejs.org) and [Cannon.js](http://cannonjs.org). During the game development you'll always need to distinguish between the two libraries since they were made for completely different tasks. THREE.BasicThirdPersonGame is already set up for both worlds so you can kick-start directly into development but you should know what's behind the two scripts.

THREE.js is a fully functional and rich-featured 3D engine which does the whole work to create a virtual 3D world in your browser. It's responsible for the following areas:

* rendering (WebGL, canvas, SVG, CSS3)
* geometry, lighting, materials, textures, shaders (GLSL)
* scene graph and camera system
* 3D model processing and import (JSON)

So THREE.js is completely responsible for the visible part of your project. You could also develop a 3D game without an additional physics engine but it would be a lot more work: instead of having the comfort of rigid bodies and a real-time collision detection you would implement your own physics. If you want a simple collision detection you could go with [raycasting](http://threejs.org/docs/#Reference/Core/Raycaster) (a ray is a line in 3D space) but this detection type takes already place in the rendering geometry. A better approach is an implementation of math-based calculations to check for intersections and computing an impulse but to get there you need to create things like a broad-phase algorithm (like iterating over all bodies (N<sup>2</sup>), sweep and prune, binary space partitioning (BSP), etc.), some near- or narrow-phase algorithms for collision pairs (find separating axis for sphere-convex, convex-convex, plane-convex and so on), inertia and much more.

This is where a physics library like Cannon.js comes into play – this framework is a pure math and physics collection which can do complex calculations if you want a realistic simulation. The benefits of Cannon.js are:

* simulation of gravity, mass, friction and restitution
* rigid body physics
* real-time collision detection
* constraints and vehicle dynamics
* body sleeping and motion states

In contrast to THREE.js, Cannon.js will care about the behavioral and interaction aspects of the game. So there is a visual section and a logical section you are able to work with. All object movement in 3D space is computed and controlled by Cannon.js so you have understand what it does. You can read more about the functionalities of the libraries in the [THREE.js docs](http://threejs.org/docs/) and [Cannon.js docs](https://github.com/schteppe/cannon.js/wiki).

A last important notice here applies to the **used versions** of the two libraries. Both scripts are under **active development** and improved by their authors from time to time. However it's not necessary and mostly even not possible to work with the latest versions found on GitHub: both libraries have already undergone a partial or complete rewrite and some things are different to prior versions. Since the frameworks have already reached a stable state it's a personal choice whether to update or not (except you want a certain feature that is only available in the latest version). Another pitfall is the fact that the libraries are developed independently so you have to be careful if the latest versions of both work well together.

These are the versions, THREE.BasicThirdPersonGame is based on:

* [THREE.js r61](https://github.com/mrdoob/three.js/tree/r61)
* [Cannon.js 0.5.0 (fork by Daniel Ribeiro)](https://github.com/danielribeiro/cannon.js/)

The best advice is just to stick to the library files that come with THREE.BasicThirdPersonGame so you don't have to care about this topic. Maybe there will be an update to this framework in the future to work with newer versions of the libraries but you can also [contribute](http://matthiasschuetz.com/three-basicthirdpersongame/contribute) to do this by yourself.

### Basic concept

THREE.BasicThirdPersonGame is a set of JavaScript files which form the starting point for a 3D game using a third-person camera system. In contrast to a first-person (or ego) perspective, a third-person camera automatically follows the main player character or player vehicle of the game and provides an "over the shoulder" view.

![Third-person camera system (Blender preview)](http://matthiasschuetz.com/three-basicthirdpersongame/img/content_thirdpersoncamera.png "Third-person camera system (Blender preview)")

The idea of a follow camera is an easy task with THREE.js since the camera only needs to retreive the current position of the player's mesh. But there also needs to be a connection to the Cannon.js physics and that's one reason why THREE.BasicThirdPersonGame is built up using different modules.

### Game modules

Each file is responsible for a specific part of the game logic whereas the heart of the game code is placed in _game.core.js_.

![THREE.BasicThirdPersonGame modules](http://matthiasschuetz.com/three-basicthirdpersongame/img/content_gamemodules.png "THREE.BasicThirdPersonGame modules")

As you can see, there are two certain modules for THREE.js and Cannon.js which handle the communication behind the scenes. A brief overview of modules:

* **game.three.js**: scene, rendering, 3D models, Cannon.js helpers
* **game.cannon.js**: world, rigid body management
* **game.core.js**: game loop, player logic, level logic, module imports
* **game.events.js**: input system for keyboard controls
* **game.helpers.js**: math conversions, general helpers
* **game.ui.js**: user interface
* **game.static.js**: static constants (color values)

Before diving a bit into the module code, it's important to know about the terms _scene_ and _world_ which are listed above: in THREE.js, we create a main scene which contains all **visual entities** you can see on the screen. This includes meshes, materials, textures, lights and shaders. On the other hand you have the _world_ of Cannon.js which is responsible for **all physics and interactions** of your game, including gravity and references to the rigid bodies. So Cannon has a list of **bodies** which again have connections to **visuals** that are controlled by THREE.js.

We will have a quick look on the main attributes and methods of each module. It's only to point out the main purposes of each file and the code snippets are reduced to a minimum (function arguments and some attributes have been left out).

#### Common structures

The main modules, including _game.three.js_, _game.cannon.js_ and _game.core.js_ contain some similarities. They are all based on the **JavaScript module pattern** which is also a **factory pattern**. Although the components must be used as _singletons_, the module pattern provides some advantages. So inside each module there's a **private** attribute which is returned as a public interface at the end. This allows a shorter notation since you can simply access __three_ inside the THREE.js module for example. Another point are private attributes and methods which are not possible using the object literal notation.

Finally the modules contain common constructor and destrutor methods called _init_ and _destroy_. While _init_ is only called once after all files and the DOM have loaded, _destroy_ is used for a level reset (or game over). For _game.three.js_ and _game.cannon.js_ there's also a method called _setup_ – in contrast to _init_, _setup methods_ get called via _destroy_ and reset the scene (THREE.js) and world (Cannon.js).

#### game.three.js

```javascript
window.game.three = function() {
	var _three = {
		// Attributes
		fov: 40,

		// Methods
		init: function() {},
		destroy: function() {},
		setup: function () {},
		render: function() {},
		onWindowResize: function() {},
		createModel: function() {},
		createCannonGeometry: function() {},
		createCannonHalfExtents: function() {}
	};

	return _three;
};
```

In this file the target DOM container is set up and connected to the THREE.js renderer which itself appends a _canvas_ element to it. The camera is also initialized here and receives some custom options for the viewport. Besides the window resize handling there are also some helper methods for Cannon.js. These include the processing of imported 3D JSON models and ensure a valid mesh which is important for the bounding spheres and axis-aligned bounding boxes (AABB) that are created by Cannon. By default Cannon uses bounding spheres as compuation basis for its collision detection.

#### game.cannon.js

```javascript
window.game.cannon = function() {
	var _cannon = {
		// Attributes
		friction: 0.0,
		restitution: 0.0,
		gravity: -10,
		timestep: 1 / 8,

		// Methods
		init: function() {},
		destroy: function () {},
		setup: function () {},
		overrideCollisionMatrixSet: function() {},
		getCollisions: function() {},
		rotateOnAxis: function() {},
		createRigidBody: function() {},
		createPhysicsMaterial: function() {},
		addVisual: function() {},
		removeVisual: function(){},
		removeAllVisuals: function(){},
		updatePhysics: function() {},
		shape2mesh: function() {}
	};

	return _cannon;
};
```

Gravity, friction and restitution defaults are defined here. Besides this module contains the main function to update the physics simluation and also some methods taken from the Cannon.js demo framework which is written by Stefan Hedman, the developer of Cannon.js himself.

#### game.core.js

```javascript
window.game.core = function () {
	var _game = {
		// Attributes
		player: {
			// Attributes
			speed: 2,
			speedMax: 65,
			rotationSpeed: 0.007,
			rotationSpeedMax: 0.040,
			damping: 0.9,
			rotationDamping: 0.8,
			cameraOffsetH: 280,
			cameraOffsetV: 180,

			// Methods
			create: function() {},
			update: function() {},
			updateCamera: function() {},
			updateAcceleration: function() {},
			processUserInput: function() {},
			accelerate: function() {},
			rotate: function() {},
			jump: function() {},
			updateOrientation: function() {}
		},
		level: {
			// Methods
			create: function() {}
		},

		// Methods
		init: function() {},
		destroy: function() {},
		loop: function() {},
		initComponents: function () {}
	};

	return _game;
};
```

Finally you see the central place for all the game logic. This file contains the whole player and level structure including all needed properties. The player's acceleration and rotation as well as the camera movement are defined here. The snippet also represents a basic game where the player can be controlled through a simple level. For the [platforms demo game](http://matthiasschuetz.com/webgl-platforms-game), simply the _level_ object has been extended with additional logic. Of course you could add more JavaScript files for more complex levels.

#### game.events.js

```javascript
window.game.events = function() {
	var _events = {
		// Attributes
		keyboard: {
			// Attributes
			keyCodes: {},
			pressed: {},

			// Methods
			onKeyDown: function() {},
			onKeyUp: function() {}
		},

		// Methods
		init: function() {}
	};

	return _events;
};
```

The input system for keyboard events is very basic and uses a simple mechanism to allow conditions for pressed keys. In the _processUserInput_ function of _game.core.js_, THREE.BasicThirdPersonGame just uses a condition like this to check if the desired _forward key_ was pressed:

```javascript
if (_events.keyboard.pressed[_game.player.controlKeys.forward]) {
	// ...
}
```

#### game.helpers.js

```javascript
window.game.helpers = {
	polarToCartesian: function() {},
	radToDeg: function() {},
	degToRad: function() {},
	random: function() {},
	plusMinus: function() {},
	cloneObject: function() {}
};
```

#### game.static.js

```javascript
window.game.static = {
	colors: {}
};
```

As you can see the last two files of the starter kit contain some static helpers including conversions and also a method called _cloneObject_ – this method is used in the game core to perform a simple level reset so you don't need to reset all the player's properties and level states to their initial settings.

### Start the game

Before we get to the game loop it's worth to mention how to set up a game instance. These lines will initialize the game core and finally start the game. They can be placed in your HTML file after the game script files or in a separate JavaScript file.

```javascript
window.gameInstance = window.game.core();

window.gameInstance.init({
	domContainer: document.querySelector("#game"),
	rendererClearColor: window.game.static.colors.black
});
```

The _init_ function accepts three optional parameters: one for the target DOM container, one for the background color of THREE's renderer and you could also pass _cameraSizeConstraint_ to set the camera's limits inside the window. If the _domContainer_ option is omitted, THREE.BasicThirdPersonGame will append a _div_ to the body element.

Let's have a brief look at the __game.init_ function itself: it initializes the main components (THREE.js, Cannon.js, events, user interface), creates the player and level and starts the game loop.

```javascript
init: function(options) {
	_game.initComponents(options);

	_game.player.create();
	_game.level.create();

	_game.loop();
}
```

Where there is a game start there also needs to be a game end or game over. This event is handled in the __game.destroy_ method: the game loop is temporarily stopped and the Cannon.js physics world plus THREE's scene is being destroyed and recreated again. Afterwards the level reset mechanism mentioned before comes into play – the _player_ and _level_ objects were cloned via _cloneObject_ at the end of the _game.core.js_ file and now they are used for the recreation of the player and level. After this reset, the _create_ functions are called again and the game loop continues.

```javascript
destroy: function() {
	window.cancelAnimationFrame(_animationFrameLoop);

	_cannon.destroy();
	_cannon.setup();
	_three.destroy();
	_three.setup();

	_game.player = window.game.helpers.cloneObject(_gameDefaults.player);
	_game.level = window.game.helpers.cloneObject(_gameDefaults.level);

	_game.player.create();
	_game.level.create();

	_game.loop();
}
```

### Game loop

The game loop or main loop of the game is the place where the information processing and scene rendering come together to generate a visual output. The speed of the game loop will be determined by the browser's _requestAnimationFrame_ method and will usually result in a framerate of 60 fps. The _requestAnimationFrame_ method calls the game loop function again to create an endless recursive loop. Inside the loop there are only three things that happen: update Cannon.js physics, update the player and render output via THREE.js. The function calls look like this:

![THREE.BasicThirdPersonGame game loop](http://matthiasschuetz.com/three-basicthirdpersongame/img/content_gameloop.png "THREE.BasicThirdPersonGame game loop")

While _updatePhysics_ does nothing special but synchronizing the bodies' and visuals' positions and quaternions, it's worth having a quick look at __game.player.update()_.

```javascript
update: function() {
	_game.player.processUserInput();
	_game.player.accelerate();
	_game.player.rotate();
	_game.player.updateCamera();
}
```

As you can see the methods are self explaining: we process the user input (pressed keys) and move the player by using acceleration and rotation. Finally the third-person camera is updated. Inside the _update_ function you would include more game logic later for your final game like checking for game over or updating the user interface (UI).

### Cannon.js coordinates

Now we can have a look at the game logic itself. Let's start with one essential difference between THREE.js and Cannon.js: their Cartesian coordinate system. While THREE.js is based on a XZ ground plane, Cannon.js uses a XY ground plane so that vertical positions go along the Z axis.

![XYZ coordinate systems of THREE.js and Cannon.js](http://matthiasschuetz.com/three-basicthirdpersongame/img/content_cannonjscoordinates.png "XYZ coordinate systems of THREE.js and Cannon.js")

As you can see the ZY axis are rotated by 90 degrees around the X axis in Cannon. Therefore gravity is defined like this in _game.cannon.js_:

```javascript
_cannon.world.gravity.set(0, 0, _cannon.gravity);
```

So __cannon.gravity_ is applied to the Z axis here. The value is defined to 10 (an approximation to _g = 9,80665 m/s<sup>2</sup>_) by default.

Now that THREE.js uses a different Cartesian system also the viewport and projection matrix of WebGL have to be aligned correctly. In order to that we simply set the _up_ property of the camera to the Z axis. This is done in _game.three.js_:

```javascript
_three.camera.up.set(0, 0, 1);
```

With this settings you just can go on but simply use Z as vertical axis. You have to be careful when adding THREE.js entities to your scene since they need to be rotated by 90 degrees also. For example if you want to add a grid helper you would do it this way.

```javascript
var grid = new THREE.GridHelper(100, 10);
grid.rotation.x = Math.PI / 2;
_three.scene.add(grid);
```

The key is to do a _grid.rotation.x_ of 90 degrees. Since rotational values are based on radians instead of degrees you have to use _Math.PI / 2_. If you prefer degrees you can use the built-in helper of THREE.BasicThirdPersonGame:

```javascript
grid.rotation.x = window.game.helpers.degToRad(90);
```

It is a good advice to keep the vertical Z axis. If you try to use THREE's default coordinate system without rotating the camera you will drive into problems. There is already a [discussion](https://github.com/schteppe/cannon.js/issues/12) about this topic and THREE.BasicThirdPersonGame was developed with the vertical Y axis approach at the beginning. If it comes to collision detection the whole physics will go wrong because of the ZY rotation of 90 degrees. If you use this boilerplate and keep the Cannon.js coordinate system in mind everything goes well.

### Player and level setup

After initializing the game instance and explaining the game loop it's time to look at the main aspects of the game: the player and a level. As seen above the _init_ method of the game core loads the components and creates the player and level components. Starting with the player it's worth looking at the default properties and the _create_ method.

```javascript
player: {
	// Attributes
	mass: 3,
	jumpHeight: 45,
	speed: 2,
	speedMax: 65,
	rotationSpeed: 0.007,
	rotationSpeedMax: 0.04,
	damping: 0.9,
	rotationDamping: 0.8,
	cameraOffsetH: 280,
	cameraOffsetV: 180,

	// Methods
	create: function() {
		_cannon.playerPhysicsMaterial = new CANNON.Material("playerMaterial");

		_game.player.model = _three.createModel(window.game.models.player, 12, new THREE.MeshLambertMaterial({ color: window.game.static.colors.green, shading: THREE.FlatShading }));

		_game.player.shape = new CANNON.Box(_game.player.model.halfExtents);
		_game.player.rigidBody = new CANNON.RigidBody(_game.player.mass, _game.player.shape, _cannon.createPhysicsMaterial(_game.player.physicsMaterial));
		_game.player.rigidBody.position.set(0, 0, 10);
		_game.player.mesh = _cannon.addVisual(_game.player.rigidBody, null, _game.player.model.mesh);

		// ...
	}
}
```

Some unimportant attributes have been left so those you can see above are mostly self explaining. The player has a physical mass and settings for his acceleration and rotation which are changed in real-time by user input. The _speed_ value represents the acceleration which is increased to _speedMax_ after pressing the _forward key_ that is defined below in that file. The same goes for _rotationSpeed_ and _rotationSpeedMax_. There are also some values for _damping_ which are responsible for the deceleration (or easing) of motion and rotation. For _damping_ you can play with values between 0.7 and 0.95 – the closer the value gets 1 the longer takes the process of deceleration. Setting it to 0 will remove deceleration completely.

You will also find the camera offset values _cameraOffsetH_ and _cameraOffsetH_ which control the third-person camera position behind the player as described above.

Finally you can see the _create_ method which does some different things here:

* create a _physics material_ for the player
* create a player model from a 3D JSON model
* create a rigid body for the player based on the model
* add the model to the scene and physics world

A _physics material_ in contrast to a THREE.js material is virtual material which describes the consistency of a model's surface. So it doesn't have to do with the visual appearance but with the physical characteristics. For example you could create a bouncy physics material to simulate a trampoline effect. The first line doesn't create the final physics material but a simple Cannon material. When the rigid body is created via _CANNON.RigidBody_ some lines below the final material is created. The helper __cannon.createPhysicsMaterial_ can receive two more arguments for _friction_ and _restitution_. If they're omitted, no additional bounciness is applied to the material. In this special case the player material can't receive any values for friction and restitution since it will act as a base contact material for all other objects of the level. We will see that some lines later.

Then a 3D model is used for the player. This topic is shortly explained in [a later section](#importing-3d-models) since it can be a complex task if you want a fully animated and rigged player character containing various motion states for standing, running, crouching, jumping and so on. So if we look on the line which creates the player model there are 3 parameters:

```javascript
_three.createModel(window.game.models.player, 12, new THREE.MeshLambertMaterial({ ... });
```

In _window.game.models.player_ the complete 3D JSON model is stored as [JSON Model format 3](https://github.com/mrdoob/three.js/wiki/JSON-Model-format-3). To summarize this topic: by default THREE.BasicThirdPersonGame loads 3D models **synchronously** via _script_ and stores them in _window.game.models_ so the game can access the 3D model data instantly after all files have been loaded. If you want to import models **asynchronously** you can do this with THREE.JSONLoader in your **index.html** file and instantiate the game in the loaded callback. This approach is described in the section below.

Aside from the assigned THREE.MeshLambertMaterial, _three.createModel receives the number 12 as second parameter which defines the scale of the imported model. The scale is as important as the [creation of a valid 3D model](#creating-3d-models). It's necessary that your model has a correct origin in order to make the bounding spheres (and AABBs) and collision detection of Cannon work correctly. The __three.createModel_ method already does some important work for you since it aligns the imported 3D model to Cannon's vertical Z axis and also computes the half extents which are necessary for the correct bounding sphere size.

Finally the rigid body for the player is created and added to the game. This is done via __cannon.addVisual_ and in short the method does the following:

```javascript
addVisual: function(body, material, customMesh) {
	// ..

	mesh = _cannon.shape2mesh(body.shape, material);

	// ...

	_three.scene.add(mesh);
	_cannon.world.add(body);

	return mesh;
}
```

As you can see a mesh is created from the body shape and both entities are added separately to the _scene_ of THREE.js and the _world_ of Cannon.js. Of course you can still work with default THREE.js entities and add a THREE.Mesh to your scene for example. But it won't be affected from rigid bodies of Cannon.js so it's not possible to make walls only with THREE.js 3D objects. It's also important to know that the player's position is not set by using the _position_ attribute which is also available in THREE.js. Updating the position manually would completely destroy the whole physics of the player's rigid body and you would get unstable physics as a result. The correct way to move the player is to use velocity:

```javascript
accelerate: function() {
	_game.player.playerCoords = window.game.helpers.polarToCartesian(_game.player.acceleration, _game.player.rotationRadians.z);

	_game.player.rigidBody.velocity.set(_game.player.playerCoords.x, _game.player.playerCoords.y, _game.player.rigidBody.velocity.z);

	if (!_events.keyboard.pressed[_game.player.controlKeys.forward] && !_events.keyboard.pressed[_game.player.controlKeys.backward]) {
		_game.player.acceleration *= _game.player.damping;
	}
}
```

That's all and very basic to figure out: after getting the Cartesian XY coordinates from the current _acceleration_ and his orientation, the player's XYZ velocity is set based on this values. Afterwards the player speed is eased down using __game.player.damping_ which was described before. If the player's model is the only thing that is controlled by user input in your game, it may remain the only 3D object whose position will be set updating its velocity – it's up to you. Other objects can indeed be moved by setting their _position_ because the user has no influence on their physical behavior. This leads us to the next topic, the level element of your game.

So inside the __game.level.create_ method the whole game logic for your level(s) is placed. You would extend the __game.level_ object with your own methods that form a level – either procedural or by using some kind of level data. Below you'll find the code of the final example.

```javascript
create: function() {
	_cannon.solidMaterial = _cannon.createPhysicsMaterial(new CANNON.Material("solidMaterial"), 0, 0.1);

	_cannon.createRigidBody({
		shape: new CANNON.Box(new CANNON.Vec3(500, 500, 20)),
		mass: 0,
		position: new CANNON.Vec3(0, 0, -50),
		meshMaterial: new THREE.MeshLambertMaterial({ color: window.game.static.colors.black }),
		physicsMaterial: _cannon.solidMaterial
	});
}
```

As you can see a second physics material is created and assigned to __cannon.solidMaterial_. This time we define a value for restitution to simulate a small bounciness. In THREE.BasicThirdPersonGame you should prevent other values than 0 for fiction since the whole player physics are based on a friction of 0\. If you want to use friction you have to go with a [vehicle setup](http://schteppe.github.io/cannon.js/demos/hinge.html) that is based on wheels and hinge constraints.

So aside from the solid physics material the floor is created via __cannon.createRigidBody_. It has a mass of 0 and therefore it behaves like a static and solid object. You would also simulate walls by using a mass of 0\. While _shape_, _position_ and _meshMaterial_ should be self explaining, the last property assigns the solid physics material to this body. Every object in your level should get this material as long as you don't want another physical behavior. Inside the _createPhysicsMaterial_ function a contact material is added to the Cannon.js world. This contact material is created connecting two physics materials. And one of them will always be the __cannon.playerPhysicsMaterial_. Thereby the whole level reacts to the player model correctly.


### Jumping

It's worth to mention how jumping is handled in the micro-framework. There are some places in _game.core.js_ that are used together to provide a proper jump logic. Combined they look like the following:

```javascript
create: function() {
	// ...

	_game.player.rigidBody.addEventListener("collide", function(event) {
		if (!_game.player.isGrounded) {
			_game.player.isGrounded = (new CANNON.Ray(_game.player.mesh.position, new CANNON.Vec3(0, 0, -1)).intersectBody(event.contact.bi).length > 0);
		}
	});
},
processUserInput: function() {
	if (_events.keyboard.pressed["space"]) {
		_game.player.jump();
	}
},
jump: function() {
	if (_cannon.getCollisions(_game.player.rigidBody.index) && _game.player.isGrounded) {
		_game.player.isGrounded = false;
		_game.player.rigidBody.velocity.z = _game.player.jumpHeight;
	}
}
```

The first thing to mention is the possibility of assining events to a ridig body. Cannon.js provides some nice default events called _preStep_, _postStep_ and _collide_. When the player entity is created we assign a callback to the _collide event_ (triggered on every collision the player's rigid body has) that updates __game.player.isGrounded_. Since we already know that a collision is happening we can use CANNON.Ray to check for an intersection straight below the player (0, 0, -1). Cannon.js' ray object provides an _intersectBody_ method that returns a body of the Cannon world if an intersection is given. That's it. Then the _jump_ function is called via user input and inside that method, __cannon.getCollisions_ and __game.player.isGrounded_ are used to quickly determine whether a jump is allowed or not. If so, the player's Z velocity is updated using the _jumpHeight_ which was defined at the beginning.

### Importing 3D models

This section shortly demonstrates how to import a 3D model for THREE.js and Cannon.js using [Blender](http://blender.org) and the [Blender Import/Export Python script](https://github.com/mrdoob/three.js/tree/master/utils/exporters/blender). In Blender itself there's not much to do when you're finished with 3D modeling. Just go to

_File → Export → THREE.js (.js)_

and save your 3D model as a JavaScript file. As shown above, the __three.createModel_ function will do the rest. It will create a proper bounding box and rotate your model to the correct vertical axis. If your imported 3D model is pointing forward into the right direction depends on how you created the model inside Blender of course. It's up to you whether you rotate the model in Blender or use JavaScript to rotate it after it has been imported.

It's also your choice where you put your final 3D JSON model. By default, THREE.BasicThirdPersonGame loads the model _synchronously_ via a _script_ tag in your HTML file. If you have downloaded the boilerplate with all its files, you should have a file called _game.models.js_ where you can see the JSON contents of the demo player model. The file looks like this:

```javascript
window.game.models = {
	player: {
		// JSON Model format 3 data
	}
}
```

You can then import your model using the __three.createModel_ method:

```javascript
_three.createModel(window.game.models.player, 12, new THREE.MeshLambertMaterial({ ... });
```

As said before, the integer 12 here defines the scale factor of your imported 3D model so you have to play around with that value. It's also your choice which THREE material or texture you assign to your model. The third parameter can be omitted, set to a THREE material or an array of THREE materials (those will be mapped to the imported materials of the JSON model). If you want to process the mesh of the imported model, you can the assign the return value of __three.createModel_ to a variable. The function will return an object containing a _mesh_ property.

```javascript
var player = _three.createModel(window.game.models.player, 12, new THREE.MeshLambertMaterial({ ... });
console.log(player.mesh);
```

Finally we discuss the option of loading your 3D model(s) _asynchronously_ with an XMLHttpRequest. The first thing you'll have to is do call __three.createModel_ with a fourth parameter that is set to _true_. This informs the method that the JSON geometry has already been loaded so it will skip the step of parsing a JSON model file.

```javascript
_three.createModel(jsonData, scale, materials, isGeometry);
```

Now you can use the THREE.JSONLoader initially to load your model files and afterwards instantiate the game core.

```javascript
var loader = new THREE.JSONLoader();

loader.load("js/game/game.models.js", function(geometry, materials) {
	window.game.models = { player: geometry };

	window.gameInstance = window.game.core();

	window.gameInstance.init({
		domContainer: document.querySelector("#game"),
		rendererClearColor: window.game.static.colors.black
	});
});
```

This time we load the 3D JSON model data into _window.game.models.player_ manually. Regardless of whether you load your 3D models via HTTP request or XMLHttpRequest, you should end up having something like that in the end.

![Imported 3D model and its axis-aligned bounding box (AABB)](http://matthiasschuetz.com/three-basicthirdpersongame/img/content_3dmodelaabb.png "Imported 3D model and its axis-aligned bounding box (AABB)")

The axis-aligned bounding box (AABB) of the imported model is shown for testing purposes. You should always check if the bounding box was created correctly. This can be done by calling __cannon.showAABBs().init();_ in _initComponents_ like the following code snippet does.

```javascript
initComponents: function (options) {
	// ...

	_three.init(options);
	_cannon.init(_three);
	_cannon.showAABBs().init();
	_events.init();
}
```

Usually the import should be fine when using __three.createModel_ but if problems occur you may try centering your 3D model in Blender to [0, 0, 0]. So select your model, hit the **N** key and at the top of right panel (transform), set XYZ to 0\. You could also apply this to the vertices of the model by selecting your model, pressing **TAB** and repeat the last step.

### Basic user interface

THREE.BasicThirdPersonGame also comes with a small user interface component that is also used in the [examples](http://matthiasschuetz.com/three-basicthirdpersongame/examples). It's up to you whether you build the UI with WebGL and 2D shapes in 3D space or you simply go with HTML and CSS which offer excellent possibilities for all kinds of interface design. You can use the _cameraSizeConstraint_ option to reserve some free space for user interface elements but you could also work with overlays that are placed on top of the WebGL canvas layer. The _game.ui.js_ file provides some basic helper methods like _fadeOut_, _addClass_, _removeClass_ and _hasClass_ in order to set CSS classes dynamically. The demo game is based on these helpers and the whole interface animatons are done via class toggling and CSS3 transitions.

### Final example

You've reached the end of this document and you if you want to start your game development you should go on looking at the code of _game.core.js_. You will find explaining comments where necessary in the code and you are always free [to contribute](http://matthiasschuetz.com/three-basicthirdpersongame/contribute) to this project.

The last thing you might want to check out is [the working example](http://matthiasschuetz.com/three-basicthirdpersongame/demos/demo1_simple.html). It consists of a player, some level objects and a simple game over logic. For mor demos go to the [examples page](http://matthiasschuetz.com/three-basicthirdpersongame/examples).

[![THREE.BasicThirdPersonGame simple demo](http://matthiasschuetz.com/three-basicthirdpersongame/img/content_demo1.png "THREE.BasicThirdPersonGame simple demo")](http://matthiasschuetz.com/three-basicthirdpersongame/demos/demo1_simple.html) 

This documentation is a living document and it's intended to be extended in the future. There are many more topics to cover and there will also follow some more examples from time to time.