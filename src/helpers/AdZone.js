var AdZone = {

  // Primarily for test stubbing purposes
  locationSearch: function() {
    return window.location.search;
  },

  getQueryParameter: function(name) {
    const regexS = '[\\?&]' + name + '=([^&#]*)';
    const regex = new RegExp(regexS);
    const results = regex.exec(this.locationSearch());
    const retval = '';

    if (results) {
      return decodeURIComponent(results[1].replace(/\+/g, ' '));
    }

    return retval;
  },

  forcedAdZone: function() {
    const paramZone = this.getQueryParameter('adzone');
    const postMeta = window.kinja.postMeta || {};
    const tags = postMeta.tags;
    const forceNonCollapse = /why your team sucks|wyts/.test(tags);
    const forceCollapse = /nsfw|gamergate/.test(tags);
    const forceCollapseZone = !forceNonCollapse && forceCollapse ? 'collapse' : null;
    const post = postMeta.post;
    const postZone = post ? post.adZone : null;
    return paramZone || forceCollapseZone || postZone;
  }
}
module.exports = AdZone;
