var AdZone = {
 /**
  * Derives the query string parameter from window.location
  *
  * @returns {String};
 */
  getQueryParameter: function (name, scope) {
    var regexS = '[\\?&]' + name + '=([^&#]*)';
    var regex = new RegExp(regexS);
    var results = regex.exec((scope || window).location.search);
    var retval = '';

    if (results) {
      return decodeURIComponent(results[1].replace(/\+/g, ' '));
    }

    return retval;
  },

 /**
  * Retrieves the adzone from the list of query params
  *
  * @returns String;
 */
  forcedAdZone: function (scope) {
    var paramZone = this.getQueryParameter('adzone', scope);

    if (paramZone) {
      return paramZone;
    }

    if (!window.kinja) {
      return null;
    }

    var postMeta = window.kinja.postMeta || {};
    var tags = postMeta.tags;
    var forceNonCollapse = /why your team sucks|wyts/.test(tags);
    var forceCollapse = /nsfw|gamergate/.test(tags);
    var forceCollapseZone = !forceNonCollapse && forceCollapse ? 'collapse' : null;
    var post = postMeta.post;
    var postZone = post ? post.adZone : null;
    return forceCollapseZone || postZone;
  }
};

module.exports = AdZone;
