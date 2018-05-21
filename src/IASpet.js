// this is an *example* function. in your implementation, you will point to // an existing function that you use to request ads from DFP
/* --- nah don't need ?👇
function requestAds() {
	googletag.cmd.push(function() {
	// display the ads on your page. replace these IDs with those on your page.
		googletag.display('div-gpt-ad-1411587747174-0');
		googletag.display('div-gpt-ad-1411587747175-0');
		googletag.display('div-gpt-ad-1411587747176-0');
	});
}
*/

// Set up IAS pet.js
var iasDataHandler, __iasPET = __iasPET || {};
_iasPET.queue = __iasPET.queue || [];
__iasPET.pubId = '927245'; // 👈 this shouldn't go here
// this is the maximum amount of time in milliseconds to wait for a PET response // before requesting ads without PET data. we recommend starting at 2 seconds
// when testing and adjusting downwards as appropriate.
// remember to replace 'requestAds' below with the function you use to request // ads from DFP.
var IASPET_TIMEOUT = 2000; // 👈 haha....yeah right
var __iasPETTimeoutRequestAds = setTimeout(requestAds, IASPET_TIMEOUT);

// this function will be called when a PET response is received. it will
// set the targeting data for DFP and request ads
// remember to replace requestAds() with the function you use for requesting // ads from DFP
var iasDataHandler = function(adSlotData) {
	clearTimeout(__iasPETTimeoutRequestAds);
	__iasPET.setTargetingForGPT();
	requestAds();
};

// make the PET request
googletag.cmd.push(function() {
	// read the currently defined
	// all GPT ad slots should be
	var gptSlots = googletag.pubads().getSlots();
	var iasPETSlots = [];
	for (var i = 0; i < gptSlots.length; i++) {
		var sizes = gptSlots[i].getSizes().map(function(size) {
			if (size.getWidth && size.getHeight){
				return [size.getWidth(), size.getHeight()];
			} else {
				return [1, 1];
			}
		});
		iasPETSlots.push({
			adSlotId: gptSlots[i].getSlotElementId(),
			//size: can either be a single size (e.g., [728, 90])
			// or an array of sizes (e.g., [[728, 90], [970, 90]])
			size: sizes,
			adUnitPath: gptSlots[i].getAdUnitPath()
		});
	}
	// make the request to PET. if your page makes multiple ad requests to DFP
	// (e.g., lazily loaded ads, infinite scrolling pages, etc.), you should make
	// a request to PET before every request to DFP
	__iasPET.queue.push({
		adSlots: iasPETSlots,
		dataHandler: iasDataHandler
	});
});












