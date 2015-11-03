/**
 * Utility functions for ad loading because we want to load the ads module ASAP,
 *  before any other JS libs that might provide these functions.
 */
var Utils = {

  /**
   * Extend given object by given non-parameterized arguments.
   *
   * @param {object} out - object to extend.
   * @returns {object} extended object.
   */
  extend: function (out) {
    out = out || {};

    for (var i = 1; i < arguments.length; i++) {
      if (!arguments[i])
        continue;

      for (var key in arguments[i]) {
        if (arguments[i].hasOwnProperty(key))
          out[key] = arguments[i][key];
      }
    }

    return out;
  },

  /**
   * Test if given element has a given class.
   *
   * @param {Element} el - element to test.
   * @param {string} className - class name to test for.
   * @returns true if element has given class, false otherwise.
   */
  hasClass: function (el, className) {
    return el.className && !!el.className.match('(^|\\s)' + className + '($|\\s)');
  },

  /**
   * Remove a given class from given element.
   *
   * @param {Element} el - element to remove class from.
   * @param {string} className - class to remove.
   */
  removeClass: function (el, className) {
    el.className = el.className.replace(new RegExp('(^|\\s)' + className + '($|\\s)', 'g'), ' ');
  },

  /**
   * Add a given class to given element.
   *
   * @param {Element} el - element to add class to.
   * @param {string} className - class name to add.
   */
  addClass: function (el, className) {
    if (!Utils.hasClass(el, className)) {
      el.className += ' ' + className;
    }
  },

  /**
   * Check if element is inside visible viewport, within a specific distance.
   *
   * @param {Element} el - element to check.
   * @param {object} options - {withinDistance: {integer}} number of pixels to check.
   */
  elementNearViewport: function (el, options) {
    if (!options) {
      options = {};
    }
    var withinDistance = options.withinDistance || 0;
    var rect           = el.getBoundingClientRect();
    var innerHeight    = window.innerHeight || window.document.documentElement.clientHeight;

    return rect.top <= innerHeight + withinDistance && rect.top >= -withinDistance;
  }
};

module.exports = Utils;
