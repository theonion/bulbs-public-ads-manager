require('./dfp');
var utils = require('./utils');
var TargetingPairs = require('./helpers/TargetingPairs');
var AdZone = require('./helpers/AdZone');
var Experiments = require('./helpers/Experiments');
var PageDepth = require('./helpers/PageDepth');

var ERROR = 'error';
var TABLE = 'table';

var AdManager = function(options) {
  var defaultOptions = {
    doReloadOnResize: true,
    resizeTimeout: null,
    debug: false,
    dfpId: 4246,
    amazonEnabled: true,
    enableSRA: false
  };
  var options = options || {};

  this.adUnits = options.adUnits;
  this.slots = {};
  this.adId = 0;
  this.initialized = false;
  this.viewportWidth = 0;
  this.oldViewportWidth = window.document.body.clientWidth;
  this.options = utils.extend(defaultOptions, options);
  this.bindContext();

  window.addEventListener('resize', this.handleWindowResize);

  var adManager = this;

  PageDepth.setPageDepth();
  
  this.googletag = window.googletag;
  this.googletag.cmd.push(function () {
    adManager.initGoogleTag();
  });
};


/**
 * Binds context for each event handler to always be the `AdManager` prototype
 *
 * @returns undefined;
*/
AdManager.prototype.bindContext = function() {
  this.handleWindowResize = this.handleWindowResize.bind(this);
  this.loadAds = this.loadAds.bind(this);
  this.onSlotRenderEnded = this.onSlotRenderEnded.bind(this);
  this.onImpressionViewable = this.onImpressionViewable.bind(this);
  this.onSlotOnload = this.onSlotOnload.bind(this);
};

/**
 * Reloads ads on the page if the window was resized and the functionality is enabled
 *
 * @returns undefined;
*/
AdManager.prototype.handleWindowResize = function() {
  if (!this.options.doReloadOnResize) {
    return;
  }

  this.viewportWidth = window.document.body.clientWidth;

  if (!this.oldViewportWidth || this.oldViewportWidth !== this.viewportWidth) {
    // viewport size has actually changed, reload ads
    this.oldViewportWidth = this.viewportWidth;
    this.reloadAds();
  }
};

/**
 * Initializes the google publisher tag and loads ads on the page
 *
 * @returns undefined
*/
AdManager.prototype.initGoogleTag = function() {
  var adManager = this;
  this.googletag.pubads().disableInitialLoad();
  this.googletag.pubads().enableAsyncRendering();
  this.googletag.pubads().updateCorrelator();
  
  if (this.options.enableSRA) {
    this.googletag.pubads().enableSingleRequest();
  }

  this.googletag.pubads().addEventListener('slotRenderEnded', adManager.onSlotRenderEnded);
  this.googletag.pubads().addEventListener('impressionViewable', adManager.onImpressionViewable);
  this.googletag.pubads().addEventListener('slotOnload', adManager.onSlotOnload);

  this.targeting = global.TARGETING || TargetingPairs.getTargetingPairs(AdZone.forcedAdZone()).pageOptions;

  this.setPageTargeting();

  this.initialized = true;

  this.loadAds();
};

/**
 * Fetch Amazon A9/Matchbuy/APS bids
 *
 * @returns undefined
*/
AdManager.prototype.fetchAmazonBids = function(elementId, gptSizes, slotName) {
	var adUnitPath = this.getAdUnitCode(),
	slotUnit = adUnitPath + '_' + slotName;
	window.apstag.fetchBids({
		slots: [{
			slotID: elementId,
			sizes: gptSizes,
			slotName: slotUnit
		}],
		timeout: 1e3
	}, callback = function (bids) {
		// Your callback method, in this example it triggers the first DFP request for googletag's disableInitialLoad integration after bids have been set
		window.headertag.cmd.push(function () {
			window.apstag.setDisplayBids();
		});
	});
};


