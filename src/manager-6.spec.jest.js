var $ = require('jquery');

var TargetingPairs = require('./helpers/TargetingPairs');
var MockGoogleTag = require('../resources/test/mock-google-tag-jest');
var AdManagerWrapper = require('./manager');
var adUnits = require('./ad-units');

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

    adManager = AdManagerWrapper.init({
      dfpSiteCode: 'fmg.onion',
      adUnits: adUnits
    });
    adManager.googletag.cmd = [];
    adManager.countsByAdSlot = {};

    pubads = adManager.googletag.pubads(); // take this from adManager

    window.headertag = window.headertag || {};
    window.headertag.pubads = jest.fn().mockImplementation(() => ({
      refresh: jest.spyOn(pubads, 'refresh'),
      updateCorrelator: jest.spyOn(pubads, 'updateCorrelator')
    }));

    adManager.googletag.pubads = jest.fn().mockImplementation(() => ({
      refresh: jest.spyOn(pubads, 'refresh'),
      getSlots: function() {return []},
      updateCorrelator: jest.spyOn(pubads, 'updateCorrelator')
    }));
  });

  describe('#fetchAmazonBids', function () {
    var slots, fetchBidsSpy;

    beforeEach(function() {
      var headertag = window.headertag || {};
      
      window.apstag = {
        fetchBids: function(slots, callback) {
          callback();
        },
        setDisplayBids: jest.fn()
      };

      headertag.cmd = {
        push: function() {
          window.apstag.setDisplayBids();
        }
      };

      headertag.apiReady = true;

      window.googletag = {
        cmd: {
          push: function () {
            window.apstag.setDisplayBids();
          }
        }
      };

      slots = [
        {
          getSlotElementId: function () { return 'dfp-ad-1'; },
          getOutOfPage: function () { return false; },
          activeSizes: [[728, 90]],
          slotName: 'header'
        }
      ];

      headerPushSpy = jest.spyOn(window.headertag.cmd, 'push');
      googlePushSpy = jest.spyOn(window.googletag.cmd, 'push');
      fetchBidsSpy = jest.spyOn(window.apstag, 'fetchBids');

      jest.spyOn(TargetingPairs, 'getTargetingPairs').mockReturnValue({
        slotOptions: {
          page: 'frontpage'
        }
      });
    });

    // Note, last slotName test was changed 
    it('- call to apstag functions if apstag is defined', function () {
      adManager.fetchAmazonBids(slots);
      expect(fetchBidsSpy).toHaveBeenCalled();
      var fetchedSlots = window.apstag.fetchBids.mock.calls[0][0].slots;

      expect(fetchedSlots.length).toEqual(1);
      expect(fetchedSlots[0].slotID).toEqual(slots[0].getSlotElementId());
      expect(fetchedSlots[0].sizes).toEqual(slots[0].activeSizes);
      expect(fetchedSlots[0].slotName).toEqual('/4246/fmg.onion/front_' + slots[0].slotName); // TODO: this was changed?
    });

    it('- does not include out of page slots', function () {
      slots.push({
        getSlotElementId: function () { return 'dfp-ad-20'; },
        getOutOfPage: function () { return true; },
        activeSizes: [[728, 90]],
        slotName: 'out-of-page'
      });
      adManager.fetchAmazonBids(slots);
      expect(fetchBidsSpy).toHaveBeenCalled();
      var fetchedSlots = window.apstag.fetchBids.mock.calls[0][0].slots;

      expect(fetchedSlots.length).toEqual(1);
      expect(fetchedSlots[0].slotID).toEqual(slots[0].getSlotElementId());
    });

    it('- does not include slots which currently have no allowed creative sizes based on the current viewport', function () {
      slots.push({
        getSlotElementId: function () { return 'dfp-ad-20'; },
        getOutOfPage: function () { return false; },
        activeSizes: [],
        slotName: 'non-viewport-slot'
      });
      adManager.fetchAmazonBids(slots);
      expect(fetchBidsSpy).toHaveBeenCalled();
      var fetchedSlots = window.apstag.fetchBids.mock.calls[0][0].slots;

      expect(fetchedSlots.length).toEqual(1);
      expect(fetchedSlots[0].slotID).toEqual(slots[0].getSlotElementId());
    });

    it('- does not call fetchBids if none of the slots passed in have valid sizes for the viewport', function () {
      slots = [{
        getSlotElementId: function () { return 'dfp-ad-20'; },
        getOutOfPage: function () { return false; },
        activeSizes: [],
        slotName: 'non-viewport-slot'
      }];
      adManager.fetchAmazonBids(slots);
      expect(fetchBidsSpy).not.toHaveBeenCalled();
    });

    it('- does not include native slots (sizes `fluid`)', function () {
      slots.push({
        getSlotElementId: function () { return 'dfp-ad-20'; },
        getOutOfPage: function () { return false; },
        activeSizes: ['fluid'],
        slotName: 'native'
      });
      adManager.fetchAmazonBids(slots);
      expect(fetchBidsSpy).toHaveBeenCalled();
      var fetchedSlots = window.apstag.fetchBids.mock.calls[0][0].slots;

      expect(fetchedSlots.length).toEqual(1);
      expect(fetchedSlots[0].slotID).toEqual(slots[0].getSlotElementId());
    });

    it('- sets targeting once bids are returned from apstag api', function (done) {
      adManager.fetchAmazonBids(slots);
      expect(headerPushSpy).toHaveBeenCalledTimes(1);
      done();
    });

    it('- sets targeting using googletag if Index not on page once bids are returned from apstag api', function() {
      delete window.headertag;
      adManager.fetchAmazonBids(slots);
      expect(googlePushSpy).toHaveBeenCalledTimes(1);
    });
  });

  // Setup method utilized by #refreshSlot & #refreshSlots tests
  function adSlotSetup() {
    var baseContainer, container1, adSlot1, stubSlot, eagerStubSlot, variableReferences;
    baseContainer = document.createElement('div');
    container1 = document.createElement('div');
    container1.className ='expected';
    container1.id = 'ad-container-1';
    adSlot1 = document.createElement('div');
    adSlot1.id = 'dfp-ad-1';
    adSlot1.className = 'dfp';
    adSlot1.dataset.adUnit = 'header';
    container1.appendChild(adSlot1);
    baseContainer.appendChild(container1);
    document.body.appendChild(baseContainer);

    stubSlot = {
      element: adSlot1,
      prebid: 1,
      activeSizes: [[300, 250]],
      getSlotElementId: function() {
        return adSlot1.id;
      },
      getTargeting: function () {
        return '';
      },
      setTargeting: function () {},
      getOutOfPage: function () { return false; }
    };

    eagerStubSlot = Object.assign({}, stubSlot, { eagerLoad: true });

    variableReferences = {
      baseContainer: baseContainer,
      container1: container1,
      adSlot1: adSlot1,
      stubSlot: stubSlot,
      eagerStubSlot: eagerStubSlot
    };

    adManager.slots = {
      'dfp-ad-1': stubSlot
    };

    return variableReferences;
  }

  describe('#fetchIasTargeting', function(){
    afterEach(function(){
      adManager.__iasPET.queue = [];
    });

    it('- pushes ad slots to PET tag queue', function(){
      adManager = AdManagerWrapper.init({
        iasEnabled: true
      });

      adSlotSetup();

      adManager.fetchIasTargeting();

      expect(Array.isArray(adManager.__iasPET.queue)).toEqual(true);
      expect(adManager.__iasPET.queue.length).toEqual(1)
    });
  });

  describe('#refreshSlot', function() {
    var adSlot, stubSlot, baseContainer, refreshSpy;

    beforeEach(function() {
      var setupRefs = adSlotSetup();
      adSlot = setupRefs.adSlot1;
      stubSlot = setupRefs.stubSlot;
      baseContainer = setupRefs.baseContainer;
      // adManager.refreshSlots = jest.fn();
      adManager.options.amazonEnabled = false;
      refreshSpy = jest.spyOn(adManager, 'refreshSlots');
    });

    afterEach(function() {
      $(baseContainer).remove();
    });

    it('- loads the DFP slot matching up with the DOM element id', function() {
      adManager.refreshSlot(adSlot);
      expect(refreshSpy).toHaveBeenCalledWith([stubSlot]);
    });

    it('- should invoke optional callback onRefresh if provided', function () {
      var spy = jest.spyOn(adManager.adUnits.units.header, 'onRefresh');
      adManager.refreshSlot(adSlot);
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('#refreshSlots', function() {
    describe('always', function() {
      var adSlot, stubSlot, eagerStubSlot, baseContainer;

      beforeEach(function(){
        var setupRefs = adSlotSetup();
        adSlot = setupRefs.adSlot1;
        stubSlot = setupRefs.stubSlot;
        eagerStubSlot = setupRefs.eagerStubSlot;
        baseContainer = setupRefs.baseContainer;
        adManager.fetchAmazonBids = jest.fn();
        adManager.fetchIasTargeting = jest.fn();
        adManager.setIndexTargetingForSlots = jest.fn();
      });

      afterEach(function() {
        $(baseContainer).remove();
      });

      it('updates the correlator when ad is not eager loaded', function() {
        adManager = AdManagerWrapper.init({ iasEnabled: true });
        adManager.refreshSlots([stubSlot]);
        expect(adManager.googletag.pubads().updateCorrelator).toHaveBeenCalled();
      });

      it('does not update the correlator when ad is eager loaded', function() {
        adManager = AdManagerWrapper.init({ iasEnabled: true });
        adManager.refreshSlots([eagerStubSlot]);
        expect(adManager.googletag.pubads().updateCorrelator).not.toHaveBeenCalled();
      });
    });

    describe('> prebidEnabled', function() {
      var adSlot, baseContainer, stubSlot, spy;
      beforeEach(function(){
        var setupRefs = adSlotSetup();
        adSlot = setupRefs.adSlot1;
        stubSlot = setupRefs.stubSlot;
        baseContainer = setupRefs.baseContainer;
        adManager.options.amazonEnabled = false;
        adManager.fetchAmazonBids = jest.fn();
        window.pbjs = {
          addAdUnits: jest.fn(),
          que: {
            push: jest.fn()
          }
        };
        spy = jest.spyOn(adManager, 'prebidRefresh');
      });

      afterEach(function() {
        $(baseContainer).remove();
      });

      it('- calls refreshPrebid when prebid is enabled', function() {
        adManager.options.prebidEnabled = true;
        adManager.refreshSlots([stubSlot]);
        expect(spy).toHaveBeenCalled();
      });

      it('- does not call refreshPrebid when prebid is disabled', function() {
        adManager.options.prebidEnabled = false;
        adManager.refreshSlots([stubSlot]);
        expect(spy).not.toHaveBeenCalled();
      });

    });

    describe('> amazonEnabled', function() {
      var adSlot, stubSlot, baseContainer, spy;
      beforeEach(function(){
        var setupRefs = adSlotSetup();
        adSlot = setupRefs.adSlot1;
        stubSlot = setupRefs.stubSlot;
        baseContainer = setupRefs.baseContainer;
        adManager.fetchAmazonBids = jest.fn();
        adManager.setIndexTargetingForSlots = jest.fn();
      });

      afterEach(function() {
        $(baseContainer).remove();
      });

      it('- calls fetchAmazonBids when enabled', function() {
        adManager = AdManagerWrapper.init({ amazonEnabled: true });
        spy = jest.spyOn(adManager, 'fetchAmazonBids');
        adManager.refreshSlots([stubSlot]);
        expect(spy).toHaveBeenCalled();
      });

      it('- does not calls fetchIasTargeting when enabled', function() {
        adManager = AdManagerWrapper.init({ amazonEnabled: false });
        spy = jest.spyOn(adManager, 'fetchAmazonBids');
        adManager.refreshSlots([stubSlot]);
        expect(spy).not.toHaveBeenCalled();
      });
    });

    describe('> iasEnabled', function(){
      var adSlot, stubSlot, baseContainer, spy;
      beforeEach(function(){
        var setupRefs = adSlotSetup();
        adSlot = setupRefs.adSlot1;
        stubSlot = setupRefs.stubSlot;
        baseContainer = setupRefs.baseContainer;
        adManager.fetchAmazonBids = jest.fn();
        adManager.fetchIasTargeting = jest.fn();
        adManager.setIndexTargetingForSlots = jest.fn();
      });

      afterEach(function() {
        $(baseContainer).remove();
      });

      it('- calls fetchIasTargeting when enabled', function() {
        adManager = AdManagerWrapper.init({ iasEnabled: true });
        spy = jest.spyOn(adManager, 'fetchIasTargeting');
        adManager.refreshSlots([stubSlot]);
        expect(spy).toHaveBeenCalled();
      });

      it('- does not calls fetchIasTargeting when enabled', function() {
        adManager = AdManagerWrapper.init({ iasEnabled: false });
        spy = jest.spyOn(adManager, 'fetchIasTargeting');
        adManager.refreshSlots([stubSlot]);
        expect(spy).not.toHaveBeenCalled();
      });
    });
  });
});

