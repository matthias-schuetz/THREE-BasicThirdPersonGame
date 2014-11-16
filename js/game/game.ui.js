/*
 * Game UI
 *
 * A class for handling the user interface of the gaming providing DOM element management and some helpers
 */

window.game = window.game || {};

window.game.ui = function() {
	var _ui = {
		// Attributes
		elements: {
			// Properties for DOM elements are stored here
			infoboxIntro: null
		},

		// Methods
		init: function () {
			// Get DOM elements and bind events to them
			_ui.getElements();
			_ui.bindEvents();
		},
		destroy: function () {

		},
		getElements: function () {
			// Store the DOM elements in the elements object to make them accessible in addClass, removeClass and hasClass
			_ui.elements.infoboxIntro = document.querySelector("#infobox-intro");
		},
		bindEvents: function () {
			// Event bindings
		},
		fadeOut: function (element) {
			// Add a CSS class, fading is done via CSS3 transitions
			if (!_ui.hasClass(element, "fade-out")) {
				_ui.addClass(element, "fade-out");
			}
		},
		addClass: function (element, className, resetClassName) {
			// Adds a class to a specified element
			if (resetClassName && _ui.elements[element].getAttribute("data-classname")) {
				_ui.elements[element].className = resetClassName && _ui.elements[element].getAttribute("data-classname");
			}

			_ui.elements[element].className = _ui.elements[element].className + " " + className;
		},
		removeClass: function (element, className) {
			// Removes a class from a specified element
			var classNameRegEx = new RegExp("\\s\\b" + className + "\\b", "gi");
			_ui.elements[element].className = _ui.elements[element].className.replace(classNameRegEx, "");
		},
		hasClass: function (element, className) {
			// Checksif a specified element contains the given class name
			return _ui.elements[element].className.match(className);
		}
	};

	return _ui;
};