/**
 * Sets global targeting regardless of ad slot based on the `TARGETING` global on each site
 *
 * @returns undefined
*/
AdManager.prototype.setPageTargeting = function() {
  // Bulbs Targeting Pairs
  for (var customCriteriaKey in this.targeting) {
    var customCriteriaValue = this.targeting[customCriteriaKey];
    if (customCriteriaValue) {
      this.googletag.pubads().setTargeting(customCriteriaKey, customCriteriaValue.toString());
    }
  }

  if (window.Krux && window.Krux.user) {
    this.googletag.pubads().setTargeting('kuid', Krux.user);
  }

  this.setUtmTargeting();
};

/**
  * Returns window.location.search value (primarily to make test stubbing a breeze, maybe a better way)
*/
AdManager.prototype.searchString = function () {
  return window.location.search;
}

_updateUtmCookie = function (utmSource, utmMedium, utmCampaign) {
  if (!window.Cookies) {
    return;
  }

  var inThirtyMinutes = new Date(new Date().getTime() + 30 * 60 * 1000);
  Cookies.set('utmSession', {
    utmSource: utmSource,
    utmMedium: utmMedium,
    utmCampaign: utmCampaign
  }, {
    expires: inThirtyMinutes
  });
};

_updateGptTargeting = function (key, value) {
  if (!value) {
    return;
  }

  googletag.pubads().setTargeting(key, value);
};

/**
  * Sets UTM key-vals as base targeting, if present
  *
  * @returns undefined
*/
AdManager.prototype.setUtmTargeting = function () {
  var searchString = this.searchString();

  var utmSource = utils.parseParam('utm_source', searchString);
  var utmMedium = utils.parseParam('utm_medium', searchString);
  var utmCampaign = utils.parseParam('utm_campaign', searchString);

  if (utmSource || utmMedium || utmCampaign) {
    _updateGptTargeting('utm_source', utmSource);
    _updateGptTargeting('utm_medium', utmMedium);
    _updateGptTargeting('utm_campaign', utmCampaign);

    _updateUtmCookie(utmSource, utmMedium, utmCampaign);
  } else if (window.Cookies) {
    var utmSession = JSON.parse(Cookies.get('utmSession') || '{}');

    _updateGptTargeting('utm_source', utmSession.utmSource);
    _updateGptTargeting('utm_medium', utmSession.utmMedium);
    _updateGptTargeting('utm_campaign', utmSession.utmCampaign);
  }
};

/**
 * First unloads all ad slots on the page, then loads them all again.
 *
 * @param {Element} element - Optional parameter if the ad refresh should be scoped to a particular container on the page
 *
 * @returns undefined
*/
AdManager.prototype.reloadAds = function(element) {
  this.googletag.pubads().updateCorrelator();
  this.unloadAds(element);
  this.loadAds(element);
};

/**
 * Custom callback to wrap ad slot with additional functionality
 *
 * @param {Event} event - Event passed through the GPT library
 * @returns undefined
*/
AdManager.prototype.onSlotRenderEnded = function(event) {
  this.rendered = true;

  var slotId = event.slot.getSlotId().getDomId();
  var element = document.getElementById(slotId);

  element.style.removeProperty('height');
  element.style.removeProperty('width');

  if (event.isEmpty) {
    element.setAttribute('data-ad-load-state', 'empty');
  } else {

    if (this.adUnits.units[element.dataset.adUnit].onSlotRenderEnded) {
      this.adUnits.units[element.dataset.adUnit].onSlotRenderEnded(event, element);
    }

    element.setAttribute('data-ad-load-state', 'loaded');
    utils.dispatchEvent(element, 'dfpSlotRenderEnded');
  }
};

/**
 * Custom callback to wrap ad slot with additional functionality
 *
 * @param {Event} event - Event passed through the GPT library
 * @returns undefined
*/
AdManager.prototype.onImpressionViewable = function(event) {
  var slotId = event.slot.getSlotId().getDomId();
  var element = document.getElementById(slotId);
  utils.dispatchEvent(element, 'dfpImpressionViewable');
};

/**
 * Custom callback to wrap ad slot with additional functionality
 *
 * @param {Event} event - Event passed through the GPT library
 * @returns undefined
*/
AdManager.prototype.onSlotOnload = function(event) {
  var slotId = event.slot.getSlotId().getDomId();
  var element = document.getElementById(slotId);
  utils.dispatchEvent(element, 'dfpSlotOnload');
};

