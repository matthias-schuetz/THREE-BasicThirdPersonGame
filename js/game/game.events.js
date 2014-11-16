/*
 * Game Events
 *
 * A basic input system for keyboard controls
 */

window.game = window.game || {};

window.game.events = function() {
	var _events = {
		// Attributes
		keyboard: {
			// Attributes

			// Will be used in game.core.player.controlKeys
			keyCodes: {
				32: "space",
				65: "a",
				68: "d",
				83: "s",
				87: "w"
			},
			// This object will contain the pressed key states in real-time
			pressed: {
				// Pressed key states
			},

			// Methods
			onKeyDown: function(event) {
				// Set the pressed state for a key
				_events.keyboard.pressed[_events.keyboard.keyCodes[event.keyCode]] = true;
				// Fire common onKeyDown event which can be set from outside
				_events.onKeyDown();
			},
			onKeyUp: function(event) {
				// Unset the pressed state for a key
				_events.keyboard.pressed[_events.keyboard.keyCodes[event.keyCode]] = false;
			}
		},

		// Methods
		init: function() {
			// Add the listeners
			document.addEventListener("keydown", _events.keyboard.onKeyDown, false);
			document.addEventListener("keyup", _events.keyboard.onKeyUp, false);
		},
		onKeyDown: function() {
			// No specific actions by default
		}
	};

	return _events;
};