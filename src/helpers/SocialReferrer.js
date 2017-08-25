var SocialReferrer = {
  isSocialReferrer: function () {
    var socialReferrer = (window.document.referrer || '').match(/\b(?:facebook|instagram|pinterest|reddit|twitter|tumblr|t\.co)\b/i);
    if (socialReferrer) {
      return true;
    }
    return false;
  }
};
module.exports = SocialReferrer;
