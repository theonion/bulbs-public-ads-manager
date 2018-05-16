var SocialReferrer = {
  /**
   * Retrieves the referrer from the window
   *
   * @returns {String};
   */
  getReferrer: function () {
    return window.document.referrer || '';
  },
 /**
  * Determines if the referrer is social media.
  * If true, we want to return the type of social media
  *
  * @returns {Boolean};
  */
  isSocialReferrer: function () {
    // brandMap is used to match when it is a twitter short url
    var socialReferrer = this.getReferrer().match(/\b(?:facebook|instagram|pinterest|reddit|twitter|tumblr|t\.co)\b/i),
      brandMap = {
        't.co': 'twitter'
      };
    if (socialReferrer) {
      // if the match is positive, return the first result and check if it is a twitter short url
      socialReferrer = socialReferrer[0].toLowerCase();
      return brandMap[socialReferrer] || socialReferrer;
    }
    return false;
  }
};
module.exports = SocialReferrer;
