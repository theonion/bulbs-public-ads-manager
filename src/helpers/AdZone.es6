function getQueryParameter(name) {
  const regexS = '[\\?&]' + name + '=([^&#]*)';
  const regex = new RegExp(regexS);
  const results = regex.exec(window.location.search);
  const retval = '';

  if (results) {
    return decodeURIComponent(results[1].replace(/\+/g, ' '));
  }

  return retval;
}
export function forcedAdZone() {
  const paramZone = getQueryParameter('adzone');
  const postMeta = window.kinja.postMeta || {};
  const tags = postMeta.tags;
  const forceNonCollapse = /why your team sucks|wyts/.test(tags);
  const forceCollapse = /nsfw|gamergate/.test(tags);
  const forceCollapseZone = !forceNonCollapse && forceCollapse ? 'collapse' : null;
  const post = postMeta.post;
  const postZone = post ? post.adZone : null;
  return paramZone || forceCollapseZone || postZone;
}
