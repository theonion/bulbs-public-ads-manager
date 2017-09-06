var SocialReferrer = {
  /**
   * Retrieves the referrer from the window
   *
   * @returns {String};
   */
  getReferrer: function() {
    return window.document.referrer || '';
  },
 /**
  * Determines if the referrer is social media
  *
  * @returns {Boolean};
  */
  isSocialReferrer: function() {
    var socialReferrer = this.getReferrer().match(/\b(?:facebook|instagram|pinterest|reddit|twitter|tumblr|t\.co)\b/i);
    if (socialReferrer) {
      return true;
    }
    return false;
  }
};
module.exports = SocialReferrer;
