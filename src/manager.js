// this should be provided externally
var adUnits = require('bulbs.ads.units');

var googletag = require('./dfp');
var utils = require('./utils');

var WARN = 'warn';
var ERROR = 'error';
var INFO = 'info';

var AdManager = function(options) {
  var defaultOptions = {
    doReloadOnResize: true,
    resizeTimeout: null,
    debug: false,
    dfpId: 1009948
  };
  var options = options || {};

  this.adUnits = adUnits;
  this.slots = {};
  this.adId = 0;
  this.initialized = false;
  this.viewportWidth = 0;
  this.oldViewportWidth = window.document.body.clientWidth;
  this.targeting = utils.extend({ dfp_site: adUnits.settings.dfpSite }, global.TARGETING);
  this.options = utils.extend(defaultOptions, options);
  this.options.filterSlotsByViewport = adUnits.settings.hasOwnProperty('filterSlotsByViewport');
  if (this.options.filterSlotsByViewport) {
    this.options.viewportThreshold = adUnits.settings.filterSlotsByViewport;
  }

  this.bindContext();

  window.addEventListener('resize', this.handleWindowResize);

  var adManager = this;

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

  this.googletag.pubads().enableSingleRequest();
  this.googletag.pubads().disableInitialLoad();
  this.googletag.pubads().collapseEmptyDivs(true);

  this.googletag.pubads().addEventListener('slotRenderEnded', adManager.onSlotRenderEnded);

  this.initBaseTargeting();

  this.initialized = true;

  this.loadAds();
  if (this.options.filterSlotsByViewport) {
    setInterval(adManager.loadAds, 200);
  }
};

/**
 * Sets global targeting regardless of ad slot based on the `TARGETING` global on each site
 *
 * @returns undefined
*/
AdManager.prototype.initBaseTargeting = function() {
  for (var customCriteriaKey in this.targeting) {
    var customCriteriaValue = this.targeting[customCriteriaKey];

    if(customCriteriaValue) {
      this.googletag.pubads().setTargeting(customCriteriaKey, customCriteriaValue.toString());
    }
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

  if (adUnits.units[element.dataset.adUnit].onSlotRenderEnded) {
    adUnits.units[element.dataset.adUnit].onSlotRenderEnded(event, element);
  }

  element.setAttribute('data-ad-load-state', 'loaded');
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
 * Test if given element has the 'dfp' class, and so should hold an ad.
 *
 * @param {Element} element - element to test.
 * @returns true if it has the 'dfp' class, false otherwise
*/
AdManager.prototype.isAd = function (element) {
  return !!utils.hasClass(element, 'dfp');
};

/**
 * Find all ads on the page, optionally scoped
 *
 * @param {HTMLElement|String|HTMLCollection} element - element to scope the search to
 * @returns {Array} of {Element} objects representing all ad slots
*/
AdManager.prototype.findAds = function (el) {
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
    for(var i=0; i < el.length; i++) {
      var thisEl = el[i];
      if (this.isAd(thisEl)) {
        ads.push(thisEl);
      } else {
        ads = ads.concat(thisEl.getElementsByClassName('dfp'));
      }
    }
  } else {
    ads = document.getElementsByClassName('dfp');
  }

  return ads;
};

/**
 * Filter ads on the page by viewport threshold, if enabled
 *
 * @param {HTMLCollection} ads - Array of ads to confirm if within viewport
 * @returns {Array} of {Element} objects representing filtered ad slots
*/
AdManager.prototype.filterAds = function(ads) {
  if (this.options.filterSlotsByViewport) {
    var filteredAds = [];
    var nearViewport;
    for (var i = 0, l = ads.length; i < l; i ++) {
      var ad = ads[i];
      nearViewport = utils.elementNearViewport(ad, {
        withinDistance: this.options.viewportThreshold
      });
      if (nearViewport) {
        filteredAds.push(ad);
      }
    }
    return filteredAds;
  }
  else {
    return ads;
  }
};

AdManager.prototype.logMessage = function(message, logLevel) {
  if (!console) {
    return;
  }

  console[logLevel](message);
};

/**
 * Sets all the targeting for the slot
 *
 * @param {Element} element - Ad element housing ad slot
 * @param {Object} slot - Configured ad slot from the GPT
 * @returns undefined
*/
AdManager.prototype.setSlotTargeting = function(element, slot) {
  for (customKey in this.targeting) {
    if(this.targeting[customKey]) {
      slot.setTargeting(customKey, this.targeting[customKey].toString());
    }
  }

  var slotTargeting = {};
  if (element.dataset.targeting) {
    slotTargeting = JSON.parse(element.dataset.targeting);
  }

  for (customKey in slotTargeting) {
    if(slotTargeting[customKey]) {
      slot.setTargeting(customKey, slotTargeting[customKey].toString());
    }
  }
};

/**
 * Configures a single ad, with the specified targeting
 *
 * @param {Element} element - Ad element to configure
 * @returns {Element} - Fully configured ad slot
*/
AdManager.prototype.configureAd = function (element) {
  if (element.id && element.id in this.slots) {
    // Slot has already been configured
    return this.slots[element.id];
  }

  element.id = this.generateId();

  if (!element.dataset) {
    this.logMessage('Browser does not support dataset', ERROR);
    return;
  }

  var adUnitConfig = this.adUnits.units[element.dataset.adUnit];
  if (!adUnitConfig) {
    this.logMessage('Ad unit (' + element.dataset.adUnit + ') missing configuration', ERROR);
    return;
  }

  var slotName = adUnitConfig.slotName || element.dataset.adUnit;
  var adUnitPath = '/' + this.options.dfpId + '/' + slotName;

  // Use first ad size as the default
  var size = adUnitConfig.sizes[0][1];
  var slot = this.googletag.defineSlot(adUnitPath, size, element.id);
  slot.defineSizeMapping(adUnitConfig.sizes);

  if (slot === null) {
    // This probably means that the slot has already been filled.
    return;
  }

  this.setSlotTargeting(element, slot);

  slot.addService(this.googletag.pubads());

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
 * @returns undefined
*/
AdManager.prototype.loadAds = function(element) {
  if (this.paused || !this.initialized) {
    return;
  }

  var ads = this.filterAds(this.findAds(element));
  var slotsToLoad = [];

  if (!this.googletag.pubadsReady) {
    this.googletag.enableServices();
  }

  for(var i = 0; i < ads.length; i++) {
    var element = ads[i];

    if ((element.getAttribute('data-ad-load-state') === 'loaded') || (element.getAttribute('data-ad-load-state') === 'loading')) {
      continue;
    }

    var slot = this.configureAd(element);

    if (slot) {
      slotsToLoad.push(slot);
    }
    this.googletag.display(element.id);
    element.setAttribute('data-ad-load-state', 'loading');
  }


  if (slotsToLoad.length > 0) {
    this.googletag.pubads().refresh(slotsToLoad);
  }
};

/**
 * Unloads all ads
 *
 * @param {Element} optional element to scope where to unload ads in the document
 * @returns undefined
*/
AdManager.prototype.unloadAds = function(element) {
  if (! this.initialized) {
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

module.exports = AdManager;
