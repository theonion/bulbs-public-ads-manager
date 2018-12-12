/* global window */

/**
 * Utility functions for handling base DFP targeting
 */
var Experiments = require('./Experiments');
var SocialReferrer = require('./SocialReferrer');
var PageDepth = require('./PageDepth');

var TargetingPairs = {
  /**
  * Constructs comma delimited targeting list of all the story types tied to a permalink or the story type landing page
  *
  * @param Window scope the window to use for the kinja meta info
  */
  getCategories: function (scope) {
    var categoryMeta = scope.kinja.categoryMeta || {},
      postMeta = scope.kinja.postMeta || {};

    return (postMeta.categories || categoryMeta.categories || '').split(',');
  },

  /**
  * Constructs comma delimited targeting list of all tags tied to a permalink or the tag landing page
  *
  * @param Window scope the window to use for the kinja meta info
  */
  getTags: function (scope) {
    var tagMeta = scope.kinja.tagMeta || scope.kinja.postMeta || {};

    return (tagMeta.tags || '').split(',');
  },

  /**
  * Gets index of article position in reading list
  *
  * @param HTMLElement adContainer the ad container currently being filled
  * @param object kinjaMeta kinja-specific post meta
  */
  getArticlePosition: function (adContainer, kinjaMeta) {
    if (document && adContainer && kinjaMeta.pageType === "permalink" && !(kinjaMeta.post && kinjaMeta.post.isFeatured)) {
      var readingListPostIds = Array.from(document.getElementsByClassName('js_reading-list-item')).map(function(post) {
        return post.dataset.postId;
      });

      if (readingListPostIds.length > 0) {
        var readingListItem = adContainer.closest('.js_reading-list-item');
        if (readingListItem) {
          var currentPostId = readingListItem.dataset.postId;
          return readingListPostIds.indexOf(currentPostId) + 2;
        }
      }

      // Starter post
      return 1;
    }

    // Not in reading list
    return 'none';
  },

  /**
   * Constructs associative array of targeting pairs from post meta
   *
   * @param Window scope the window to use for the kinja meta info.
   *
   */
  buildTargetingPairs: function (scope, positionTargeting, adContainer) {
    var kinjaMeta = scope.kinja.meta || {},
      post = scope.kinja.postMeta || {},
      content = scope.kinja.postContentRatings || [],
      experimentVariation = Experiments.getExperimentVariation(scope),
      experimentId = Experiments.getExperimentId(scope),
      socialTargeting, key,
      targeting = {},
      articlePosition = TargetingPairs.getArticlePosition(adContainer, kinjaMeta);

    // Begin slot level params AKA 'scp'
    targeting.slotOptions = {
      // Standard targeting options
      article_position: articlePosition,
      pos: positionTargeting || null,
      postId: post ? post.postId : null,
      socialReferrer: SocialReferrer.getSocialReferrer(),
      page: kinjaMeta.pageType,
      pd: PageDepth.getPageDepth(),
      mtfIFPath: '\/assets\/vendor\/doubleclick\/'
    };

    // Begin page level targeting pairs AKA cust_params
    targeting.pageOptions = {
      tags: this.getTags(scope),
      category: this.getCategories(scope),
      blogName: (kinjaMeta.blog || {}).name,
      ksg: (scope.Krux && scope.Krux.segments) ? scope.Krux.segments : undefined,
      kuid: (scope.Krux && scope.Krux.user) ? scope.Krux.user : undefined
    };

    if (experimentVariation !== null && experimentId !== null && positionTargeting) {
      targeting.slotOptions.exp_variation = experimentId + '_' + experimentVariation + '_' + positionTargeting;
    }

    return targeting;
  },

  /**
   * Constructs associative array of targeting pairs
   *
   * @param string forcedAdZone forced ad zone, if any
   * @param Window scope the window to use for the kinja meta info.
   * @param element adContainer optional ad container to determine positioning
   *
   */
  getTargetingPairs: function (forcedAdZone, positionTargeting, adContainer) {
    if (forcedAdZone && !window.kinja) {
      return { pageOptions : { forcedAdZone : forcedAdZone} };
    }
    if (!window.kinja) {
      return {};
    }

    var targetingOptions = this.buildTargetingPairs(window, positionTargeting, adContainer);

    targetingOptions.pageOptions.forcedAdZone = forcedAdZone || false;

    return targetingOptions;
  }
}
module.exports = TargetingPairs;
