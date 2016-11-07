'use strict';

var utils = require('./utils');

var AdUnits = {
  toggleDelay: 6000,

  resetClasses: function(parent) {
    utils.removeClass(parent, 'pinned');
    utils.removeClass(parent, 'mobile');
    utils.removeClass(parent, 'kargo');
  },

  makeAdTogglable: function(adElement) {
    var toggleButton = document.createElement('div');
    toggleButton.className = 'toggle-btn open';
    this.delayAdToggle(adElement, toggleButton);
    utils.addClass(adElement.parentElement, 'pinned');
    utils.addClass(adElement.parentElement, 'open');
    utils.addClass(adElement.parentElement, 'hide-toggle-btn');
    adElement.parentElement.appendChild(toggleButton);
  },

  initToggleHandler: function (adElement, toggleButton) {
    if('ontouchend' in document.documentElement) {
      toggleButton.addEventListener('touchend', AdUnits.toggleAd.bind(null, adElement), false);
    } else {
      toggleButton.addEventListener('click', AdUnits.toggleAd.bind(null, adElement), false);
    }
  },

  toggleAd: function(adElement) {
    var openedClass = 'open';
    var closedClass = 'closed';
    var toggleButton = adElement.nextElementSibling;

    if (utils.hasClass(toggleButton, 'open')) {
      utils.removeClass(toggleButton, openedClass);
      utils.removeClass(adElement.parentElement, openedClass);
      utils.addClass(toggleButton, closedClass);
      utils.addClass(adElement.parentElement, closedClass);
    } else {
      utils.removeClass(toggleButton, closedClass);
      utils.removeClass(adElement.parentElement, closedClass);
      utils.addClass(toggleButton, openedClass);
      utils.addClass(adElement.parentElement, openedClass);
    }
  },

  delayAdToggle: function (adElement, toggleButton) {
    setTimeout(function() {
      AdUnits.toggleAd(adElement);
      AdUnits.initToggleHandler(adElement, toggleButton);
      utils.removeClass(adElement.parentElement, 'hide-toggle-btn');
    }, this.toggleDelay);
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
    AdUnits.makeAdTogglable(el);
    if (!utils.hasClass(parent, 'header-wrapper')) {
      return;
    }

    AdUnits.setupMobileSlotClasses(e, el);
  },

  handleLeaderboardHeaderSlot: function(e, el) {
    AdUnits.makeAdTogglable(el);
  },

  handlePagePushHeaderSlot: function(e, el) {
    utils.addClass(el.parentElement, 'page-push');

    var dfpContainer = document.getElementById(e.slot.getSlotElementId());
    var adIframe = dfpContainer.getElementsByTagName('iframe');
    var iframe = adIframe[0];
    var iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
    utils.removeClass(dfpContainer, 'collapsed');

    if (iframeDoc.readyState === 'complete') {
      AdUnits.prepPagePushIframe(dfpContainer, iframe);
    } else {
      iframe.onload = AdUnits.prepPagePushIframe.bind(this, dfpContainer, iframe);
    }
  },

  prepPagePushIframe: function(dfpContainer, iframe) {
    var iframeDoc = iframe.contentDocument || iframe.contentWindow.document;

    iframeDoc.addEventListener('PagePush:Expand', function() {
      utils.removeClass(dfpContainer, 'collapsed');
    });

    iframeDoc.addEventListener('PagePush:Collapse', function () {
      utils.addClass(dfpContainer, 'collapsed');
    });
  },

  headerSlotRenderEnded: function(e, el) {
    var parent = el.parentElement;
    AdUnits.resetClasses(parent);

    if (e.size[0] === 320) {
      AdUnits.handleMobileHeaderSlot(e, el);
    } else if ((e.size[0] === 728) && (e.size[1] === 90)) {
      AdUnits.handleLeaderboardHeaderSlot(e, el);
    } else if ((e.size[0] === 1) && (e.size[1] === 1)) {
      AdUnits.handlePagePushHeaderSlot(e, el);
    }
  }
};

AdUnits.units = {
  'campaign-pixel': {
    'sizes': [
      [[0, 0], [1, 1]]
    ]
  },

  'header': {
    'refreshDisabled': true,
    'eagerLoad': true,
    'slotName': 'header',
    'sizes': [
      [[970, 0], [[728, 90], [1,1], [970, 415], [970, 250], [970, 90]]],
      [[728, 0], [[1,1], [728, 90]]],
      [[0, 0], [[1,1], [320, 50], [300, 250]]]
    ],
    onSlotRenderEnded: AdUnits.headerSlotRenderEnded
  },

  'inbetween': {
    'slotName': 'header',
    'sizes': [
      [[970, 0], [[728, 90], [970, 250]]],
      [[728, 0], [[728, 90]]],
      [[0, 0], []]
    ]
  },

  'sidebar-primary': {
    'slotName': 'sidebar-primary',
    'sizes': [
      [[1000, 0], [300, 250]],
      [[0, 0], []]
    ]
  },

  'mobile-only-cube': {
    'slotName': 'sidebar-primary',
    'sizes': [
      [[728, 0], []],
      [[0, 0], [300, 250]]
    ]
  },

  'sidebar-short-primary': {
    'slotName': 'sidebar-primary',
    'sizes': [
      [[600, 0], [300, 250]],
      [[0, 0], []]
    ]
  },

  'sidebar-secondary': {
    'slotName': 'sidebar-secondary',
    'sizes': [
      [[0, 0], [300, 250]]
    ]
  },

  'sidebar-tertiary': {
    'slotName': 'sidebar-tertiary',
    'sizes': [
      [[1240, 0], [300, 250]],
      [[0, 0], []]
    ]
  },

  'non-mobile-leaderboard': {
    'slotName': 'horizontal-secondary',
    'sizes': [
      [[728, 0], [728, 90]],
      [[0, 0], []]
    ]
  },

  'horizontal-secondary': {
    'slotName': 'horizontal-secondary',
    'sizes': [
      [[728, 0], [[728, 90]]],
      [[0, 0], [[320, 50]]]
    ]
  },

  'horizontal-tertiary': {
    'slotName': 'horizontal-tertiary',
    'sizes': [
      [[728, 0], [[728, 90]]],
      [[0, 0], [[320, 50]]]
    ]
  },

  'article-button': {
    'slotName': 'article-button',
    'sizes': [
      [[768, 0], [120, 60]],
      [[0, 0], []]
    ]
  },

  'inread': {
    'slotName': 'inread',
    'sizes': [
      [[728, 0], []],
      [[0,0], [[1,1], [300,250]]]
    ]
  },

  'instant-article-inread': {
    'slotName': 'instant-article-inread',
    'sizes': [
      [[0,0], [300,250]]
    ]
  }
};

module.exports = AdUnits;
