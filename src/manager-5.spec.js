var $ = require('jquery');

var MockGoogleTag = require('../resources/test/mock-google-tag');
var AdManagerWrapper = require('./manager');
var adUnits = require('./ad-units');

describe('AdManager', function() {
  var adManager;

  beforeEach(function() {
    window.googletag = new MockGoogleTag();
    window.Bulbs = { settings: { AMAZON_A9_ID: '1234' } };
    window.TARGETING = {
      dfp_site: 'onion',
      dfp_pagetype: 'homepage'
    };

    adManager = AdManagerWrapper.init({
      dfpSiteCode: 'fmg.onion',
      adUnits: adUnits
    });
    adManager.googletag.cmd = [];
    adManager.countsByAdSlot = {};
    pubads = adManager.googletag.pubads();
    adManager.googletag.pubads = jest.fn().mockImplementation(() => ({
      collapseEmptyDivs: jest.fn(),
      enableSingleRequest: jest.spyOn(pubads, 'enableSingleRequest'),
      disableInitialLoad: jest.spyOn(pubads, 'disableInitialLoad'),
      addEventListener: jest.spyOn(pubads, 'addEventListener'),
      refresh: jest.fn(),
      clear: jest.fn(),
      setTargeting: jest.spyOn(pubads, 'setTargeting'),
      updateCorrelator: jest.spyOn(pubads, 'updateCorrelator'),
      enableAsyncRendering: jest.spyOn(pubads, 'enableAsyncRendering')
    }));
  });

  describe('#pause', function() {
    beforeEach(function() {
      adManager.paused = false;
      adManager.pause();
    });

    it('- pauses any future ad loading', function() {
      expect(adManager.paused).toEqual(true);
    });
  });

  describe('#unpause', function() {
    beforeEach(function() {
      adManager.paused = true;
      adManager.unpause();
    });

    it('- unpauses any future ad loading', function() {
      expect(adManager.paused).toEqual(false);
    });
  });

  describe('#loadAds', function() {
    var baseContainer, container1, container2, container3, adSlot1, adSlot2, adSlot3, ads, displaySpy, configureAdSpy, refreshSlotSpy;

    beforeEach(function() {
      adManager.paused = false;
      adManager.initialized = true;
      adManager.options.amazonEnabled = false;
      adManager.options.pbjsEnabled = false;

      adManager.googletagdisplay = jest.fn();
      adManager.googletagenableServices = jest.fn();
      adManager.fetchAmazonBids = jest.fn();

      baseContainer = document.createElement('div');
      container1 = document.createElement('div');
      container1.className ='expected';
      container1.id = 'ad-container-1';
      adSlot1 = document.createElement('div');
      adSlot1.id = 'dfp-ad-1';
      adSlot1.className = 'dfp';
      container1.appendChild(adSlot1);
      baseContainer.appendChild(container1);

      container2 = document.createElement('div');
      container2.id = 'ad-container-2';
      adSlot2 = document.createElement('div');
      adSlot2.id = 'dfp-ad-2';
      adSlot2.className = 'dfp';
      container2.appendChild(adSlot2);
      baseContainer.appendChild(container2);

      container3 = document.createElement('div');
      container3.id = 'ad-container-3';
      container3.className ='expected';
      adSlot3 = document.createElement('div');
      adSlot3.id = 'dfp-ad-3';
      adSlot3.className = 'dfp';
      container3.appendChild(adSlot3);
      baseContainer.appendChild(container3);

      document.body.appendChild(baseContainer);

      adManager.configureAd = function(element) {
        return {
          element: element,
          eagerLoad: true
        };
      };

      displaySpy = jest.spyOn(adManager.googletag, 'display');
      configureAdSpy = jest.spyOn(adManager, 'configureAd');
      adManager.refreshSlot = jest.fn();
    });

    afterEach(function() {
      $(baseContainer).remove();
    });

    describe('> with wrapper tag', function() {
      var spy;

      beforeEach(function() {
        spy = jest.spyOn(adManager, 'refreshSlot');
        window.headertag = {
          display: jest.fn(),
          apiReady: true
        };
        adManager.loadAds();
      });

      it('- calls wrapper tag instead of googletag', function() {
        expect(window.headertag.display).toHaveBeenCalledTimes(3);
        expect(window.headertag.display).toHaveBeenCalledWith('dfp-ad-1');
        expect(window.headertag.display).toHaveBeenCalledWith('dfp-ad-2');
        expect(window.headertag.display).toHaveBeenCalledWith('dfp-ad-3');
      });

      it('- triggers refresh of each slot through wrapper tag', function() {
        expect(spy).toHaveBeenCalledTimes(3);
        expect(spy).toHaveBeenCalledWith(adSlot1);
        expect(spy).toHaveBeenCalledWith(adSlot2);
        expect(spy).toHaveBeenCalledWith(adSlot3);
      });
    });

    describe('> without wrapper tag', function() {
      beforeEach(function() {
        delete window.headertag;
        adManager.loadAds();
      });

      it('- displays each ad', function() {
        expect(displaySpy).toHaveBeenCalledTimes(3);
        expect(displaySpy).toHaveBeenCalledWith('dfp-ad-1');
        expect(displaySpy).toHaveBeenCalledWith('dfp-ad-2');
        expect(displaySpy).toHaveBeenCalledWith('dfp-ad-3');
      });
    });

    describe('> paused', function() {
      beforeEach(function() {
        adManager.paused = true;
        adManager.loadAds();
      });

      it('- does not refresh any slots', function() {
        expect(adManager.googletag.pubads().refresh).not.toHaveBeenCalled();
      });
    });

    describe('> not initialized', function() {
      beforeEach(function() {
        adManager.initialized = false;
        adManager.loadAds();
      });

      it('- does not refresh any slots', function() {
        expect(adManager.googletag.pubads().refresh).not.toHaveBeenCalled();
      });
    });

    describe('> pub ads not ready', function() {
      beforeEach(function() {
        $(adSlot1).attr('data-ad-load-state', 'loaded');
        $(adSlot2).attr('data-ad-load-state', 'loaded');
        $(adSlot3).attr('data-ad-load-state', 'loaded');
        adManager.loadAds();
      });

      it('- enables services', function() {
        expect(adManager.googletag.enableServices).toHaveBeenCalled();
      });
    });

    describe('> loading of all ads already in progress', function() {
      beforeEach(function() {
        $(adSlot1).attr('data-ad-load-state', 'loading');
        $(adSlot2).attr('data-ad-load-state', 'loading');
        $(adSlot3).attr('data-ad-load-state', 'loading');
        spy = jest.spyOn(adManager.googletag, 'display');
        adManager.loadAds();
      });

      it('- does not try to configureAd', function() {
        expect(adManager.configureAd).not.toHaveBeenCalled();
      });

      it('- does not try to trigger display', function() {
        expect(spy).not.toHaveBeenCalled();
      });

      it('- does not try to refresh pubads across the board', function() {
        expect(adManager.googletag.pubads().refresh).not.toHaveBeenCalled();
      });
    });

    describe('> all ads loaded', function() {
      beforeEach(function() {
        $(adSlot1).attr('data-ad-load-state', 'loaded');
        $(adSlot2).attr('data-ad-load-state', 'loaded');
        $(adSlot3).attr('data-ad-load-state', 'loaded');
        adManager.loadAds();
      });

      it('- does not try to configureAd', function() {
        expect(adManager.configureAd).not.toHaveBeenCalled();
      });

      it('- does not try to trigger display', function() {
        expect(displaySpy).not.toHaveBeenCalled();
      });

      it('- does not try to refresh pubads across the board', function() {
        expect(adManager.googletag.pubads().refresh).not.toHaveBeenCalled();
      });
    });

    describe('> update correlator true', function() {
      beforeEach(function() {
        adManager.loadAds(undefined, true);
      });

      it('- updates the correlator', function() {
        expect(adManager.googletag.pubads().updateCorrelator).toHaveBeenCalled();
      });
    });

    describe('> no ads loaded', function() {
      beforeEach(function() {
        adManager.refreshSlot.reset = jest.fn();
        refreshSlotSpy = jest.spyOn(adManager, 'refreshSlot');
        adManager.loadAds();
      });

      it('- configures each ad', function() {
        expect(configureAdSpy).toHaveBeenCalledTimes(3);
        expect(configureAdSpy).toHaveBeenCalledWith(adSlot1);
        expect(configureAdSpy).toHaveBeenCalledWith(adSlot2);
        expect(configureAdSpy).toHaveBeenCalledWith(adSlot3);
      });

      it('- displays each ad', function() {
        expect(displaySpy).toHaveBeenCalledTimes(3);
        expect(displaySpy).toHaveBeenCalledWith('dfp-ad-1');
        expect(displaySpy).toHaveBeenCalledWith('dfp-ad-2');
        expect(displaySpy).toHaveBeenCalledWith('dfp-ad-3');
      });

      it('- triggers refresh of each slot', function() {
        expect(refreshSlotSpy).toHaveBeenCalledWith(adSlot1);
        expect(refreshSlotSpy).toHaveBeenCalledWith(adSlot2);
        expect(refreshSlotSpy).toHaveBeenCalledWith(adSlot3);
      });
    });

    describe('> partial ads loaded', function() {
      beforeEach(function() {
        $(adSlot1).attr('data-ad-load-state', 'loaded');
        refreshSlotSpy = jest.spyOn(adManager, 'refreshSlot');
        adManager.loadAds();
      });

      it('- configures ads not loaded', function() {
        expect(configureAdSpy).toHaveBeenCalledTimes(2);
        expect(configureAdSpy).toHaveBeenCalledWith(adSlot2);
        expect(configureAdSpy).toHaveBeenCalledWith(adSlot3);
      });

      it('- displays unloaded ads', function() {
        expect(displaySpy).toHaveBeenCalledTimes(2);
        expect(displaySpy).toHaveBeenCalledWith('dfp-ad-2');
        expect(displaySpy).toHaveBeenCalledWith('dfp-ad-3');
      });

      it('- triggers refresh of non-loaded slots', function() {
        expect(refreshSlotSpy).not.toHaveBeenCalledWith(adSlot1);
        expect(refreshSlotSpy).toHaveBeenCalledWith(adSlot2);
        expect(refreshSlotSpy).toHaveBeenCalledWith(adSlot3);
      });
    });
  });
});

