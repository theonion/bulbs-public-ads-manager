var AdZone = {

  // Primarily for test stubbing purposes
  locationSearch: function() {
    return window.location.search;
  },

  getQueryParameter: function(name) {
    var regexS = '[\\?&]' + name + '=([^&#]*)';
    var regex = new RegExp(regexS);
    var results = regex.exec(this.locationSearch());
    var retval = '';

    if (results) {
      return decodeURIComponent(results[1].replace(/\+/g, ' '));
    }

    return retval;
  },

  forcedAdZone: function() {
    var paramZone = this.getQueryParameter('adzone');
    var postMeta = window.kinja.postMeta || {};
    var tags = postMeta.tags;
    var forceNonCollapse = /why your team sucks|wyts/.test(tags);
    var forceCollapse = /nsfw|gamergate/.test(tags);
    var forceCollapseZone = !forceNonCollapse && forceCollapse ? 'collapse' : null;
    var post = postMeta.post;
    var postZone = post ? post.adZone : null;
    return paramZone || forceCollapseZone || postZone;
  }
}
module.exports = AdZone;
