/* globals define, window*/

	'use strict';
	/**
	 * Retreives the current Google Experiments variation.
	 * This is a letter from A-C or null if the user is not participating.
	 */
		export function getExperimentVariation (scope) {
			var expScope = scope || window,
				variation = expScope.cxApi ? expScope.cxApi.getChosenVariation(expScope.gaExperimentId) : null;
			return (variation !== null && variation >= 0 && variation < 26) ? String.fromCharCode(variation + 65)
				: null;
		}
		export function getExperimentId (scope) {
			var expScope = scope || window;
			return (expScope.gaExperimentId !== undefined) ? expScope.gaExperimentId : null;
		}
	