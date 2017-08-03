require('./dfp');
var utils = require('./utils');
var targeting = require('./helpers/targetingPairs');

var ERROR = 'error';
var TABLE = 'table';

var AdManager = function(options) {
  var defaultOptions = {
    doReloadOnResize: true,
    resizeTimeout: null,
    debug: false,
    dfpId: 4246,
    amazonEnabled: true,
  };
  var options = options || {};

  this.adUnits = options.adUnits;
  this.slots = {};
  this.adId = 0;
  this.initialized = false;
  this.viewportWidth = 0;
  this.oldViewportWidth = window.document.body.clientWidth;
  this.targeting = global.TARGETING;
  this.options = utils.extend(defaultOptions, options);

  if (this.options.amazonEnabled) {
    this.amazonId = options.amazonA9ID;
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

  this.googletag.pubads().addEventListener('slotRenderEnded', adManager.onSlotRenderEnded);
  this.googletag.pubads().addEventListener('impressionViewable', adManager.onImpressionViewable);
  this.googletag.pubads().addEventListener('slotOnload', adManager.onSlotOnload);

  this.initBaseTargeting();
  if (this.options.amazonEnabled) {
    this.initAmazonA9();
  }

  this.initialized = true;

  this.loadAds();
};

/**
 * initializes A9
 *
 * @returns undefined
*/
AdManager.prototype.initAmazonA9 = function() {
  if (typeof amznads !== "undefined" && amznads.apiReady) {
    this.amznads = amznads;
    this.amznads.getAds(this.amazonId);
    this.amznads.setTargetingForGPTAsync('amznslots');
  }
};


/**
 * Sets global targeting regardless of ad slot based on the `TARGETING` global on each site
 *
 * @returns undefined
*/
AdManager.prototype.initBaseTargeting = function() {
  var baseTargeting = targeting.getTargetingPairs().pageOptions;

  // Bulbs Targeting Pairs
  for (var customCriteriaKey in this.targeting) {
    var customCriteriaValue = this.targeting[customCriteriaKey];
    if (customCriteriaValue) {
      this.googletag.pubads().setTargeting(customCriteriaKey, customCriteriaValue.toString());
    }
  }
  // Kinja Targeting Pairs
  for (var customCriteriaKey in baseTargeting) {
    var customCriteriaValue = baseTargeting[customCriteriaKey];
    if (customCriteriaValue) {
      this.googletag.pubads().setTargeting(customCriteriaKey, customCriteriaValue.toString());
    }
  }

  if (window.Krux && window.Krux.user) {
    this.googletag.pubads().setTargeting('kuid', Krux.user);
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
    for (var i = 0; i < el.length; i++) {
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
AdManager.prototype.setSlotTargeting = function(element, slot, standardParams) {
  var slotTargeting = {};
  for (var customKey in this.targeting) {
    if (this.targeting[customKey]) {
      slot.setTargeting(customKey, this.targeting[customKey].toString());
    }
  }

  if (element.dataset.targeting) {
    slotTargeting = JSON.parse(element.dataset.targeting);
  }

  if (standardParams) {
    Object.assign(slotTargeting, standardParams);
  }

  for (var customKey in slotTargeting) {
    if (slotTargeting[customKey]) {
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

  var slotName = this.options.dfpSiteCode || "",
    kinjaMeta = window.kinja.meta,
    postMeta = window.kinja.postMeta || {},
    currentBlog = kinjaMeta.blog,
    blogSales = kinjaMeta.blogSales,
    pageType = kinjaMeta.pageType,
    getExperimentVariation = function(scope) {
      var expScope = scope || window,
        variation = expScope.cxApi ? expScope.cxApi.getChosenVariation(expScope.gaExperimentId) : null;
      return (variation !== null && variation >= 0 && variation < 26) ? String.fromCharCode(variation + 65) : null;
    },

    getExperimentId = function(scope) {
      var expScope = scope || window;
      return (expScope.gaExperimentId !== undefined) ? expScope.gaExperimentId : null;
    },

    getQueryParameter = function(name) {
      var regexS = '[\\?&]' + name + '=([^&#]*)',
        regex = new RegExp(regexS),
        results = regex.exec(window.location.search),
        retval = '';

      if (results) {
        return decodeURIComponent(results[1].replace(/\+/g, ' '));
      }

      return retval;
    },
    expVar = (getExperimentVariation() !== null && getExperimentId() !== null) ? getExperimentId() + '_' + getExperimentVariation() : null,
    paramZone = getQueryParameter('adzone'),
    forcedAdZone = (function(pZone, meta) {
      var tags = meta.tags,
        forceNonCollapse = /why your team sucks|wyts/.test(tags),
        forceCollapse = /nsfw|gamergate/.test(tags),
        forceCollapseZone = !forceNonCollapse && forceCollapse ? 'collapse' : null,
        post = meta.post,
        postZone = post ? post.adZone : null;
      return pZone || forceCollapseZone || postZone;
      // kinjaMeta.post is not available at this time so we must reference kinja.postMeta
    }(paramZone, postMeta)),

    // figure out the defined adZone
    adZone = forcedAdZone && forcedAdZone === 'collapse' ? 'collapse' : (pageType === 'frontpage' ? 'front' : pageType),
    networkId = blogSales.adNetworkId || 4246,
    unitName = '/' + [networkId, blogSales.adSiteName, adZone].join('/'),
    adUnitConfig = this.adUnits.units[element.dataset.adUnit],
    size = adUnitConfig.sizes[0][1],
    tags = kinjaMeta.tags,
    post = postMeta.post;

  element.id = this.generateId();
  slot = this.googletag.defineSlot(unitName, size, element.id);

  if (element.id && element.id in this.slots) {
    // Slot has already been configured
    return this.slots[element.id];
  }

  if (!element.dataset) {
    this.logMessage('Browser does not support dataset', ERROR);
    return;
  }

  if (!adUnitConfig) {
    this.logMessage('Ad unit (' + element.dataset.adUnit + ') missing configuration', ERROR);
    return;
  }

  slot.defineSizeMapping(adUnitConfig.sizes);

  if (slot === null) {
    // This probably means that the slot has already been filled.
    return;
  }
  slotTargeting = targeting.getTargetingPairs(forcedAdZone);
  
  if (element.dataset.targeting && slotTargeting.slotOptions) {
   utils.extend(slotTargeting.slotOptions, JSON.parse(element.dataset.targeting));
  } else {
	slotTargeting = JSON.parse(element.dataset.targeting);
    slotTargeting.pos = positionTargeting;
    element.dataset.targeting = JSON.stringify(slotTargeting);
  }

  this.setSlotTargeting(element, slot, slotTargeting.slotOptions);

  slot.addService(this.googletag.pubads());

  if (adUnitConfig.eagerLoad) {
    slot.eagerLoad = true;
  }

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
AdManager.prototype.loadAds = function(element, updateCorrelator) {
  if (this.paused || !this.initialized) {
    return;
  }

  var slotsToLoad = [];
  var ads = this.findAds(element);

  if (!this.googletag.pubadsReady) {
    this.googletag.enableServices();
  }

  if (updateCorrelator) {
    this.googletag.pubads().updateCorrelator();
  }

  for (var i = 0; i < ads.length; i++) {
    var thisEl = ads[i];

    if ((thisEl.getAttribute('data-ad-load-state') === 'loaded') || (thisEl.getAttribute('data-ad-load-state') === 'loading')) {
      continue;
    }

    var slot = this.configureAd(thisEl);

    if (slot) {
      slotsToLoad.push(slot);
    }

    if (typeof window.headertag === 'undefined' || window.headertag.apiReady !== true) {
      this.googletag.display(thisEl.id);
    } else {
      window.headertag.display(thisEl.id);
    }

    if (slot.eagerLoad) {
      thisEl.setAttribute('data-ad-load-state', 'loading');
      this.refreshSlots([slot], ads);
    }
  }
};

/**
 * Fetches a new ad for just single dom element
 *
 * @param {domElement} DOM element containing the DFP ad slot
 * @returns undefined
*/
AdManager.prototype.refreshSlot = function (domElement) {
  var that = this;
  if (this.options.amazonEnabled && this.amznads) {
    params = {
     id: this.amazonId,
     callback: this.amazonAdRefresh.bind(this, domElement),
     timeout: 500
   };
  } else {
    this.refreshAds(slots);
  }
};

AdManager.prototype.amazonAdRefresh = function (domElements) {
  this.googletag.pubads().clearTargeting('amznslots');
  this.amznads.setTargetingForGPTAsync('amznslots');
  this.refreshAds(domElements);
};

AdManager.prototype.doGetAmazonAdsCallback = function (params) {
  this.amznads.lastGetAdsCallback = Date.now();
  this.amznads.getAdsCallback(params.id, params.callback, params.timeout);
};

AdManager.prototype.amazonAdRefreshThrottled = function (params) {
  if (typeof this.amznads.lastGetAdsCallback === 'undefined') {
    this.doGetAmazonAdsCallback(params);
  // returns true if amznads.lastGetAdsCallback was updated > 10 seconds ago
  } else if (Date.now() - this.amznads.lastGetAdsCallback > 1e4) {
    this.doGetAmazonAdsCallback(params);
  } else {
    params.callback.call();
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
  * Uses the `cmd` async GPT queue to enqueue ad manager function to run
  * if the GPT API is not yet ready.  Assures slots have been configured,
  * etc. prior to trying to make the ad request
  *
  * @param {domElement} DOM element containing the DFP ad slot
  * @returns undefined
*/
AdManager.prototype.refreshAds = function (domElement) {
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
AdManager.prototype.refreshSlots = function(slotsToLoad, domElement) {

  if (slotsToLoad.length === 0) {
    return;
  }

  if (typeof window.headertag === 'undefined' || window.headertag.apiReady !== true) {
    this.googletag.pubads().refresh(slotsToLoad, {
      changeCorrelator: false
    });
  } else {
    window.headertag = window.googletag;
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