/**
 * Generates a unique DOM id for each ad
 *.
 * @returns unique id for the ad
*/
AdManager.prototype.generateId = function() {
  this.adId += 1;
  return 'dfp-ad-' + this.adId.toString();
};

/**
 * Sorts through viewports slot sizes and returns all dimensions as an array.
 * Note, that this function does NOT filter out sizes that aren't able to display based on the viewport dimensions in the ad unit config.

 * @param {Array} Viewport size specifications for the ad slot, and list of eligbile sizes for each.
 * @returns {Array} An array of ad sizes belonging to the slot
*/

AdManager.prototype.adUnitSizes = function(adUnitSizes) {
  return adUnitSizes.filter(function (sizes) {
    return sizes[1];
  })[0];
};

/**
 * Returns the active sizes object from GPT as an array.
 *
 * @param {Array} A list of all sizes eligible to serve for an ad slot given the viewport size sent requirements to GPT in defineSlot.
 * @returns {Array} An array of ad sizes belonging to the slot
*/

AdManager.prototype.adSlotSizes = function(gptSizes) {
  return gptSizes.map(function (key) {
    return [key[Object.keys(key)[0]], key[Object.keys(key)[1]]];
  })
};

/**
 * Test if given element has the 'dfp' class, and so should hold an ad.
 *
 * @param {Element} element - element to test.
 * @returns true if it has the 'dfp' class, false otherwise
*/
AdManager.prototype.isAd = function (element) {
  return !!element.classList.contains('dfp');
};

/**
 * Find all ads on the page, optionally scoped
 *
 * @param {HTMLElement|String|HTMLCollection} element - element to scope the search to
 * @returns {Array} of {Element} objects representing all ad slots
*/
AdManager.prototype.findAds = function(el, useScopedSelector) {
  var ads = [];

  if (typeof(el) === 'string') {
    ads = document.querySelectorAll(el);
  } else if (el instanceof HTMLElement) {
    if (this.isAd(el)) {
      ads = [el];
    } else {
      ads = el.getElementsByClassName('dfp');
    }
  } else if (el instanceof HTMLCollection) {
    for (var i = 0; i < el.length; i++) {
      var thisEl = el[i];
      if (this.isAd(thisEl)) {
        ads.push(thisEl);
      } else {
        ads = ads.concat(thisEl.getElementsByClassName('dfp'));
      }
    }
  } else {
    if (useScopedSelector) {
      if (el) {
        ads = el.getElementsByClassName('dfp');
      }
    } else {
      ads = document.getElementsByClassName('dfp');
    }
  }

  return ads;
};

AdManager.prototype.logMessage = function(message, logLevel) {
  if (!console) {
    return;
  }

  console[logLevel](message);
};

/**
 * Informational utility function available in debug mode, logs information
 * on all currently defined ad slots, including their targeting
 *
 * @param
 * @returns
*/
AdManager.prototype.slotInfo = function() {
  for (var slotElementId in this.slots) {
    if (this.slots[slotElementId]) {
      var slot = this.slots[slotElementId];
      console.info(slot.getSlotElementId(), slot.getName());
      console.table(slot.getTargetingMap());
    }
  }
};

/**
 * Sets all the targeting for the slot
 *
 * @param {Element} element - Ad element housing ad slot
 * @param {Object} slot - Configured ad slot from the GPT
 * @returns undefined
*/
AdManager.prototype.setSlotTargeting = function(element, slot, adUnitConfig) {
  var slotTargeting = {};
  var positionTargeting = adUnitConfig.pos || adUnitConfig.slotName || element.dataset.adUnit;
  var kinjaPairs = TargetingPairs.getTargetingPairs(AdZone.forcedAdZone(), positionTargeting).slotOptions;

  if (element.dataset.targeting) {
    slotTargeting = JSON.parse(element.dataset.targeting);
  }

  slotTargeting = utils.extend(slotTargeting, kinjaPairs);

  for (var customKey in slotTargeting) {
    if (slotTargeting[customKey]) {
      slot.setTargeting(customKey, slotTargeting[customKey].toString());
    }
  }
};

