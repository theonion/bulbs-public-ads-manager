/**
 * Module for requesting Integral Ad Science's (IAS) Publisher Optimization data
 * using the publisher optimization tag which should have been previously loaded
 * on the page from //cdn.adsafeprotected.com/iasPET.1.js)
 *
 *
 * @param {slots} One or many slots to fetch new ad for
 * @param {iasPubId} int provided used to identify the publisher to IAS
 * @returns undefined
 */

module.exports = function(slots, iasPubId) {
    window.__iasPET = window.__iasPET || {};
    window.__iasPET.queue = window.__iasPET.queue || [];
    window.__iasPET.pubId = iasPubId;
    alert('fired');
    var iasPETSlots = [];
    // iasDataHandler = function(adSlotData) {
    //   clearTimeout(__iasPETTimeoutRequestAds);
    //   __iasPET.setTargetingForGPT();
    // };

    for (var i = 0; i < slots.length; i++) {
        var sizes = slots[i].getSizes().map(function(size) {
            if (size.getWidth && size.getHeight){
                return [size.getWidth(), size.getHeight()];
            } else {
                return [1, 1];
            }
        });
        iasPETSlots.push({
            adSlotId: slots[i].getSlotElementId(),
            //size: can either be a single size (e.g., [728, 90])
            // or an array of sizes (e.g., [[728, 90], [970, 90]])
            size: sizes,
            adUnitPath: slots[i].getAdUnitPath()
        });
    }
    console.log('request-ias-data.js -> iasPETSlots:');
    console.log(iasPETSlots);
    // make the request to PET. if your page makes multiple ad requests to DFP
    // (e.g., lazily loaded ads, infinite scrolling pages, etc.), you should make
    // a request to PET before every request to DFP
    __iasPET.queue.push({
        adSlots: iasPETSlots,
        dataHandler: window.__iasPET.setTargetingForGPT()
    });
}