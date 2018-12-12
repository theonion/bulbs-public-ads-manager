/**
 * Google-provided DFP code, slight modifications to
 */

window.googletag = window.googletag || {};
window.googletag.cmd = window.googletag.cmd || [];
window.headertag = window.headertag || {};

var gads = document.createElement('script');
gads.async = true;
gads.type = 'text/javascript';

var useSSL = 'https:' === document.location.protocol;
gads.src = (useSSL ? 'https:' : 'http:') + '//www.googletagservices.com/tag/js/gpt.js';

var node = document.getElementsByTagName('script')[0];

if (node) {
  node.parentNode.insertBefore(gads, node);
}

module.exports = window.googletag;
