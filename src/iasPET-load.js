/**
 * Method of loading the IAS Publisher Optimization tag if needed 
 * see: gawkermedia/kinja-mantle/packages/standalone-ad-manager
 */

if (!window.__iasPET){
    var useSSL = 'https:' === document.location.protocol;
    var iasPET = document.createElement('script');

    iasPET.async = true;
    iasPET.type = 'text/javascript';
    iasPET.src = (useSSL ? 'https:' : 'http:') + '//cdn.adsafeprotected.com/iasPET.1.js';

    var node = document.getElementsByTagName('script')[0];
    node.parentNode.insertBefore(iasPET, node);
}

module.exports = window.__iasPET;