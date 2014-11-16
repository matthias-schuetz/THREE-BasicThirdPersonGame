'use strict';

module.exports = function(grunt) {
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		uglify: {
			libCannon: {
				files: {
					'js/dist/cannon.min.js': ['js/libs/cannon.js']
				},
				options: {
					banner: '// Cannon.js - http://schteppe.github.io/cannon.js/' + grunt.util.linefeed +
							'// Used version: 0.5.0 - https://github.com/danielribeiro/cannon.js/' + grunt.util.linefeed,
					preserveComments: false
				}
			},
			libDetector: {
				files: {
					'js/dist/detector.min.js': ['js/libs/detector.js']
				},
				options: {
					banner: '// WebGL Detector - https://github.com/mrdoob/three.js/blob/master/examples/js/Detector.js' + grunt.util.linefeed,
					preserveComments: false
				}
			},			
			libThree: {
				files: {
					'js/dist/three.min.js': ['js/libs/three.js']
				},
				options: {
					banner: '// three.js - http://github.com/mrdoob/three.js' + grunt.util.linefeed +
							'// Used version: r61 - https://github.com/mrdoob/three.js/tree/r61' + grunt.util.linefeed,
					preserveComments: false
				}
			},
			game: {
				files: {
					'js/dist/game.min.js': [
						'js/game/game.static.js',
						'js/game/game.three.js',
						'js/game/game.cannon.js',
						'js/game/game.events.js',
						'js/game/game.helpers.js',
						'js/game/game.ui.js',
						'js/game/game.models.js',
						'js/game/game.core.js'
					]
				},
				options: {
					banner: '// THREE.BasicThirdPersonGame - http://matthiasschuetz.com/three-basicthirdpersongame' + grunt.util.linefeed,
					preserveComments: false
				}
			}
		},
		concat: {
			options: {
				separator: grunt.util.linefeed + grunt.util.linefeed + grunt.util.linefeed
			},
			dist: {
				src: [
					'js/dist/detector.min.js',
					'js/dist/RequestAnimationFrame.min.js',
					'js/dist/three.min.js',
					'js/dist/cannon.min.js',
					'js/dist/game.min.js'
				],
				dest: 'js/game.js'
			}
		}
	});

	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.registerTask('default', ['uglify:libCannon', 'uglify:libDetector', 'uglify:libThree', 'uglify:game', 'concat']);
};