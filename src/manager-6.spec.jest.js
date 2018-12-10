var Cookie = require('js-cookie');
var $ = require('jquery');

var TargetingPairs = require('./helpers/TargetingPairs');
var AdZone = require('./helpers/AdZone');
var MockGoogleTag = require('../resources/test/mock-google-tag-jest');
var utils = require('./utils');
var AdManagerWrapper = require('./manager');
var adUnits = require('./ad-units');

jest.mock('./helpers/AdZone');
jest.mock('./helpers/TargetingPairs');

var TestHelper = {
  spyOn: () => {},
  stub: () => {}
};

describe('AdManager', function() {
  var adManager;

  beforeEach(function() {
    window.googletag = new MockGoogleTag();
    window.Bulbs = { settings: { AMAZON_A9_ID: '1234' } };
    window.TARGETING = {
      dfp_site: 'onion',
      dfp_pagetype: 'homepage'
    };
    TestHelper.spyOn(Cookie, 'set');
    TestHelper.spyOn(Cookie, 'get');

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

  describe('#fetchAmazonBids', function () {
    var slots;

    beforeEach(function() {
     var headertag = window.headertag = {};
      sandbox = sinon.sandbox.create();
      window.apstag = {
        fetchBids: function () {
          this.callArg(callback);
        },
        setDisplayBids: function () {}
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

      sandbox.stub(window.headertag.cmd, 'push');
      sandbox.stub(window.googletag.cmd, 'push');
      sandbox.stub(window.apstag, 'fetchBids');
    });

    afterEach(function() {
      sandbox.restore();
    });

    xit('- call to apstag functions if apstag is defined', function () {
      adManager.fetchAmazonBids(slots);
      expect(window.apstag.fetchBids).toHaveBeenCalled();
      var fetchedSlots = window.apstag.fetchBids.args[0][0].slots;

      expect(fetchedSlots.length).toEqual(1);
      expect(fetchedSlots[0].slotID).toEqual(slots[0].getSlotElementId());
      expect(fetchedSlots[0].sizes).toEqual(slots[0].activeSizes);
      expect(fetchedSlots[0].slotName).toEqual('/4246/fmg.onion_' + slots[0].slotName);
    });

    xit('- does not include out of page slots', function () {
      slots.push({
          getSlotElementId: function () { return 'dfp-ad-20'; },
          getOutOfPage: function () { return true; },
          activeSizes: [[728, 90]],
          slotName: 'out-of-page'
      });
      adManager.fetchAmazonBids(slots);
      expect(window.apstag.fetchBids).toHaveBeenCalled();
      var fetchedSlots = window.apstag.fetchBids.args[0][0].slots;

      expect(fetchedSlots.length).toEqual(1);
      expect(fetchedSlots[0].slotID).toEqual(slots[0].getSlotElementId());
    });

    xit('- does not include slots which currently have no allowed creative sizes based on the current viewport', function () {
      slots.push({
          getSlotElementId: function () { return 'dfp-ad-20'; },
          getOutOfPage: function () { return false; },
          activeSizes: [],
          slotName: 'non-viewport-slot'
      });
      adManager.fetchAmazonBids(slots);
      expect(window.apstag.fetchBids).toHaveBeenCalled();
      var fetchedSlots = window.apstag.fetchBids.args[0][0].slots;

      expect(fetchedSlots.length).toEqual(1);
      expect(fetchedSlots[0].slotID).toEqual(slots[0].getSlotElementId());
    });

    xit('- does not call fetchBids if none of the slots passed in have valid sizes for the viewport', function () {
      slots = [{
          getSlotElementId: function () { return 'dfp-ad-20'; },
          getOutOfPage: function () { return false; },
          activeSizes: [],
          slotName: 'non-viewport-slot'
      }];
      adManager.fetchAmazonBids(slots);
      expect(window.apstag.fetchBids).not.toHaveBeenCalled();
    });

    xit('- does not include native slots (sizes `fluid`)', function () {
      slots.push({
          getSlotElementId: function () { return 'dfp-ad-20'; },
          getOutOfPage: function () { return false; },
          activeSizes: ['fluid'],
          slotName: 'native'
      });
      adManager.fetchAmazonBids(slots);
      expect(window.apstag.fetchBids).toHaveBeenCalled();
      var fetchedSlots = window.apstag.fetchBids.args[0][0].slots;

      expect(fetchedSlots.length).toEqual(1);
      expect(fetchedSlots[0].slotID).toEqual(slots[0].getSlotElementId());
    });

    xit('- sets targeting once bids are returned from apstag api', function (done) {
      adManager.fetchAmazonBids(slots);
      callback();
      expect(window.headertag.cmd.push.calledOnce).toEqual(true);
      done();
    });

    xit('- sets targeting using googletag if Index not on page once bids are returned from apstag api', function (done) {
      delete window.headertag;
      adManager.fetchAmazonBids(slots);
      callback();
      expect(window.googletag.cmd.push.calledOnce).toEqual(true);
      done();
    });
  });

  // Setup method utilized by #refreshSlot & #refreshSlots tests
  function adSlotSetup(){
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
    }


    adManager.slots = {
      'dfp-ad-1': stubSlot
    };
    return variableReferences;
  }

  describe('#fetchIasTargeting', function(){
    afterEach(function(){
      adManager.__iasPET.queue = [];
    });

    xit('- pushes ad slots to PET tag queue', function(){
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
    var adSlot, stubSlot, baseContainer;

    beforeEach(function() {
      var setupRefs = adSlotSetup();
      adSlot = setupRefs.adSlot1;
      stubSlot = setupRefs.stubSlot;
      baseContainer = setupRefs.baseContainer;
      adManager.refreshSlots = jest.fn();
      adManager.options.amazonEnabled = false;
    });

    afterEach(function() {
      $(baseContainer).remove();
    });

    xit('- loads the DFP slot matching up with the DOM element id', function() {
      adManager.refreshSlot(adSlot);
      expect(adManager.refreshSlots).toHaveBeenCalledWith([stubSlot]);
    });

    xit('- should invoke optional callback onRefresh if provided', function () {
      TestHelper.stub(adManager.adUnits.units.header, 'onRefresh');
      adManager.refreshSlot(adSlot);
      expect(adManager.adUnits.units.header.onRefresh.called).to.be.true;
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
      });

      afterEach(function() {
        $(baseContainer).remove();
      });

      xit('updates the correlator when ad is not eager loaded', function() {
        adManager = AdManagerWrapper.init({ iasEnabled: true });
        TestHelper.stub(adManager, 'fetchAmazonBids');
        TestHelper.stub(adManager, 'fetchIasTargeting');
        TestHelper.stub(adManager, 'setIndexTargetingForSlots');

        adManager.refreshSlots([stubSlot]);

        expect(adManager.googletag.pubads().updateCorrelator).toHaveBeenCalled();
      });

      xit('does not update the correlator when ad is eager loaded', function() {
        adManager = AdManagerWrapper.init({ iasEnabled: true });
        TestHelper.stub(adManager, 'fetchAmazonBids');
        TestHelper.stub(adManager, 'fetchIasTargeting');
        TestHelper.stub(adManager, 'setIndexTargetingForSlots');

        adManager.refreshSlots([eagerStubSlot]);

        expect(adManager.googletag.pubads().updateCorrelator).not.toHaveBeenCalled();
      });
    });

    describe('> prebidEnabled', function(){
      var adSlot, baseContainer, stubSlot;
      beforeEach(function(){
        var setupRefs = adSlotSetup();
        adSlot = setupRefs.adSlot1;
        stubSlot = setupRefs.stubSlot;
        baseContainer = setupRefs.baseContainer;
        adManager.options.amazonEnabled = false;

        adManager.prebidRefresh = jest.fn();
        adManager.fetchAmazonBids = jest.fn();
        // TestHelper.stub(adManager, 'prebidRefresh');
        // TestHelper.stub(adManager, 'fetchAmazonBids');
      });

      afterEach(function() {
        $(baseContainer).remove();
      });

      xit('- calls refreshPrebid when prebid is enabled', function() {
        const spy = jest.spyOn(adManager, 'prebidRefresh');

        adManager.options.prebidEnabled = true;
        adManager.refreshSlots([stubSlot]);
        expect(spy).toHaveBeenCalled();
      });

      xit('- does not call refreshPrebid when prebid is disabled', function() {
        const spy = jest.spyOn(adManager, 'prebidRefresh');

        adManager.options.prebidEnabled = false;
        adManager.refreshSlots([stubSlot]);
        expect(adManager.prebidRefresh).not.toHaveBeenCalled();
      });

    });

    describe('> amazonEnabled', function() {
      var adSlot, stubSlot, baseContainer;
      beforeEach(function(){
        var setupRefs = adSlotSetup();
        adSlot = setupRefs.adSlot1;
        stubSlot = setupRefs.stubSlot;
        baseContainer = setupRefs.baseContainer;
      });

      afterEach(function() {
        $(baseContainer).remove();
      });

      xit('- calls fetchAmazonBids when enabled', function() {
        adManager = AdManagerWrapper.init({ amazonEnabled: true });
        // TestHelper.stub(adManager, 'fetchAmazonBids');
        // TestHelper.stub(adManager, 'setIndexTargetingForSlots');
        const spy = jest.spyOn(adManager, 'fetchAmazonBids');

        adManager.refreshSlots([stubSlot]);

        expect(spy).toHaveBeenCalled();
      });

      xit('- does not calls fetchIasTargeting when enabled', function() {
        adManager = AdManagerWrapper.init({ amazonEnabled: false });
        // TestHelper.stub(adManager, 'fetchAmazonBids');
        // TestHelper.stub(adManager, 'setIndexTargetingForSlots');
        const spy = jest.spyOn(adManager, 'fetchAmazonBids');

        adManager.refreshSlots([stubSlot]);

        expect(spy).not.toHaveBeenCalled();
      });
    });

    describe('> iasEnabled', function(){
      var adSlot, stubSlot, baseContainer;
      beforeEach(function(){
        var setupRefs = adSlotSetup();
        adSlot = setupRefs.adSlot1;
        stubSlot = setupRefs.stubSlot;
        baseContainer = setupRefs.baseContainer;
      });

      afterEach(function() {
        $(baseContainer).remove();
      });

      xit('- calls fetchIasTargeting when enabled', function() {
        adManager = AdManagerWrapper.init({ iasEnabled: true });
        // TestHelper.stub(adManager, 'fetchAmazonBids');
        // TestHelper.stub(adManager, 'fetchIasTargeting');
        // TestHelper.stub(adManager, 'setIndexTargetingForSlots');
        const spy = jest.spyOn(adManager, 'fetchIasTargeting');

        adManager.refreshSlots([stubSlot]);

        expect(spy).toHaveBeenCalled();
      });

      xit('- does not calls fetchIasTargeting when enabled', function() {
        adManager = AdManagerWrapper.init({ iasEnabled: false });
        // TestHelper.stub(adManager, 'fetchAmazonBids');
        // TestHelper.stub(adManager, 'fetchIasTargeting');
        // TestHelper.stub(adManager, 'setIndexTargetingForSlots');
        const spy = jest.spyOn(adManager, 'fetchIasTargeting');

        adManager.refreshSlots([stubSlot]);

        expect(spy).not.toHaveBeenCalled();
      });
    });
  });
});

