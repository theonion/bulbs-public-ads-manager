/* global define, window */

/**
 * Utility functions for handling base DFP targeting
 */

import * as experiments from './Experiments';

	/**
	 * Constructs associative array of targeting pairs from post meta
	 *
	 * @param Window scope the window to use for the kinja meta info.
	 *
	 */
	 function buildTargetingPairs (scope) {
		var kinjaMeta = scope.kinja.meta,
			post = scope.kinja.postMeta || {},
			content = scope.kinja.postContentRatings || [],
			experimentVariation = experiments.getExperimentVariation(scope),
			experimentId = experiments.getExperimentId(scope),
			socialTargeting, key,
			targeting = {};

		function getPageDepth() {
			var cookies = (scope.document.cookie + '').split('; ') || [],
				pdCookieValue = -1;

			cookies.forEach(function (cookie) {
				var parts, name, value;

				parts = cookie.split('=');
				name = scope.decodeURIComponent(parts.shift());
				value = scope.decodeURIComponent(parts.shift());

				// The cookie is named 'pageDepth' ~~~
				if (name === 'pageDepth') {
					pdCookieValue = scope.parseInt(value, 10);
				}
			});

			if (pdCookieValue === -1) {
				pdCookieValue = 1;
			} else {
				if (pdCookieValue < 5) {
					pdCookieValue += 1;
				}
			}
			scope.document.cookie = 'pageDepth=' + pdCookieValue + '; expires=1; path=/';

			return scope.parseInt(pdCookieValue, 10);
		}

		socialTargeting = (function () {
			var socialReferrer = (scope.document.referrer || '').match(/\b(?:facebook|instagram|pinterest|reddit|twitter|tumblr|t\.co)\b/i);

			if (socialReferrer) {
				socialReferrer = socialReferrer[0].toLowerCase();

				// SPECIAL CASE: Map 't.co' --> 'twitter'
				if (socialReferrer === 't.co') {
					socialReferrer = 'twitter';
				}
			}

			return socialReferrer;
		})();

		// Begin slot level params AKA 'scp'
		targeting.slotOptions = {
			// Standard targeting options
			postId: post ? post.postId : null,
			socialReferrer: socialTargeting,
			page: kinjaMeta.pageType ,
			pd: getPageDepth(),
			mtfIFPath: '\/assets\/vendor\/doubleclick\/'
		};

		// Begin page level targeting pairs AKA cust_params
		targeting.pageOptions = {
			tags: (post.tags || '').split(','),
			blogName: kinjaMeta.blog.name,
			ksg: scope.Krux.segments,
			kuid: scope.Krux.user
		};

		if (experimentVariation !== null && experimentId !== null) {
			targeting.pageOptions.exp_variation = experimentId + '_' + experimentVariation;
		}

		return targeting;
	}

	/**
	 * Constructs associative array of targeting pairs
	 *
	 * @param string forcedAdZone forced ad zone, if any
	 * @param Window scope the window to use for the kinja meta info.
	 *
	 */
	export function getTargetingPairs(forcedAdZone) {
		var targetingOptions = buildTargetingPairs(window);

		if (forcedAdZone) {
			targetingOptions.slotOptions.forcedAdZone = forcedAdZone || false;
		}

		return targetingOptions;
	}
