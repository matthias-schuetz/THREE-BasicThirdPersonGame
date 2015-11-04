# THREE.BasicThirdPersonGame

## JavaScript starter kit for your next WebGL 3D game based on THREE.js + Cannon.js

THREE.BasicThirdPersonGame is a free open source JavaScript micro-framework for WebGL games based on THREE.js and Cannon.js. THREE.js is one of the most popular 3D engines on the web while Cannon.js represents a simple, fast and lightweight physics engine. You can use rigid bodies, friction, restitution, collision detection and constraints.
Here is a list of what is included in this boilerplate:

* an input system
* player movement/jumping
* a level reset mechanism
* math helper methods
* adjustable camera viewport
* Cannon.js-optimized processing of imported 3D models

So the framework forms the starting point for a 3D game using a third-person camera system. In contrast to a first-person (or ego) perspective, a third-person camera automatically follows the main player character or player vehicle of the game and provides an "over the shoulder" view. So the follow camera keeps track of the orientation of the player and sticks to his position by using a fixed distance.

![THREE.BasicThirdPersonGame](http://matthias-schuetz.github.io/three-basicthirdpersongame/three-basicthirdpersongame.png "THREE.BasicThirdPersonGame")

## Demo
Either you can play the <a href="http://matthiasschuetz.com/webgl-platforms-game">platforms demo game</a> or you can have a look at the <a href="http://matthiasschuetz.com/three-basicthirdpersongame/examples">examples</a> that also come with this package.

## Usage

For a detailed documentation, head over to the [docs](doc/DOCS.md) or the <a href="http://matthiasschuetz.com/three-basicthirdpersongame/docs">official website</a> and learn how to use it. THREE.BasicThirdPersonGame ought to be an interactive tutorial and starting point for your WebGL game based on THREE.js. On this page you should get on overview of how to get the framework up and running. Check out the examples and dive into the code for a deeper impression. The code of all JavaScript files is fully commented.

Below you will find the basic setup for the game including all necessary files. Normally you start editing the game.core.js since the whole game logic is placed there. Every provided example has its own game.core.demo.js file where the logic only differs slightly. All demos are based on the main libraries and game component files.

The package also contains a Gruntfile which combines and obfuscates all library and game files into one minified game.js.

### HTML

```html
<html>
	<head></head>

	<body>
    	<div id="game"></div>
    
		<script src="js/libs/detector.js"></script>
		<script src="js/libs/three.js"></script>
		<script src="js/libs/cannon.js"></script>

		<script src="js/game/game.static.js"></script>
		<script src="js/game/game.three.js"></script>
		<script src="js/game/game.cannon.js"></script>
		<script src="js/game/game.events.js"></script>
		<script src="js/game/game.helpers.js"></script>
		<script src="js/game/game.ui.js"></script>
		<script src="js/game/game.core.js"></script>
		<script src="js/game/game.models.js"></script>

		<script>
			if (!Detector.webgl) {
				Detector.addGetWebGLMessage();
			} else {
				window.gameInstance = window.game.core();
				window.gameInstance.init({
					domContainer: document.querySelector("#game"),
					rendererClearColor: 0xffffff
				});
			}
		</script>
    </body>
</html>
```

### JavaScript

```javascript
/*
 * game.core.js: init()
 * 
 * @param Object domContainer Element which will hold the final canvas element of THREE.js
 * @param Object cameraSizeConstraint Optional: Size constraint to limit viewport e.g. for a user interface
 * @param Number rendererClearColor Optional: A color value for the background color of the THREE.js canvas
 */

window.gameInstance = window.game.core();
window.gameInstance.init({
	domContainer: document.querySelector("#game"),
    cameraSizeConstraint: {
    	width: 100,
        height: 50
    },
	rendererClearColor: 0xffffff
});
```

Finally we will have a look on the central place for all the game logic, the game.core.js file. This file contains the whole player and level structure including all needed properties. Some unimportant attributes have been left and those you can see below are mostly self explaining.

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

The player's acceleration and rotation as well as the camera movement are defined here. The snippet also represents a basic game where the player can be controlled through a simple level. For the platforms demo game, simply the level object has been extended with additional logic. Of course you could add more JavaScript files for more complex levels.

## Notes

A last important notice here applies to the used versions of THREE.js and Cannon.js. Both scripts are under active development and improved by their authors from time to time. THREE.BasicThirdPersonGame is based on <a href="https://github.com/mrdoob/three.js/tree/r61">THREE.js r61</a> and <a href="https://github.com/danielribeiro/cannon.js/">Cannon.js 0.5.0 (fork by Daniel Ribeiro)</a>. The best advice is just to stick to the library files that come with THREE.BasicThirdPersonGame so you don't have to care about this topic. Maybe there will be an update to this framework in the future to work with newer versions of the libraries but you can also contribute to do this by yourself.

## License

THREE.BasicThirdPersonGame is released under the MIT license.