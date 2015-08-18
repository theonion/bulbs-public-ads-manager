/**
 * Utility functions for ad loading because we want to load the ads module ASAP,
 *  before any other JS libs that might provide these functions.
 */
module.exports = {

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
    return el.className && !!el.className.match('\\b' + className + '\\b');
  }
};
