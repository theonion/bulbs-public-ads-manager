export function isSocialReferrer() {
  var socialReferrer = (window.document.referrer || '').match(/\b(?:facebook|instagram|pinterest|reddit|twitter|tumblr|t\.co)\b/i);
  if (socialReferrer) {
    return true;
  }
  return false;
};
