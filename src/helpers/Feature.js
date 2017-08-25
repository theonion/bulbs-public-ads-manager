/* global window, document, define */
/**
 *  A singleton that provides functionality to check the value of feature switches on the frontend.
 *
 */

'use strict';
/**
 * Stored active features
 * @type {Object}
 */
var Feature = {

  /**
   * Returns true if the feature of that name exists and is on
   * @param string name Name of the feature.
   * @return {boolean} True if the feature is on.
   */
  isOn: function(name) {
    return feature.value(name) === 'on';
  }

    value: function(name) {
    return feature.getFeatures()[name];
  }


    features: null,

  /**
   * Reads the features from the body classes and returns a map of them
   * @return {Object}
   */
  getFeatures: function() {
    if (feature.features === null) {
      var features = {},
        bodyClass = ((document.body.classList.length || !window.frameElement) ?
          document.body.classList : window.parent.document.body.classList) || [],
        length = bodyClass.length,
        start, end, name, value, i, className;

      // get the body classes which start with f_
      // map the class names into a map of feature names to values
      for (i = 0; i < length; i++) {
        className = bodyClass[i];
        if (className.indexOf('f_') === 0) {
          start = className.indexOf('_');
          end = className.lastIndexOf('_');
          if (start < end) {
            name = className.substring(start + 1, end - start + 1);
            value = className.substring(end + 1);
            features[name] = value;
          }
        }
      }
      feature.features = features;
    }
    return feature.features;
  }
};
module.exports = Feature;
