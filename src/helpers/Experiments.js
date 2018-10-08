var Feature = require('./Feature');

class Experiments {
  static getVariation(scope) {
    if (typeof(scope.gaVariation) !== 'undefined') {
      return scope.gaVariation;
    } else if (scope.cxApi) {
      return scope.cxApi.getChosenVariation(scope.gaExperimentId);
    } else {
      return null;
    }
  }

 /**
  * Retrieves the current Google Experiments variation.
  * This is a letter from A-C or null if the user is not participating.
  *
  * @returns {String};
  */
  static getExperimentVariation(scope) {
    var expScope = scope || window,
      variation = this.getVariation(expScope);

    if (Feature.isOn('enable_experiments')) {
      return (variation !== null && variation >= 0 && variation < 16) ? variation : null;
    } else {
      return (variation !== null && variation >= 0 && variation < 26) ? String.fromCharCode(variation + 65) : null;
    }
  }

 /**
  * Retrieves the current Google Experiments ID.
  *
  * @returns String;
  */
  static getExperimentId(scope) {
    var expScope = scope || window;
    return (expScope.gaExperimentId !== undefined) ? expScope.gaExperimentId : null;
  }
}

module.exports = Experiments;
