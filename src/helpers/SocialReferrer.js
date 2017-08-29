var SocialReferrer = {
  getReferrer: function() {
    return window.document.referrer || '';
  },

  isSocialReferrer: function() {
    var socialReferrer = this.getReferrer().match(/\b(?:facebook|instagram|pinterest|reddit|twitter|tumblr|t\.co)\b/i);
    if (socialReferrer) {
      return true;
    }
    return false;
  }
};
module.exports = SocialReferrer;
