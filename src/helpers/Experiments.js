/* globals window*/

'use strict';

var Feature = require('./Feature');

var Experiments = {
  getVariation: function (scope) {
    if (typeof(scope.gaVariation) !== 'undefined') {
      return scope.gaVariation;
    } else if (scope.cxApi) {
      return scope.cxApi.getChosenVariation(scope.gaExperimentId);
    } else {
      return null;
    }
  },

 /**
  * Retrieves the current Google Experiments variation.
  * This is a letter from A-C or null if the user is not participating.
  *
  * @returns {String};
  */
  getExperimentVariation: function (scope) {
    var expScope = scope || window,
      variation = this.getVariation(expScope),
      variationIsValid = variation !== null && variation >= 0;

    if (Feature.isOn('enable_experiments')) {
      return (variationIsValid && variation < 16) ? variation : null;
    } else {
      return (variationIsValid && variation < 26) ? String.fromCharCode(variation + 65) : null;
    }
  },

 /**
  * Retrieves the current Google Experiments ID.
  *
  * @returns String;
  */
  getExperimentId: function (scope) {
    var expScope = scope || window;
    return (expScope.gaExperimentId !== undefined) ? expScope.gaExperimentId : null;
  }

}
module.exports = Experiments;
