var Cookie = require('js-cookie');
var $ = require('jquery');

var TargetingPairs = require('./helpers/TargetingPairs');
var AdZone = require('./helpers/AdZone');
var MockGoogleTag = require('../resources/test/mock-google-tag');
var utils = require('./utils');
var AdManagerWrapper = require('./manager');
var adUnits = require('./ad-units');

jest.mock('./helpers/AdZone');
jest.mock('./helpers/TargetingPairs');

describe('AdManager', function() {
  var adManager;

  beforeEach(function() {
    window.googletag = new MockGoogleTag();
    window.Bulbs = { settings: { AMAZON_A9_ID: '1234' } };
    window.TARGETING = {
      dfp_site: 'onion',
      dfp_pagetype: 'homepage'
    };
    jest.spyOn(Cookie, 'set');
    jest.spyOn(Cookie, 'get');

    adManager = AdManagerWrapper.init({
      dfpSiteCode: 'fmg.onion',
      adUnits: adUnits
    });
    adManager.googletag.cmd = [];
    adManager.countsByAdSlot = {};
  });

  afterEach(function() {
    Cookie.remove('utmSession');
  });

  describe('#reloadAds', function() {
    beforeEach(function() {
      var pubads = adManager.googletag.pubads();
      jest.spyOn(adManager.googletag, 'pubads').mockImplementation(() => {
        return {
          updateCorrelator: jest.spyOn(pubads, 'updateCorrelator')
        }
      });
      jest.spyOn(adManager, 'unloadAds');
      jest.spyOn(adManager, 'loadAds');
      adManager.reloadAds('domElement');
    });

    it('- unloads and reloads ads', function() {
      expect(adManager.unloadAds).toHaveBeenCalledWith('domElement');
      expect(adManager.loadAds).toHaveBeenCalledWith('domElement');
    });

    it('- updates the correlator so it is treated like a new pageview request', function() {
      expect(googletag.pubads().updateCorrelator).toHaveBeenCalled();
    });
  });

  describe('#onSlotRenderEnded', function() {
    var adElement, event, eventSpy;

    beforeEach(function() {
      adElement = document.createElement('div');
      adElement.id = 'dfp-ad-1';
      $(adElement).attr('style', 'height: 250px; width: 300px');
      $(adElement).attr('data-ad-unit', 'header');
      document.body.appendChild(adElement);
      var getDomId = function() {
        return 'dfp-ad-1';
      };
      var getSlotId = function() {
        return {
          getDomId: getDomId
        }
      };

      event = {
        slot: {
          getSlotId: getSlotId
        }
      };
      adManager.rendered = false;
      eventSpy = jest.spyOn(adManager.adUnits.units.header, 'onSlotRenderEnded');
      adElement.addEventListener('dfpSlotRenderEnded', eventSpy);
    });

    afterEach(function() {
      $(adElement).remove();
      eventSpy.mockReset();
    });

    it('- sets rendered to true', function() {

      adManager.onSlotRenderEnded(event);

      expect(adManager.rendered).toEqual(true);
    });

    it('- removes the height property', function() {

      adManager.onSlotRenderEnded(event);

      expect(adElement.style.height).not.toEqual('250px');
    });

    it('- removes the width property', function() {

      adManager.onSlotRenderEnded(event);

      expect(adElement.style.width).not.toEqual('300px');
    });

    it('- calls custom slot render ended callback if there is one', function() {

      adManager.onSlotRenderEnded(event);

      expect(eventSpy).toHaveBeenCalledWith(event, adElement);
    });

    it('- sets loaded state to loaded', function() {

      adManager.onSlotRenderEnded(event);

      expect($(adElement).data('ad-load-state')).toEqual('loaded');
    });

    it('- emits a dfpSlotRenderEnded event', function() {

      adManager.onSlotRenderEnded(event);

      expect(eventSpy).toHaveBeenCalled();
    });

    it('- dispatches slot render end, calls callback even when ad comes back empty', function() {
      event.isEmpty = true;

      adManager.onSlotRenderEnded(event);

      expect($(adElement).data('ad-load-state')).toEqual('empty');
      expect(eventSpy).toHaveBeenCalled();
    });
  });

  describe('#onImpressionViewable', function()  {
    var adElement, event, eventSpy;

    beforeEach(function() {
      adElement = document.createElement('div');
      adElement.id = 'dfp-ad-1';
      $(adElement).attr('style', 'height: 250px; width: 300px');
      $(adElement).attr('data-ad-unit', 'header');
      document.body.appendChild(adElement);
      var getDomId = function() {
        return 'dfp-ad-1';
      };
      var getSlotId = function() {
        return {
          getDomId: getDomId
        }
      };

      event = {
        slot: {
          getSlotId: getSlotId
        }
      };
      eventSpy = jest.spyOn(adManager.adUnits.units.header, 'onSlotRenderEnded');
      adElement.addEventListener('dfpImpressionViewable', eventSpy);
      adManager.onSlotRenderEnded(event);
    });

    afterEach(function() {
      $(adElement).remove();
    });

    it('- emits a dfpImpressionViewable event', function() {
      expect(eventSpy).toHaveBeenCalled();
    });

    it('- should invoke optional onImpressionViewable callback if provided', function () {
      jest.spyOn(adManager.adUnits.units.header, 'onImpressionViewable');
      adManager.onImpressionViewable(event);
      expect(adManager.adUnits.units.header.onImpressionViewable).toHaveBeenCalled();
    });
  });

  describe('#onSlotOnload', function() {
    var adElement, event, eventSpy;

    beforeEach(function() {
      adElement = document.createElement('div');
      adElement.id = 'dfp-ad-1';
      $(adElement).attr('style', 'height: 250px; width: 300px');
      $(adElement).attr('data-ad-unit', 'header');
      document.body.appendChild(adElement);
      var getDomId = function() {
        return 'dfp-ad-1';
      };
      var getSlotId = function() {
        return {
          getDomId: getDomId
        }
      };

      event = {
        slot: {
          getSlotId: getSlotId
        }
      };
      eventSpy = jest.spyOn(adManager.adUnits.units.header, 'onSlotRenderEnded');
      adElement.addEventListener('dfpSlotOnload', eventSpy);
      adManager.onSlotRenderEnded(event);
    });

    afterEach(function() {
      $(adElement).remove();
    });

    it('- emits a dfpSlotOnload event', function() {
      expect(eventSpy).toHaveBeenCalled();
    });

    it('- should invoke optional onLoad callback if provided', function () {
      jest.spyOn(adManager.adUnits.units.header, 'onLoad');
      adManager.onSlotOnload(event);
      expect(adManager.adUnits.units.header.onLoad).toHaveBeenCalled();
    });
  });

  describe('#generateId', function() {
    beforeEach(function() {
      adManager.adId = 0;
    });

    it('- generates a unique ad id by incrementing adId', function() {
      expect(adManager.generateId()).toEqual('dfp-ad-1');
      expect(adManager.adId).toEqual(1);
    });
  });

  describe('#adUnitSizes', function() {
    describe('> no sizes configured on desktop', function() {
      var sizeMap = [
        [[900, 0], []],
        [[0, 0], []]
      ];

      it('- returns an empty []', function() {
        jest.spyOn(adManager, 'getClientWidth').mockImplementation(() => 1000);
        expect(adManager.adUnitSizes(sizeMap)).toEqual([]);
      });
    });

    describe('> a single size, configured for mobile', function() {
      var sizeMap = [
        [[0, 0], [728, 90]]
      ];

      it('- returns the sizes', function() {
        jest.spyOn(adManager, 'getClientWidth').mockImplementation(() => 375) // iPhone
        expect(adManager.adUnitSizes(sizeMap)).toEqual([728, 90]);
      });
    });

    describe('> desktop sizes only', function() {
      var sizeMap = [
        [[900, 0], [728, 90]],
        [[0, 0], []]
      ];

      it('- returns valid sizes on desktop', function() {
        jest.spyOn(adManager, 'getClientWidth').mockImplementation(() => 1000);
        expect(adManager.adUnitSizes(sizeMap)).toEqual([728, 90]);
      });

      it('- returns no valid sizes on mobile', function() {
        jest.spyOn(adManager, 'getClientWidth').mockImplementation(() => 320);
        expect(adManager.adUnitSizes(sizeMap)).toEqual([]);
      });
    });

    describe('> mobile sizes only', function() {
      var sizeMap = [
        [[900, 0], []],
        [[0, 0], [300, 250]]
      ];

      it('- desktop returns []', function() {
        jest.spyOn(adManager, 'getClientWidth').mockImplementation(() => 1000);
        expect(adManager.adUnitSizes(sizeMap)).toEqual([]);
      });

      it('- mobile returns the sizes', function() {
        jest.spyOn(adManager, 'getClientWidth').mockImplementation(() => 320);
        expect(adManager.adUnitSizes(sizeMap)).toEqual([300, 250]);
      });
    });

    describe('> desktop and mobile sizes', function() {
      var sizeMap = [
        [[900, 0], [['fluid'], [300, 250]]],
        [[0, 0], [[320, 50], 'fluid']]
      ];

      it('- desktop returns the sizes', function() {
        jest.spyOn(adManager, 'getClientWidth').mockImplementation(() => 1000);
        expect(adManager.adUnitSizes(sizeMap)).toEqual([['fluid'], [300, 250]]);
      });

      it('- mobile returns the sizes', function() {
        jest.spyOn(adManager, 'getClientWidth').mockImplementation(() => 320);
        expect(adManager.adUnitSizes(sizeMap)).toEqual([[320, 50], 'fluid']);
      });
    });
  });

  describe('#buildSizeMap', function () {
    var sizeMappingStub;
    beforeEach(function() {
      sizeMappingStub = {
        addSize: jest.fn(),
        build: jest.fn(),
      }
      jest.spyOn(window.googletag, 'sizeMapping').mockImplementation(() => sizeMappingStub);
    });

    it('- builds valid gpt sizemap', function() {
      adManager.buildSizeMap([]);
      expect(window.googletag.sizeMapping().build).toHaveBeenCalledTimes(1);
    });

    it("allows ['fluid'] size", function() {
      var sizeMap = [
        [[0, 0], ['fluid']],
      ];
      adManager.buildSizeMap(sizeMap);
      expect(window.googletag.sizeMapping().addSize).toHaveBeenCalledWith([0, 0], ['fluid']);
    });

    it("converts 'fluid' string into ['fluid'] array", function() {
      var sizeMap = [
        [[0, 0], 'fluid'],
      ];
      adManager.buildSizeMap(sizeMap);
      expect(window.googletag.sizeMapping().addSize).toHaveBeenCalledWith([0, 0], ['fluid']);
    });

    it("converts [['fluid']] doubly-nested array into ['fluid'] array", function() {
      // in practice, GPT doesn't allow [['fluid']], although the documentation is ambiguous on whether
      // this is supposed to work: https://developers.google.com/doubleclick-gpt/reference#googletag.GeneralSize
      var sizeMap = [
        [[0, 0], [['fluid']]],
      ];
      adManager.buildSizeMap(sizeMap);
      expect(window.googletag.sizeMapping().addSize).toHaveBeenCalledWith([0, 0], ['fluid']);
    });

    it("allows fluid to be mixed with other sizes", function() {
      var sizeMap = [
        [[0, 0], [['fluid'], [300, 250]]],
        [[900, 0], ['fluid', [728, 90]]],
      ];
      adManager.buildSizeMap(sizeMap);
      expect(window.googletag.sizeMapping().addSize).toHaveBeenCalledWith([0, 0], ['fluid', [300, 250]]);
      expect(window.googletag.sizeMapping().addSize).toHaveBeenCalledWith([900, 0], ['fluid', [728, 90]]);
    });
  });

  describe('#adSlotSizes', function() {
    beforeEach(function() {
    });

    it('- filters active gpt sizes  into an array', function() {
      expect(adManager.generateId()).toEqual('dfp-ad-1');
      expect(adManager.adId).toEqual(1);
    });
  });

  describe('#isAd', function() {
    var container;

    beforeEach(function() {
      container = document.createElement('div');
      document.body.appendChild(container);
    });

    afterEach(function() {
      $(container).remove();
    });

    it('- returns true if the container has the dfp class', function() {
      container.className = 'dfp';
      expect(adManager.isAd(container)).toEqual(true);
    });

    it('- returns false if the container does not have the dfp class', function() {
      expect(adManager.isAd(container)).toEqual(false);
    });
  });

  describe('#findAd', function() {
    var baseContainer, container1, container2, container3, adSlot1, adSlot2, adSlot3, ads;

    beforeEach(function() {
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
    });

    afterEach(function() {
      $(baseContainer).remove();
    });

    describe('> no arguments passed in', function() {
      beforeEach(function() {
        ads = adManager.findAds();
      });

      it('- returns all ads with `dfp` class', function() {
        var array = [];
        for(var i = 0; i < ads.length; i++) {
          array.push(ads[i]);
        }
        expect(array).toEqual([adSlot1, adSlot2, adSlot3]);
      });
    });

    describe('> passed in a query selector', function() {
      beforeEach(function() {
        ads = adManager.findAds('#dfp-ad-1');
      });

      it('- should return ads matching query selector', function() {
        expect(ads.length).toEqual(1);
        expect(ads[0]).toEqual(adSlot1);
      });
    });

    describe('> passed in a non-ad HTMLElement', function() {
      beforeEach(function() {
        jest.spyOn(adManager, 'isAd').mockImplementation(() => false);
        ads = adManager.findAds(container3);
      });

      it('- should returns ads within it', function() {
        expect(ads.length).toEqual(1);
        expect(ads[0]).toEqual(adSlot3);
      });
    });

    describe('> passed in an ad HTMLElement', function() {
      beforeEach(function() {
        jest.spyOn(adManager, 'isAd').mockImplementation(() => true);
        ads = adManager.findAds(adSlot1);
      });

      it('- should return the ad', function() {
        expect(ads.length).toEqual(1);
        expect(ads[0]).toEqual(adSlot1);
      });
    });

    describe('> passed in array of containers', function() {
      beforeEach(function() {
        jest.spyOn(adManager, 'isAd').mockImplementation(() => false);
        containers = document.getElementsByClassName('expected');
        ads = adManager.findAds(containers);
      });

      it('- should return ads within all the containers', function() {
        expect(ads.length).toEqual(2);
        expect(ads[0][0]).toEqual(adSlot1);
        expect(ads[1][0]).toEqual(adSlot3);
      });
    });

    describe('> passed in an element context containing ads', function() {
      beforeEach(function() {
        jest.spyOn(adManager, 'isAd').mockImplementation(() => false);
        containers = document.getElementsByClassName('expected');
        ads = adManager.findAds(containers, false, true);
      });

      it('- should return ads within all the containers', function() {
        expect(ads.length).toEqual(2);
        expect(ads[0][0]).toEqual(adSlot1);
        expect(ads[1][0]).toEqual(adSlot3);
      });
    });
  });
});