/**
 * Sets up the array of ad slots to be sent to Integral Ad Science (IAS)
 * via their Publisher Optimization Tag (//cdn.adsafeprotected.com/iasPET.1.js)
 *
 * @param {Array} gtSlots - one or many gptSlots to fetch new ad for
 * @returns {Array} iasPETSlots - array of PETSlot objects
 */
module.exports = function(gtSlots) {
    var iasPETSlots = [];
    for (var i = 0; i < gtSlots.length; i++) {
        var sizes = gtSlots[i].activeSizes || [[0, 0], [1, 1]];
        iasPETSlots.push({
            adSlotId: gtSlots[i].getSlotElementId(),
            size: sizes,
            adUnitPath: gtSlots[i].getAdUnitPath()
        });
    }
    return iasPETSlots;
}