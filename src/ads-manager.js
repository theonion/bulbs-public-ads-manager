// this should be provided externally
var adUnits = require('adUnits');

var googletag = require('./dfp');
var utils = require('./utils');

module.exports = {

  init: function (debug) {
    if (typeof debug === 'undefined') {
      this.debug = window.location.hostname.indexOf('.local') >= 0;
    } else {
      this.debug = debug;
    }
    this.debug = false;

    this.slots = {};
    this.adId = 0;
    this.targeting = utils.extend({dfp_site: 'onion'}, global.TARGETING)
    this.initialized = false;

    this.debugAds = {};

    this.doReloadOnResize = true;

    var adManager = this;
    var resizeTimeout = null;
    var viewportWidth = 0;
    var oldViewportWidth = null;
    global.addEventListener('resize', function (e) {

      if (this.doReloadOnResize) {
        viewportWidth = global.document.body.clientWidth;

        if (!oldViewportWidth || oldViewportWidth !== viewportWidth) {
          // viewport size has actually changed, reload ads
          oldViewportWidth = viewportWidth;

          if (resizeTimeout !== null) {
            clearTimeout(resizeTimeout);
          }

          resizeTimeout = setTimeout(function () {
            adManager.reloadAds();
            resizeTimeout = null;
          }, 200);
        }
      }
    });

    googletag.cmd.push(function() {
      adManager.googletag_log = googletag.debug_log.log;
      adManager.initGoogleTag();
    });
  },

  /**
   * Getter/setter for reload on resize flag. When true, this will prevent the
   *  reloadAds function from firing on window resize.
   *
   * @param {Boolean} [value] - Provide this value to set reload on resize flag.
   * @returns {Boolean} value of reload on resize flag.
   */
  reloadOnResize: function (value) {
    if (typeof(value) === 'boolean') {
      this.doReloadOnResize = value;
    }
    return this.doReloadOnResize;
  },

  initGoogleTag: function() {
    var adManager = this;
    if(!this.debug) {
      // We only need the `PubAdsService` in production.
      googletag.pubads().enableSingleRequest();
      googletag.pubads().disableInitialLoad();
      googletag.pubads().collapseEmptyDivs(true)

      googletag.pubads().addEventListener('slotRenderEnded', function(e) {
        adManager.onSlotRenderEnded(e);
      });

      // Set all the targeting
      for (var t in this.targeting) {
        if(this.targeting[t]) {
          googletag.pubads().setTargeting(t, this.targeting[t].toString());
        }
      }
    }

    this.initialized = true;

    this.loadAds();
    googletag.enableServices();

    if (this.debug) {
      // We need to call the slot render ended stuff ourselves in debug mode.
      for(var domId in this.slots) {
        var slot = this.slots[domId];
        var iframe = document.getElementById(domId).getElementsByTagName('iframe')[0];
        var fakeEvent = {
          'slot': slot,
          'size': [parseInt(iframe.width, 10), parseInt(iframe.height, 10)]
        };
        this.onSlotRenderEnded(fakeEvent);
      }
    }

    googletag.debug_log.log = function(level, message, service, slot, reference) {
      if (message.getMessageId() === 1) {
        // The page has been fully loaded. FULLY. LOADED.
        googletag.pubads().refresh();
      }
      return adManager.googletag_log.apply(this, [level, message, service, slot, reference]);
    }
  },

  onSlotRenderEnded: function(e) {
    this.rendered = true;

    var slotId = e.slot.getSlotId().getDomId();
    var el = document.getElementById(slotId);

    // If there was a height added, we should remove it.
    el.style.removeProperty('height');
    el.style.removeProperty('width');

    if (adUnits[el.dataset.adUnit].onSlotRenderEnded) {
      adUnits[el.dataset.adUnit].onSlotRenderEnded(e, el);
    }
  },

  reloadAds: function(el) {
    this.unloadAds(el);
    this.loadAds(el);
  },

  generateId: function() {
    // Generates a unique ad id. For now, just an incrementing integer.
    this.adId += 1;
    return 'dfp-ad-' + this.adId.toString();
  },

  debugAdContent: function(adUnitConfig) {
    /*
      This is only useed on the local, and returns an HTML string suitable for loading
      into an ad slot via the `ContentService.setContent()` method.

      The `adUnitConfig` param is one of the AD_UNIT values from the top of this file.

      This is intended to only return placeholder ads of a suitable size for the viewport.

      For instance, given that the `window.outerWidth` is `1000`, and `adUnitConfig` is:

      ```'sizes': [
        [[970, 0], [970, 250]],
        [[728, 0], [728, 90]],
        [[0, 0], [300, 250]],
      ]```

      This this case, we should randomly choose between a 970x250 and a 728x90/
      */

    var validSizes = [];
    for (var i=0; i < adUnitConfig.sizes.length; i++) {
      var thisSize = adUnitConfig.sizes[i];

      if (global.outerWidth > thisSize[0][0] && thisSize[1].length > 0) {
        // This size is valid! Add it to the choices!

        if(thisSize[1][0].constructor === Array) {
          // Looks like there are multiple sizes
          for (var j=0;j < thisSize[1].length;j++) {
            validSizes.push(thisSize[1][j]);
          }
        } else {
          validSizes.push(thisSize[1]);
        }

        break;
      }
    }

    if (validSizes.length === 0) {
      return;
    }

    // Let's make a random placeholder ad!
    var randomIndex = Math.floor(Math.random() * validSizes.length)
    size = validSizes[randomIndex];

    var iframe = document.createElement('iframe');
    iframe.scrolling = 'no';
    iframe.width = size[0];
    iframe.height = size[1];

    iframe.style.border = '0px';
    iframe.style.verticalAlign = 'bottom';

    var sizeLabel = size[0] + 'x' + size[1];
    var styles = [
      'margin: 0',
      'padding: 0',
      'background-color: #2E2D2E',
      'color: #616161',
      'text-align: center',
      'font-size: 1rem',
      'font-family: Arial, Helvetica, sans-serif',
      'line-height: ' + size[1] + 'px'
    ];

    iframe.srcdoc = '<html><head><style>body{' + styles.join(';') + '}</style><title>' + sizeLabel + '</title></head><body><b>' + sizeLabel + '</b></body></html>';

    var tmp = document.createElement("div");
    tmp.appendChild(iframe);

    return tmp.innerHTML;
  },

  /**
   * Test if given element has the 'dfp' class, and so should hold an ad.
   *
   * @param {Element} el - element to test.
   * @returns true if it has the 'dfp' class, false otherwise
   */
  isAd: function (el) {
    return utils.hasClass(el, 'dfp');
  },

  findAds: function (el) {
    var ads = [];
    if (el === undefined) {
      // Let's try to load ads for the whole page
      ads = document.getElementsByClassName('dfp');
    } else if (el instanceof HTMLElement) {
      if (this.isAd(el)) {
        // The element is an ad, I guess that's the whole list
        ads = [el];
      } else {
        // The element is not an ad, let's return the list of ads within it.
        ads = el.getElementsByClassName('dfp');
      }
    } else if (el instanceof HTMLCollection) {
      for(var i=0; i < el.length; i++) {
        var thisEl = el[i];
        if (this.isAd(thisEl)) {
          // The element is an ad, I guess that's the whole list
          ads.push(thisEl);
        } else {
          // The element is not an ad, let's retunr the list of ads within it.
          ads = ads.concat(thisEl.getElementsByClassName('dfp'));
        }
      }
    }
    return ads;
  },

  configureAd: function(element) {
    // Configures a single ad, with the specified targeting

    // Set a unique id
    if (element.id && element.id in this.slots) {
      return this.slots[element.id]; // This slot has already been loaded!
    }

    element.id = this.generateId()

    // I don't know why this would happen, but if it does, we should watch out
    if (element.dataset === undefined) {
      return;
    }

    var adUnitConfig = adUnits[element.dataset.adUnit];
    if (adUnitConfig === undefined) {
      return;  // We don't know anything about this ad!
    }

    var DFP_ID = '1009948';  // This should come from the Django settings at some point

    var slotName = adUnitConfig.slotName || element.dataset.adUnit;

    var adUnitPath = '/' + DFP_ID + '/' + slotName;
    var size = adUnitConfig.sizes[0][1]; // Get the first ad size option as the default.
    var slot = googletag.defineSlot(adUnitPath, size, element.id);
    slot.defineSizeMapping(adUnitConfig.sizes);

    if (slot === null) {
      // This probably means that the slot has already been filled.
      return;
    }

    // Set all the targeting
    for (var t in this.targeting) {
      if(this.targeting[t]) {
        slot.setTargeting(t, this.targeting[t].toString());
      }
    }

    var slotTargeting = {};
    if (element.dataset.targeting) {
      slotTargeting = JSON.parse(element.dataset.targeting);
    }

    for (var t in slotTargeting) {
      if(slotTargeting[t]) {
        slot.setTargeting(t, slotTargeting[t].toString());
      }
    }

    if (!this.debug) {
      slot.addService(googletag.pubads());
    } else {
      var placeholderHTML = this.debugAdContent(adUnitConfig);
      if (placeholderHTML) {
        slot.addService(googletag.content());
        googletag.content().setContent(slot, placeholderHTML);
      }
    }

    this.slots[element.id] = slot;

    return slot;
  },

  loadAds: function(el) {
    if (!this.initialized) {
      return;
    }

    // Load all the ads in `el` (or just in the whole document)
    var ads = this.findAds(el);

    var slotsToLoad = [];
    var i;
    for(i = 0; i < ads.length; i++) {
      var element = ads[i];

      var slot = this.configureAd(element);
      if (slot) {
        slotsToLoad.push(slot);
      }
      googletag.display(element.id);
    }
    if(!this.debug) {
      googletag.pubads().refresh(slotsToLoad);
    }

    // We need to call the slot render ended stuff ourselves in debug mode.
    if (this.debug) {
      var i;
      for(i = 0; i < slotsToLoad.length; i++) {
        var slot = slotsToLoad[i];
        var domId = slot.getSlotId().getDomId();
        var iframe = document.getElementById(domId).getElementsByTagName('iframe')[0];
        if (iframe === undefined) {
          return;
        }
        var fakeEvent = {
          'slot': slot,
          'size': [parseInt(iframe.width, 10), parseInt(iframe.height, 10)]
        };
        this.onSlotRenderEnded(fakeEvent);
      }
    }
  },

  unloadAds: function(el) {
    if (! this.initialized) {
      return;
    }
    // Unload the ads, likely for performance reasons.
    var ads = this.findAds(el);
    if (!this.debug) {

      // If we're not in debug mode, get a list of the slot objects
      var slots = [];
      for (var i=0; i < ads.length; i++) {
        var ad = ads[i];
        // Lock the height...
        ad.style.height = ad.offsetHeight + 'px';
        ad.style.width = ad.offsetWidth + 'px';

        if (ad.id in this.slots) {
          slots.push(this.slots[ad.id]);
          delete this.slots[ad.id];
        }
      }
      googletag.pubads().clear(slots);

    } else {
      for (var i=0; i < ads.length; i++) {
        var ad = ads[i];
        if (ad.id in this.slots) {
          while (ad.hasChildNodes()) {
            ad.removeChild(ad.firstChild);
          }
          delete this.slots[ad.id];
        }
      }
    }

  }

};
