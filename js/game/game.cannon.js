/*
 * Game Cannon.js module
 *
 * A class for the Cannon.js setup providing rigid body management, collision detection extensions and some helpers
 */

window.game = window.game || {};

window.game.cannon = function() {
	var _cannon = {
		// Attributes

		// Cannon.js world holding all rigid bodies of the level
		world: null,
		// Bodies correspond to the physical objects inside the Cannon.js world
		bodies: [],
		// Visuals are the visual representations of the bodies that are finally rendered by THREE.js
		visuals: [],
		// Store the body count in an index
		bodyCount: 0,
		// Default friction and restitution
		friction: 0.0,
		restitution: 0.0,
		// Default Z gravity (approximation of 9,806)
		gravity: -10,
		// Interval speed for Cannon.js to step the physics simulation
		timestep: 1 / 8,
		// Player physics material that will be assigned in game.core.js
		playerPhysicsMaterial: null,
		// Solid material for all other level objects
		solidMaterial: null,

		// Methods
		init: function(three) {
			// A small collision detection extension to get the indices of the collision pair
			_cannon.overrideCollisionMatrixSet();

			// Setup Cannon.js world
			_cannon.setup();

			// Get a reference to THREE.js to manage visuals
			_three = three;
		},
		destroy: function () {
			// Remove all entities from the scene and Cannon's world
			_cannon.removeAllVisuals();
		},
		setup: function () {
			// Create a new physics simulation based on the default settings
			_cannon.world = new CANNON.World();
			_cannon.world.gravity.set(0, 0, _cannon.gravity);
			_cannon.world.broadphase = new CANNON.NaiveBroadphase();
			_cannon.world.solver.iterations = 5;

			// Create empty arrays that will later be populated with rigid bodies and mesh references
			_cannon.bodies = [];
			_cannon.visuals = [];
			_cannon.bodyCount = 0;
		},
		overrideCollisionMatrixSet: function() {
			// Override CANNON's collisionMatrixSet for player's "isGrounded" via monkey patch
			var _cannon_collisionMatrixSet = CANNON.World.prototype.collisionMatrixSet;

			CANNON.World.prototype.collisionMatrixSet = function(i, j, value, current){
				_cannon_collisionMatrixSet.call(this, i, j, [i, j], current);
			};
		},
		getCollisions: function(index) {
			// Count the collisions of the provided index that is connected to a rigid body in the Cannon.js world
			var collisions = 0;

			for (var i = 0; i < _cannon.world.collisionMatrix.length; i++) {
				if (_cannon.world.collisionMatrix[i] && _cannon.world.collisionMatrix[i].length && (_cannon.world.collisionMatrix[i][0] === index || _cannon.world.collisionMatrix[i][1] === index)) {
					collisions++;
				}
			}

			return collisions;
		},
		rotateOnAxis: function(rigidBody, axis, radians) {
			// Equivalent to THREE's Object3D.rotateOnAxis
			var rotationQuaternion = new CANNON.Quaternion();
			rotationQuaternion.setFromAxisAngle(axis, radians);
			rigidBody.quaternion = rotationQuaternion.mult(rigidBody.quaternion);
		},
		createRigidBody: function(options) {
			// Creates a new rigid body based on specific options
			var rigidBody  = new CANNON.RigidBody(options.mass, options.shape, options.physicsMaterial);
			rigidBody.position.set(options.position.x, options.position.y, options.position.z);

			// Apply a rotation if set by using Quaternions
			if (options.rotation) {
				rigidBody.quaternion.setFromAxisAngle(options.rotation[0], options.rotation[1]);
			}

			// Add the entity to the scene and world
			_cannon.addVisual(rigidBody, options.meshMaterial, options.customMesh);

			return rigidBody;
		},
		createPhysicsMaterial: function(material, friction, restitution) {
			// Create a new material and add a Cannon ContactMaterial to the world always using _cannon.playerPhysicsMaterial as basis
			var physicsMaterial = material || new CANNON.Material();
			var contactMaterial = new CANNON.ContactMaterial(physicsMaterial, _cannon.playerPhysicsMaterial, friction || _cannon.friction, restitution || _cannon.restitution);

			_cannon.world.addContactMaterial(contactMaterial);

			return physicsMaterial;
		},
		addVisual: function(body, material, customMesh) {
			// Initialize the mesh or use a provided custom mesh
			var mesh = customMesh || null;

			// Check for rigid body and convert the shape to a THREE.js mesh representation
			if (body instanceof CANNON.RigidBody && !mesh) {
				mesh = _cannon.shape2mesh(body.shape, material);
			}

			// Populate the bodies and visuals arrays
			if (mesh) {
				_cannon.bodies.push(body);
				_cannon.visuals.push(mesh);

				body.visualref = mesh;
				body.visualref.visualId = _cannon.bodies.length - 1;

				// Add body/mesh to scene/world
				_three.scene.add(mesh);
				_cannon.world.add(body);
			}

			return mesh;
		},
		removeVisual: function(body){
			// Remove an entity from the scene/world
			if (body.visualref) {
				var old_b = [];
				var old_v = [];
				var n = _cannon.bodies.length;

				for (var i = 0; i < n; i++){
					old_b.unshift(_cannon.bodies.pop());
					old_v.unshift(_cannon.visuals.pop());
				}

				var id = body.visualref.visualId;

				for (var j = 0; j < old_b.length; j++){
					if (j !== id){
						var i = j > id ? j - 1 : j;
						_cannon.bodies[i] = old_b[j];
						_cannon.visuals[i] = old_v[j];
						_cannon.bodies[i].visualref = old_b[j].visualref;
						_cannon.bodies[i].visualref.visualId = i;
					}
				}

				body.visualref.visualId = null;
				_three.scene.remove(body.visualref);
				body.visualref = null;
				_cannon.world.remove(body);
			}
		},
		removeAllVisuals: function() {
			// Clear the whole physics world and THREE.js scene
			_cannon.bodies.forEach(function (body) {
				if (body.visualref) {
					body.visualref.visualId = null;
					_three.scene.remove(body.visualref);
					body.visualref = null;
					_cannon.world.remove(body);
				}
			});

			_cannon.bodies = [];
			_cannon.visuals = [];
		},
		updatePhysics: function() {
			// Store the amount of bodies into bodyCount
			_cannon.bodyCount = _cannon.bodies.length;

			// Copy coordinates from Cannon.js to Three.js
			for (var i = 0; i < _cannon.bodyCount; i++) {
				var body = _cannon.bodies[i], visual = _cannon.visuals[i];

				body.position.copy(visual.position);

				// Update the Quaternions
				if (body.quaternion) {
					body.quaternion.copy(visual.quaternion);
				}
			}

			// Perform a simulation step
			_cannon.world.step(_cannon.timestep);
		},
		shape2mesh: function(shape, currentMaterial) {
			// Convert a given shape to a THREE.js mesh
			var mesh;
			var submesh;

			switch (shape.type){
				case CANNON.Shape.types.SPHERE:
					var sphere_geometry = new THREE.SphereGeometry(shape.radius, shape.wSeg, shape.hSeg);
					mesh = new THREE.Mesh(sphere_geometry, currentMaterial);
					break;

				case CANNON.Shape.types.PLANE:
					var geometry = new THREE.PlaneGeometry(100, 100);
					mesh = new THREE.Object3D();
					submesh = new THREE.Object3D();
					var ground = new THREE.Mesh(geometry, currentMaterial);
					ground.scale = new THREE.Vector3(1000, 1000, 1000);
					submesh.add(ground);

					ground.castShadow = true;
					ground.receiveShadow = true;

					mesh.add(submesh);
					break;

				case CANNON.Shape.types.BOX:
					var box_geometry = new THREE.CubeGeometry(shape.halfExtents.x * 2,
							shape.halfExtents.y * 2,
							shape.halfExtents.z * 2);
					mesh = new THREE.Mesh(box_geometry, currentMaterial);
					mesh.castShadow = true;
					mesh.receiveShadow = true;
					break;

				case CANNON.Shape.types.COMPOUND:
					// recursive compounds
					var o3d = new THREE.Object3D();
					for(var i = 0; i<shape.childShapes.length; i++){

						// Get child information
						var subshape = shape.childShapes[i];
						var o = shape.childOffsets[i];
						var q = shape.childOrientations[i];

						submesh = _cannon.shape2mesh(subshape);
						submesh.position.set(o.x,o.y,o.z);
						submesh.quaternion.set(q.x,q.y,q.z,q.w);

						submesh.useQuaternion = true;
						o3d.add(submesh);
						mesh = o3d;
					}
					break;

				default:
					throw "Visual type not recognized: " + shape.type;
			}

			mesh.receiveShadow = true;
			mesh.castShadow = true;

			if (mesh.children) {
				for (var i = 0; i < mesh.children.length; i++) {
					mesh.children[i].castShadow = true;
					mesh.children[i].receiveShadow = true;

					if (mesh.children[i]){
						for(var j = 0; j < mesh.children[i].length; j++) {
							mesh.children[i].children[j].castShadow = true;
							mesh.children[i].children[j].receiveShadow = true;
						}
					}
				}
			}

			return mesh;
		},
		showAABBs: function() {
			// Show axis-aligned bounding boxes for debugging purposes - Cannon.js uses bounding spheres by default for its collision detection
			var that = this;

			var GeometryCache = function(createFunc) {
				var that = this, geo = null, geometries = [], gone = [];

				that.request = function() {
					if (geometries.length) {
						geo = geometries.pop();
					} else {
						geo = createFunc();
					}

					_three.scene.add(geo);
					gone.push(geo);

					return geo;
				};

				that.restart = function() {
					while(gone.length) {
						geometries.push(gone.pop());
					}
				};

				that.hideCached = function() {
					for (var i = 0; i < geometries.length; i++) {
						_three.scene.remove(geometries[i]);
					}
				}
			};

			var bboxGeometry = new THREE.CubeGeometry(1, 1, 1);

			var bboxMaterial = new THREE.MeshBasicMaterial({
				color: 0xffffff,
				wireframe: true
			});

			var bboxMeshCache = new GeometryCache(function() {
				return new THREE.Mesh(bboxGeometry, bboxMaterial);
			});

			that.update = function() {
				bboxMeshCache.restart();

				for (var i = 0; i < _cannon.bodies.length; i++) {
					var b = _cannon.bodies[i];

					if (b.computeAABB) {
						if(b.aabbNeedsUpdate){
							b.computeAABB();
						}

						if (isFinite(b.aabbmax.x) &&
							isFinite(b.aabbmax.y) &&
							isFinite(b.aabbmax.z) &&
							isFinite(b.aabbmin.x) &&
							isFinite(b.aabbmin.y) &&
							isFinite(b.aabbmin.z) &&
							b.aabbmax.x - b.aabbmin.x != 0 &&
							b.aabbmax.y - b.aabbmin.y != 0 &&
							b.aabbmax.z - b.aabbmin.z != 0) {
							var mesh = bboxMeshCache.request();

							mesh.scale.set(b.aabbmax.x - b.aabbmin.x,
									b.aabbmax.y - b.aabbmin.y,
									b.aabbmax.z - b.aabbmin.z);

							mesh.position.set((b.aabbmax.x + b.aabbmin.x) * 0.5,
									(b.aabbmax.y + b.aabbmin.y) * 0.5,
									(b.aabbmax.z + b.aabbmin.z) * 0.5);
						}
					}
				}

				bboxMeshCache.hideCached();
			};
			
			that.init = function() {
				var updatePhysics = _cannon.updatePhysics;

				_cannon.updatePhysics = function() {
					updatePhysics();
					that.update();
				}
			};

			return that;
		}
	};

	var _three;

	return _cannon;
};