AdManager.prototype.getAdUnitCode = function() {
  var adUnitCodes = [this.options.dfpId, this.options.dfpSiteCode];

  if (window.kinja) {
    var forcedAdZone = AdZone.forcedAdZone();
    var targetingPairs = TargetingPairs.getTargetingPairs(forcedAdZone);
    var adUnitName = forcedAdZone === 'collapse' ? 'collapse' : (targetingPairs.slotOptions.page === 'frontpage' ? 'front' : targetingPairs.slotOptions.page)

    adUnitCodes.push(adUnitName);
  } else if (window.dfpSiteSection) {
    adUnitCodes.push(window.dfpSiteSection);
  }

  return '/' + adUnitCodes.join('/');
};

/**
 * Configures a single ad, with the specified targeting
 *
 * @param {Element} element - Ad element to configure
 * @returns {Element} - Fully configured ad slot
*/
AdManager.prototype.configureAd = function (element) {
  var adUnitConfig = this.adUnits.units[element.dataset.adUnit];
  var adUnitPath = this.getAdUnitCode();
  var size;

  if (!adUnitConfig) {
    this.logMessage('Ad unit (' + element.dataset.adUnit + ') missing configuration', ERROR);
    return;
  }

  element.id = this.generateId();

  if (adUnitConfig.outOfPage) {
    slot = this.googletag.defineOutOfPageSlot(adUnitPath, element.id);
  } else {
    size = adUnitConfig.sizes[0][1];
    slot = this.googletag.defineSlot(adUnitPath, size, element.id);
    slot.defineSizeMapping(adUnitConfig.sizes);
  }

  if (element.id && element.id in this.slots) {
    // Slot has already been configured
    return this.slots[element.id];
  }

  if (!element.dataset) {
    this.logMessage('Browser does not support dataset', ERROR);
    return;
  }

  if (slot === null) {
    // This probably means that the slot has already been filled.
    return;
  }

  this.setSlotTargeting(element, slot, adUnitConfig);

  slot.addService(this.googletag.pubads());

  if (adUnitConfig.eagerLoad) {
    slot.eagerLoad = true;
  }

  this.slots[element.id] = slot;

  return slot;
};

/**
 * Pauses any ad loading
 *
 * @param None
 * @returns undefined
*/
AdManager.prototype.pause = function() {
  this.paused = true;
};

/**
 * Unpauses any ad loading
 *
 * @param None
 * @returns undefined
*/
AdManager.prototype.unpause = function() {
  this.paused = false;
};

/**
 * Loads all ads
 *
 * @param {Element} optional element to scope where to load ads in the document
 * @param {updateCorrelator} optional flag to force an update of the correlator value
 * @returns undefined
*/
AdManager.prototype.loadAds = function(element, updateCorrelator, useScopedSelector) {
  if (this.paused || !this.initialized) {
    return;
  }

  var slotsToLoad = [];
  var ads = this.findAds(element, useScopedSelector);

  if (!this.googletag.pubadsReady) {
    this.googletag.enableServices();
  }

  if (updateCorrelator) {
    this.googletag.pubads().updateCorrelator();
  }

  for (var i = 0; i < ads.length; i++) {
    var thisEl = ads[i],
      adUnitConfig = this.adUnits.units[thisEl.dataset.adUnit],
      slot,
      activeSizes,
      adUnitSizes,
      gptSlotSizes;

    if (AdZone.forcedAdZone() === 'collapse') {
      thisEl.classList.add('hide');
      continue;
    }

    // Makes slotEnabled optional in the config. Only check for slotEnableds that are falsy
	if (adUnitConfig && adUnitConfig.hasOwnProperty('slotEnabled') && !adUnitConfig.slotEnabled()) {
      continue;
    }

	if ((thisEl.getAttribute('data-ad-load-state') === 'loaded') || (thisEl.getAttribute('data-ad-load-state') === 'loading')) {
      continue;
    }

    slot = this.configureAd(thisEl);

    if (slot && slot.eagerLoad) {
      slotsToLoad.push(slot);
    }

    if (this.options.amazonEnabled && !adUnitConfig.outOfPage) {

    /**
     * Try to use the gpt slot.getSizes method to retrieve the active sizes given the viewport parameters inside the ad config.
     * This method is undocumented, and could be removed. When not available, fall back to all sizes specified in the ad unit itself.
     * This is not optimal, as sizes which cannot be displayed due to the viewport dimensions will be requested from A9. It is thus used as a fallback.
     * See Docs here https://developers.google.com/doubleclick-gpt/reference#googletagslot
    */

      if (slot && typeof slot.getSizes == 'function') {
        gptSlotSizes = slot.getSizes();
        activeSizes = this.adSlotSizes(gptSlotSizes);
      } else {
        adUnitSizes = this.adUnitSizes(adUnitConfig.sizes)[1];
        activeSizes = adUnitSizes;
      }

      if (adUnitConfig.amazonEnabled && activeSizes && activeSizes.length) {
        this.fetchAmazonBids(thisEl.id, activeSizes, adUnitConfig.slotName);
      }
    }

    if (typeof window.headertag === 'undefined' || window.headertag.apiReady !== true) {
      this.googletag.display(thisEl.id);
    } else {
      window.headertag.display(thisEl.id);
    }

    if (slot.eagerLoad && !this.options.enableSRA) {
      this.refreshSlot(thisEl);
    }
  }

  if (slotsToLoad.length && this.options.enableSRA) {
    this.refreshSlots(slotsToLoad);
  }

};

