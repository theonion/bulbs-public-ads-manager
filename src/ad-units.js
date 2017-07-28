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

	'header': {
		'eagerLoad': true,
		'pos': 'splashytop',
		'sizes': [
			[
				[970, 0],
				[
					[1280, 720],
					[970, 415]
				]
			],
			[
				[728, 0],
				[
					[1280, 720],
					[970, 415]
				]
			],
			[
				[
					[0, 0],
					[
						[320, 50]
					]
				]

			]
		],

		onSlotRenderEnded: AdUnits.headerSlotRenderEnded
	},
	'TOP_BANNER': {
		'eagerLoad': true,
		'pos': 'top',
		'sizes': [
			[
				[1023, 0],
				[
					[970, 250],
					[970, 90],
					[728, 90]
				]
			]
		],
		
		onSlotRenderEnded: AdUnits.topBannerSlotRenderEnded
	}
};

module.exports = AdUnits;
