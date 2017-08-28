/* global window */

/**
 * Utility functions for handling base DFP targeting
 */
var Experiments = require('./Experiments');
var SocialReferrer = require('./SocialReferrer');
var PageDepth = require('./PageDepth');

var TargetingPairs = {
  /**
   * Constructs associative array of targeting pairs from post meta
   *
   * @param Window scope the window to use for the kinja meta info.
   *
   */
  buildTargetingPairs: function(scope) {
    var kinjaMeta = scope.kinja.meta,
      post = scope.kinja.postMeta || {},
      content = scope.kinja.postContentRatings || [],
      experimentVariation = Experiments.getExperimentVariation(scope),
      experimentId = Experiments.getExperimentId(scope),
      socialTargeting, key,
      targeting = {};

    // Begin slot level params AKA 'scp'
    targeting.slotOptions = {
      // Standard targeting options
      postId: post ? post.postId : null,
      socialReferrer: SocialReferrer.isSocialReferrer(),
      page: kinjaMeta.pageType,
      pd: PageDepth.getPageDepth(),
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
  },

  /**
   * Constructs associative array of targeting pairs
   *
   * @param string forcedAdZone forced ad zone, if any
   * @param Window scope the window to use for the kinja meta info.
   *
   */
  getTargetingPairs: function(forcedAdZone) {
    var targetingOptions = this.buildTargetingPairs(window);

    if (forcedAdZone) {
      targetingOptions.pageOptions.forcedAdZone = forcedAdZone || false;
    }

    return targetingOptions;
  }
}
module.exports = TargetingPairs;