/**
  * Uses the `cmd` async GPT queue to enqueue ad manager function to run
  * if the GPT API is not yet ready.  Assures slots have been configured,
  * etc. prior to trying to make the ad request
  *
  * @param {domElement} DOM element containing the DFP ad slot
  * @returns undefined
*/
AdManager.prototype.asyncRefreshSlot = function (domElement) {
  var adManager = this;

  if (this.googletag.apiReady) {
    this.refreshSlot(domElement);
  } else {
    this.googletag.cmd.push(function () {
      adManager.refreshSlot(domElement);
    });
  }
};

/**
  * Fetches a new ad for just single dom element
  * Uses the `cmd` async GPT queue to enqueue ad manager function to run
  * if the GPT API is not yet ready.  Assures slots have been configured,
  * etc. prior to trying to make the ad request
  *
  * @param {domElement} DOM element containing the DFP ad slot
  * @returns undefined
*/
AdManager.prototype.refreshSlot = function (domElement) {
  if ((domElement.getAttribute('data-ad-load-state') === 'loaded') || (domElement.getAttribute('data-ad-load-state') === 'loading')) {
    return;
  }

  var slot = this.slots[domElement.id];
  var ads = this.findAds(domElement);

  if (slot) {
    domElement.setAttribute('data-ad-load-state', 'loading');
    this.refreshSlots([slot], ads);
  }
};

/**
 * Fetches a new ad for each slot passed in
 *
 * @param {slotsToLoad} One or many slots to fetch new ad for
 * @param {domElement} DOM element containing the DFP ad
 * @returns undefined
*/
AdManager.prototype.refreshSlots = function(slotsToLoad) {

  if (slotsToLoad.length === 0) {
    return;
  }

  if (typeof window.headertag === 'undefined' || window.headertag.apiReady !== true) {
    this.googletag.pubads().refresh(slotsToLoad, {
      changeCorrelator: false
    });
  } else {
    window.headertag.pubads().refresh(slotsToLoad, {
      changeCorrelator: false
    });
  }
};


/**
 * Unloads all ads
 *
 * @param {Element} optional element to scope where to unload ads in the document
 * @returns undefined
*/
AdManager.prototype.unloadAds = function(element) {
  if (!this.initialized) {
    return;
  }

  var ads = this.findAds(element);
  var ad, i;

  var slots = [];
  for (i = 0; i < ads.length; i++) {
    ad = ads[i];
    ad.style.height = ad.offsetHeight + 'px';
    ad.style.width = ad.offsetWidth + 'px';

    if (ad.id in this.slots) {
      slots.push(this.slots[ad.id]);
      delete this.slots[ad.id];
    }

    ad.setAttribute('data-ad-load-state', 'unloaded');
  }
  this.googletag.pubads().clear(slots);
};

var AdManagerWrapper = {
  init: function(options) {
    return new AdManager(options);
  }
};

module.exports = AdManagerWrapper;
