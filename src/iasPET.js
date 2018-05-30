/**
 * Loading the IAS Publisher Optimization tag
 */

window.__iasPET = window.__iasPET || {};
window.__iasPET.queue = window.__iasPET.queue || [];

var useSSL = 'https:' === document.location.protocol;
var iasPET = document.createElement('script');

iasPET.async = true;
iasPET.type = 'text/javascript';
iasPET.src = (useSSL ? 'https:' : 'http:') + '//cdn.adsafeprotected.com/iasPET.1.js';

var node = document.getElementsByTagName('script')[1]; 
// Inserting prior to second script because gpt needs to exist prior to any of the iasPET functionality being executed 
node.parentNode.insertBefore(iasPET, node);



module.exports = window.__iasPET;