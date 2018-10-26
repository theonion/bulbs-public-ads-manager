var Cookie = require('js-cookie');

var TargetingPairs = require('./helpers/TargetingPairs');
var AdZone = require('./helpers/AdZone');
var MockGoogleTag = require('../resources/test/mock-google-tag');
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

  describe('#logMessage', function() {
    beforeEach(function() {
      TestHelper.spyOn(console, 'warn');
      adManager.logMessage('My message', 'warn');
    });

    xit('- logs a message', function() {
      expect(console.warn.toHaveBeenCalledWith('My message'));
    });
  });

  describe('#setSlotTargeting', function() {
    var container1, adSlot1, stubSlot;

    beforeEach(function() {
      container1 = document.createElement('div');
      adSlot1 = document.createElement('div');
      adSlot1.id = 'dfp-ad-1';
      adSlot1.className = 'dfp';
      adSlot1.setAttribute('data-ad-unit', 'header');
      container1.appendChild(adSlot1);
      document.body.appendChild(container1);

      adManager.targeting = { dfp_site: 'onion', dfp_pagetype: 'article' };

      TestHelper.stub(TargetingPairs, 'getTargetingPairs').returns({});
      TestHelper.stub(AdZone, 'forcedAdZone').returns('');
      TestHelper.stub(adManager, 'setIndexTargetingForSlots');

      stubSlot = { setTargeting: sinon.spy() };
    });

    afterEach(function() {
      $(container1).remove();
    });

    describe('> always', function() {
      beforeEach(function() {
        TargetingPairs.getTargetingPairs.returns({});
        adManager.setSlotTargeting(adSlot1, stubSlot, {});
      });

      xit('sets ad index targeting for the slot', function() {
        expect(adManager.setIndexTargetingForSlots.toHaveBeenCalledWith([stubSlot]));
      });
    });

    describe('> kinja targeting pairs', function() {
      beforeEach(function() {
        TargetingPairs.getTargetingPairs.returns({
          slotOptions: {
            postId: 1234,
            page: 'permalink'
          }
        });
        adManager.setSlotTargeting(adSlot1, stubSlot, {});
      });

      xit('- sets targeting for each slot option', function() {
        expect(stubSlot.setTargeting.callCount).toEqual(3);
        expect(stubSlot.setTargeting.toHaveBeenCalledWith('pos', 'header'));
        expect(stubSlot.setTargeting.toHaveBeenCalledWith('postId', '1234'));
        expect(stubSlot.setTargeting.toHaveBeenCalledWith('page', 'permalink'));
      });
    });

    describe('> element has dataset targeting', function() {
      beforeEach(function() {
        elementTargeting = JSON.stringify({
          dfp_content_id: 12345,
          dfp_feature: 'american-voices'
        });
        $(adSlot1).attr('data-targeting', elementTargeting);
        adManager.setSlotTargeting(adSlot1, stubSlot, {});
      });

      xit('- sets all the targeting', function() {
        expect(stubSlot.setTargeting.callCount).toEqual(3);
        expect(stubSlot.setTargeting.toHaveBeenCalledWith('pos', 'header'));
        expect(stubSlot.setTargeting.toHaveBeenCalledWith('dfp_content_id', '12345'));
        expect(stubSlot.setTargeting.toHaveBeenCalledWith('dfp_feature', 'american-voices'));
      });
    });

    describe('> element has dataset targeting, with overridden pos value', function() {
      beforeEach(function() {
        elementTargeting = JSON.stringify({
          dfp_content_id: 12345,
          dfp_feature: 'american-voices',
          pos: 'overridden_pos'
        });
        $(adSlot1).attr('data-targeting', elementTargeting);
        TargetingPairs.getTargetingPairs.returns({
          slotOptions: {
            pos: 'original_pos'
          }
        });
        adManager.setSlotTargeting(adSlot1, stubSlot, { pos: 'original_pos' });
      });

      xit('- sets all the targeting', function() {
        expect(stubSlot.setTargeting.callCount).toEqual(3);
        expect(stubSlot.setTargeting.toHaveBeenCalledWith('pos', 'overridden_pos'));
      });
    });

    describe('> element has no dataset targeting', function() {
      beforeEach(function() {
        adManager.setSlotTargeting(adSlot1, stubSlot, {});
      });

      xit('- sets at least the pos value', function() {
        expect(stubSlot.setTargeting.callCount).toEqual(1);
        expect(stubSlot.setTargeting.toHaveBeenCalledWith('pos', 'header'));
      });
    });
  });

  describe('#setIndexTargetingForSlots', function() {
    var slot;

    beforeEach(function() {
      adManager.countsByAdSlot = {};
      slot = {
        getTargeting: function (key) {
          return 'header';
        },
        setTargeting: function () {}
      };
      TestHelper.stub(slot, 'setTargeting');
    });

    xit('sets an ad_index to 1 for first on the page', function() {
      adManager.setIndexTargetingForSlots([slot]);
      expect(slot.setTargeting.toHaveBeenCalledWith('ad_index', '1'));
    });

    xit('increments current ad index for subsequent ad requests', function() {
      adManager.countsByAdSlot = { header: 1 };
      adManager.setIndexTargetingForSlots([slot]);
      expect(slot.setTargeting.toHaveBeenCalledWith('ad_index', '2'));
    });
  });

  describe('#configureAd', function() {
    var adSlot1, container1, sizes;

    beforeEach(function() {
      sizes = adManager.adUnits.units.header.sizes;
      TestHelper.stub(adManager, 'getAdUnitCode').returns('/4246/fmg.onion');
      TestHelper.stub(adManager, 'adUnitSizes').returns(sizes);
      container1 = document.createElement('div');
      adSlot1 = document.createElement('div');
      adSlot1.className = 'dfp';
      $(adSlot1).attr('data-ad-unit', 'header');
      container1.appendChild(adSlot1);
      document.body.appendChild(container1);
    });

    afterEach(function() {
      $(container1).remove();
    });

    describe('> already loaded ad', function() {
      beforeEach(function() {
        adSlot1.id = 'dfp-ad-1';
        adManager.slots['dfp-ad-1'] = adSlot1;
      });

      xit('- returns the ad', function() {
        expect(adManager.configureAd(adSlot1)).toEqual(adSlot1);
      });

      xit('- does not overwrite the id', function() {
        adManager.adId = 1;
        adManager.configureAd(adSlot1);
        expect(adSlot1.id).toEqual('dfp-ad-1');
      });

      xit('- does not add a duplicate slot to the slots array', function() {
        expect(Object.keys(adManager.slots).length).toEqual(1);
      });
    });

    describe('> not already loaded', function() {
      var configuredSlot, slotStub;

      beforeEach(function() {
        TestHelper.stub(adManager, 'setSlotTargeting');
        TestHelper.stub(adManager, 'generateId').returns('dfp-ad-1');
        TestHelper.stub(window.googletag, 'pubads').returns('Stub pub ads');
        slotStub = {
          addService: sinon.spy(),
          setTargeting: function () {}
        };
        TestHelper.stub(window.googletag, 'defineSlot').returns(slotStub);
        configuredSlot = adManager.configureAd(adSlot1);
      });

      xit('- sets the slot targeting', function() {
        expect(adManager.setSlotTargeting).toHaveBeenCalled();
        expect(adManager.setSlotTargeting.args[0][0].id).toEqual('dfp-ad-1');
        expect(typeof adManager.setSlotTargeting.args[0][1].addService).toEqual('function');
      });

      xit('- defines the slot on the google tag object', function() {
        expect(window.googletag.defineSlot.toHaveBeenCalledWith('/4246/fmg.onion', sizes, 'dfp-ad-1'));
      });

      xit('- defines activeSizes mapped to the google tag object', function() {
        expect(slotStub.activeSizes).toEqual(sizes);
      });

      xit('- defines slotName to be used in a9 amazon header bidding', function() {
        expect(slotStub.slotName).toEqual('header');
      });

      xit('- returns the configured slot and adds it to the slots object', function() {
        expect(typeof adManager.slots['dfp-ad-1'].addService).toEqual('function');
      });
    });

    describe('> site section configured', function() {
      var configuredSlot, slotStub;

      beforeEach(function() {
        delete window.kinja;
        adManager.getAdUnitCode.returns('/4246/fmg.onion/front');
        TestHelper.stub(adManager, 'setSlotTargeting');
        TestHelper.stub(adManager, 'generateId').returns('dfp-ad-1');
        TestHelper.stub(window.googletag, 'pubads').returns('Stub pub ads');
        slotStub = {
          addService: sinon.spy(),
          setTargeting: function () {}
        };
        TestHelper.stub(window.googletag, 'defineSlot').returns(slotStub);
        configuredSlot = adManager.configureAd(adSlot1);
      });

      afterEach(function() {
        delete window.dfpSiteSection;
      });

      xit('- defines the slot on the google tag object', function() {
        expect(window.googletag.defineSlot.toHaveBeenCalledWith('/4246/fmg.onion/front', sizes, 'dfp-ad-1'));
      });

      xit('- sets whether the ad should be eager loaded', function() {
        var configuredSlot = adManager.configureAd(adSlot1);
        expect(configuredSlot.eagerLoad).toEqual(true);
      });
    });
  });
});

