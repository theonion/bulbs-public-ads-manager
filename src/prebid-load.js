/**
 * Prep pbjs que
 */

window.pbjs = window.pbjs || {};
window.pbjs.que = window.pbjs.que || [];

require('./prebid.js');
module.exports = window.pbjs;