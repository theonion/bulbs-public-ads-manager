var CLASS_SMALL_AD = 'small-ad';
var CLASS_AD_PLUS_CONTENT = 'ad-plus-content';

var AdUnits = {
  settings: {
    dfpSite: 'onion',
    closeDelay: 1250
  },

  makeAdCloseable: function(adElement) {
    var closeButton = document.createElement('div');
    if (this.settings.closeDelay) {
      closeButton.className = 'close-btn disabled';
      setTimeout(function() {
        utils.removeClass(closeButton, 'disabled');
      }, this.settings.closeDelay);
    } else {
      closeButton.className = 'close-btn';
    }
    utils.addClass(adElement.parentElement, 'pinned');
    adElement.appendChild(closeButton);

    if('ontouchend' in document.documentElement) {
      closeButton.addEventListener('touchend', AdUnits.closeAd.bind(null, adElement), false);
    } else {
      closeButton.addEventListener('click', AdUnits.closeAd.bind(null, adElement), false);
    }
  },

  closeAd: function(adElement) {
    if (onionan) {
      onionan.sendEvent({
        eventCategory: 'ads',
        eventAction: 'close',
        eventLabel: ''
      });
    } else {
      console.warn('onionan is undefined');
    }
    adElement.parentElement.removeChild(adElement);
  },

  prependSite: function(baseSlotName) {
    return this.settings.dfpSite + '_' + baseSlotName;
  },

  resetClasses: function(parent) {
    utils.removeClass(parent, 'pinned');
    utils.removeClass(parent, 'mobile');
    utils.removeClass(parent, 'kargo');
  },

  isKargo: function(e) {
    var re = new RegExp(/kargo/);
    var slot = e.slot.L;
    if (re.test(slot) || e.lineItemId === 356279568 || e.lineItemId === 336705048) {
      return true;
    } else {
      return false;
    }
  },

  setupMobileSlotClasses: function(e, el) {
    var parent = el.parentElement;
    utils.addClass(parent, 'mobile');

    if (AdUnits.isKargo(e)) {
      utils.addClass(parent, 'kargo');
    }
  },

  handleMobileHeaderSlot: function(e, el) {
    var parent = el.parentElement;
    AdUnits.makeAdCloseable(el);
    if (!utils.hasClass(parent, 'header-wrapper')) {
      return;
    }

    AdUnits.setupMobileSlotClasses(e, el);
  },

  handleLeaderboardHeaderSlot: function(e, el) {
    AdUnits.makeAdCloseable(el);
  },

  headerSlotRenderEnded: function(e, el) {
    var parent = el.parentElement;
    AdUnits.resetClasses(parent);

    if (e.size[0] === 320) {
      AdUnits.handleMobileHeaderSlot(e, el);
    } else if ((e.size[0] === 728) && (e.size[1] === 90)) {
      AdUnits.handleLeaderboardHeaderSlot(e, el);
    }
  },

  articleHeaderSlotRenderEnded: function(e, el) {
    var parent = el.parentElement;
    AdUnits.resetClasses(parent);

    if (e.lineItemId === 423349608) {
      // This is a temporary quick fix exclusion for History Channel campaign, since
      // they have a special coverage section with an that expands down on click
      return;
    }

    if ((e.size[0] === 728) && (e.size[1] === 90)) {
      AdUnits.handleLeaderboardHeaderSlot(e, el);
    }
  },

  articleMobileHeaderSlotRenderEnded: function(e, el) {
    var parent = el.parentElement;
    AdUnits.resetClasses(parent);

    AdUnits.setupMobileSlotClasses(e, el);
    AdUnits.makeAdCloseable(el);
  }
}

AdUnits.units = {
  // This is used at the top of the homepage, as well as at the start of every article
  'header': {
    'slotName': 'header',
    'sizes': [
      [[970, 0], [[728, 90], [970, 415], [970, 250], [970, 90], [970, 66], [970, 418]]],
      [[728, 0], [728, 90]],
      [[0, 0], [320, 50]]
    ],
    onSlotRenderEnded: AdUnits.headerSlotRenderEnded
  },

  'article-header': {
    'slotName': 'header',
    'sizes': [
      [[970, 0], [[728, 90], [970, 250]]],
      [[728, 0], [728, 90]],
      [[0, 0], []]
    ],
    onSlotRenderEnded: AdUnits.articleHeaderSlotRenderEnded
  },

  'article-mobile-header': {
    'slotName': 'header',
    'sizes': [
      [[728, 0], []],
      [[0, 0], [320, 50]]
    ],
    onSlotRenderEnded: AdUnits.articleMobileHeaderSlotRenderEnded
  },

  'listing-primary': {
    'slotName': 'header',
    'sizes': [
      [[970, 0], [[728, 90], [970, 250]]],
      [[728, 0], [728, 90]],
      [[0, 0], [320, 50]]
    ],
  },

  // Homepage 728's
  'homepage-secondary': {
    'slotName': 'homepage-secondary',
    'sizes': [
      [[1240, 0], [728, 90]],

      [[0, 0], [320, 50]]
      // viewport above needs to be 1370 for .large-thing
      // to accommodate a 728x90 slot
    ]
  },
  'homepage-tertiary': {
    'slotName': 'homepage-tertiary',
    'sizes': [
      [[1240, 0], [728, 90]],
      [[400, 0], [320, 50]],
      [[0, 0], []]
      // viewport above needs to be 1370 for .large-thing
      // to accommodate a 728x90 slot
    ]
  },

  // Mobile primary on homepage
  'mobile-primary': {
    'slotName': 'sidebar-primary',
    'sizes': [
      [[1000, 0], []],
      [[0, 0], [300, 250]],
    ]
  },

  // Mobile primary on homepage
  'article-mobile-primary': {
    'slotName': 'sidebar-primary',
    'sizes': [
      [[728, 0], []],
      [[0, 0], [300, 250]]
    ]
  },

  // This one shows up on the homepage & article pages
  'sidebar-primary': {
    'slotName': 'sidebar-primary',
    'sizes': [
      [[1000, 0], [300, 250]],
      [[0, 0], []],
    ]
  },

  'article-sidebar-primary': {
    'slotName': 'sidebar-primary',
    'sizes': [
      [[1000, 0], [300, 250]],
      [[0, 0], []],
    ]
  },

  // Secondary and tertiary only show up on the homepage
  'sidebar-secondary': {
    'slotName': 'sidebar-secondary',
    'sizes': [
      [[0, 0], [300, 250]],
    ]
  },

  // Tertiary only shows up on the homepage, tablet and up
  'sidebar-tertiary': {
    'slotName': 'sidebar-tertiary',
    'sizes': [
      [[1240, 0], [300, 250]],
      [[0, 0], []]
    ]
  },

  // This only shows up on article pages
  'inbetween': {
    'slotName': 'header',
    'sizes': [
      [[970, 0], [[728, 90], [970, 250]]],
      [[728, 0], [[728, 90]]],
      [[0, 0], []]
    ]
  },

  'article-button': {
    'slotName': 'article-button',
    'sizes': [
      [[768, 0], [120, 60]],
      [[0, 0], []]
    ]
  },

  'slideshow-endcard': {
    'slotName': 'slideshow-endcard',
    'sizes': [
      [[1000, 0], [300, 250]],
      [[0, 0], []]
    ]
  },

  'inread': {
    'slotName': 'inread',
    'sizes': [
      [[0,0], [1,1]]
    ]
  }
};

module.exports = AdUnits;
