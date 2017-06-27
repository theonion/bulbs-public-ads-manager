'use strict';

var AdUnits = {
  toggleDelay: 6000,

  resetClasses: function(parent) {
    parent.classList.remove('pinned');
    parent.classList.remove('mobile');
    parent.classList.remove('kargo');
    parent.classList.remove('page-push');
    parent.classList.remove('super-hero');
    parent.style.height = '';
  },

  makeAdTogglable: function(adElement) {
    var toggleButton = document.createElement('div');
    toggleButton.className = 'toggle-btn open';
    this.delayAdToggle(adElement, toggleButton);
    adElement.parentElement.classList.add('pinned');
    adElement.parentElement.classList.add('open');
    adElement.parentElement.classList.add('hide-toggle-btn');
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

    if (toggleButton.classList.contains('open')) {
      toggleButton.classList.remove(openedClass);
      adElement.parentElement.classList.remove(openedClass);
      toggleButton.classList.add(closedClass);
      adElement.parentElement.classList.add(closedClass);
    } else {
      toggleButton.classList.remove(closedClass);
      adElement.parentElement.classList.remove(closedClass);

      toggleButton.classList.add(openedClass);
      adElement.parentElement.classList.add(openedClass);
    }
  },

  delayAdToggle: function (adElement, toggleButton) {
    setTimeout(function() {
      AdUnits.toggleAd(adElement);
      AdUnits.initToggleHandler(adElement, toggleButton);
      adElement.parentElement.classList.remove('hide-toggle-btn');
    }, this.toggleDelay);
  },

  setupMobileSlotClasses: function(e, el) {
    var parent = el.parentElement;
    parent.classList.add('mobile');
  },

  handleMobileHeaderSlot: function(e, el) {
    var parent = el.parentElement;
    AdUnits.makeAdTogglable(el);

    if (!parent.classList.contains('header-wrapper')) {
      return;
    }

    AdUnits.setupMobileSlotClasses(e, el);
  },

  handleLeaderboardHeaderSlot: function(e, el) {
    AdUnits.makeAdTogglable(el);
  },

  handlePagePushHeaderSlot: function(e, el) {
    el.parentElement.classList.add('page-push');

    var dfpContainer = document.getElementById(e.slot.getSlotElementId());
    var adIframe = dfpContainer.getElementsByTagName('iframe');
    var iframe = adIframe[0];
    var iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
    dfpContainer.classList.remove('collapsed');

    if (iframeDoc.readyState === 'complete') {
      AdUnits.prepPagePushIframe(dfpContainer, iframe);
    } else {
      iframe.onload = AdUnits.prepPagePushIframe.bind(this, dfpContainer, iframe);
    }
  },

  handleSuperHeroHeaderSlot: function(e, el) {
    el.parentElement.classList.add('super-hero');

    var height = document.documentElement.clientHeight - 175;
    if (height > 720) {
      height = 720;
    }
    el.parentElement.style.height = height + 'px';
  },

  prepPagePushIframe: function(dfpContainer, iframe) {
    var iframeDoc = iframe.contentDocument || iframe.contentWindow.document;

    iframeDoc.addEventListener('PagePush:Expand', function() {
      dfpContainer.classList.remove('collapsed');
    });

    iframeDoc.addEventListener('PagePush:Collapse', function () {
      dfpContainer.classList.add('collapsed');
    });
  },

  headerSlotRenderEnded: function(e, el) {
    var parent = el.parentElement;
    parent.setAttribute('data-ad-load-state', 'loaded');
    AdUnits.resetClasses(parent);

    if (e.size[0] === 320) {
      AdUnits.handleMobileHeaderSlot(e, el);
    } else if ((e.size[0] === 728) && (e.size[1] === 90)) {
      AdUnits.handleLeaderboardHeaderSlot(e, el);
    } else if ((e.size[0] === 1) && (e.size[1] === 1)) {
      AdUnits.handlePagePushHeaderSlot(e, el);
    } else if ((e.size[0] === 1280) && (e.size[1] === 720)) {
      AdUnits.handleSuperHeroHeaderSlot(e, el);
    }
  }
};

AdUnits.units = {
  'campaign-pixel': {
    'eagerLoad': true,
    'sizes': [
      [[0, 0], [1, 1]]
    ]
  },

  'header': {
    'refreshDisabled': true,
    'eagerLoad': true,
    'slotName': 'header',
    'sizes': [
      [[970, 0], [[728, 90], [1,1], [970, 415], [970, 250], [970, 90], [1280, 720]]],
      [[728, 0], [[1,1], [728, 90], [1280, 720]]],
      [[0, 0], [[1,1], [320, 50], [300, 250], [1280, 720]]]
    ],
    onSlotRenderEnded: AdUnits.headerSlotRenderEnded
  },

  'inbetween': {
    'slotName': 'header',
    'sizes': [
      [[728, 0], [[728, 90]]],
      [[0, 0], []]
    ]
  },

  'kinja-native': {
		'slotName': 'kinja-native',
		'sizes': [
			[[728, 0], [[728, 150]]],
			[[0, 0], []]
		]
  },

  'kinja-native-inread': {
    'slotName': 'kinja-native-inread',
    'sizes': [
      [[728, 0], []],
      [[0,0], [[1,1], [300,250]]]
    ]
  },

  'sidebar-primary': {
    'slotName': 'sidebar-primary',
    'refreshDisabled': true,
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
      [[728, 0], [728, 90], [728, 150]],
      [[0, 0], []]
    ]
  },

  'horizontal-secondary': {
    'slotName': 'horizontal-secondary',
    'sizes': [
      [[728, 0], [[728, 90], [728, 150]]],
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
    'eagerLoad': true,
    'slotName': 'instant-article-inread',
    'sizes': [
      [[0,0], [300,250]]
    ]
  }
};

module.exports = AdUnits;
