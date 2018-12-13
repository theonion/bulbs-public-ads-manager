var $ = require('jquery');

var TargetingPairs = require('./helpers/TargetingPairs');
var MockGoogleTag = require('../resources/test/mock-google-tag');
var utils = require('./utils');
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
  });

  describe('#logMessage', function() {
    beforeEach(function() {
      console.warn = jest.fn();
      adManager.logMessage('My message', 'warn');
    });

    it('- logs a message', function() {
      expect(console.warn).toHaveBeenCalledWith('My message');
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

      jest.spyOn(TargetingPairs, 'getTargetingPairs').mockReturnValue({});
      adManager.setIndexTargetingForSlots = jest.fn();
      jest.spyOn(adManager, 'setSlotTargeting');

      stubSlot = { setTargeting: jest.fn(), getTargeting: jest.fn() };
    });

    afterEach(function() {
      $(container1).remove();
    });

    describe('> always', function() {
      beforeEach(function() {
        adManager.setSlotTargeting(adSlot1, stubSlot, {});
      });

      it('sets ad index targeting for the slot', function() {
        expect(adManager.setIndexTargetingForSlots).toHaveBeenCalledWith([stubSlot]);
      });
    });

    describe('> kinja targeting pairs', function() {
      beforeEach(function() {
        var TargetingPairs = require('./helpers/TargetingPairs');
        jest.spyOn(TargetingPairs, 'getTargetingPairs').mockImplementation(() => ({
          slotOptions: {
            postId: 1234,
            page: 'permalink'
          }
        }));
        adManager.setSlotTargeting(adSlot1, stubSlot, {});
      });

      it('- sets targeting for each slot option', function() {
        expect(stubSlot.setTargeting).toHaveBeenCalledTimes(3);
        expect(stubSlot.setTargeting).toHaveBeenCalledWith('pos', 'header');
        expect(stubSlot.setTargeting).toHaveBeenCalledWith('postId', '1234');
        expect(stubSlot.setTargeting).toHaveBeenCalledWith('page', 'permalink');
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

      it('- sets all the targeting', function() {
        expect(stubSlot.setTargeting).toHaveBeenCalledTimes(3);
        expect(stubSlot.setTargeting).toHaveBeenCalledWith('pos', 'header');
        expect(stubSlot.setTargeting).toHaveBeenCalledWith('dfp_content_id', '12345');
        expect(stubSlot.setTargeting).toHaveBeenCalledWith('dfp_feature', 'american-voices');
      });
    });

    describe('> element has dataset targeting, with overridden pos value', function() {
      beforeEach(function() {
        var TargetingPairs = require('./helpers/TargetingPairs');

        elementTargeting = JSON.stringify({
          dfp_content_id: 12345,
          dfp_feature: 'american-voices',
          pos: 'overridden_pos'
        });
        jest.spyOn(TargetingPairs, 'getTargetingPairs').mockImplementation(() => ({
          slotOptions: {
            pos: 'original_pos'
          }
        }));
        $(adSlot1).attr('data-targeting', elementTargeting);
        adManager.setSlotTargeting(adSlot1, stubSlot, { pos: 'original_pos' });
      });

      it('- sets all the targeting', function() {
        expect(stubSlot.setTargeting).toHaveBeenCalledTimes(3);
        expect(stubSlot.setTargeting).toHaveBeenCalledWith('pos', 'overridden_pos');
      });
    });

    describe('> element has no dataset targeting', function() {
      beforeEach(function() {
        adManager.setSlotTargeting(adSlot1, stubSlot, {});
      });

      it('- sets at least the pos value', function() {
        expect(stubSlot.setTargeting).toHaveBeenCalledTimes(1);
        expect(stubSlot.setTargeting).toHaveBeenCalledWith('pos', 'header');
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
      jest.spyOn(slot, 'setTargeting');
    });

    it('sets an ad_index to 1 for first on the page', function() {
      adManager.setIndexTargetingForSlots([slot]);
      expect(slot.setTargeting).toHaveBeenCalledWith('ad_index', '1');
    });

    it('increments current ad index for subsequent ad requests', function() {
      adManager.countsByAdSlot = { header: 1 };
      adManager.setIndexTargetingForSlots([slot]);
      expect(slot.setTargeting).toHaveBeenCalledWith('ad_index', '2');
    });
  });

  describe('#configureAd', function() {
    var adSlot1, container1, sizes;

    beforeEach(function() {
      sizes = adManager.adUnits.units.header.sizes;
      jest.spyOn(adManager, 'getAdUnitCode').mockImplementation(() => '/4246/fmg.onion');
      jest.spyOn(adManager, 'adUnitSizes').mockImplementation(() => sizes);
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

      it('- returns the ad', function() {
        expect(adManager.configureAd(adSlot1)).toEqual(adSlot1);
      });

      it('- does not overwrite the id', function() {
        adManager.adId = 1;
        adManager.configureAd(adSlot1);
        expect(adSlot1.id).toEqual('dfp-ad-1');
      });

      it('- does not add a duplicate slot to the slots array', function() {
        expect(Object.keys(adManager.slots).length).toEqual(1);
      });
    });

    describe('> not already loaded', function() {
      var slotStub;

      beforeEach(function() {
        jest.spyOn(adManager, 'setSlotTargeting');
        jest.spyOn(adManager, 'generateId').mockImplementation(() => 'dfp-ad-1');
        jest.spyOn(window.googletag, 'pubads').mockImplementation(() => 'Stub pub ads');
        slotStub = {
          addService: jest.fn(),
          getTargeting: jest.fn(),
          setTargeting: () => {}
        };
        jest.spyOn(window.googletag, 'defineSlot').mockImplementation(() => slotStub);
        adManager.configureAd(adSlot1);
      });

      it('- sets the slot targeting', function() {
        expect(adManager.setSlotTargeting).toHaveBeenCalled();
        expect(adManager.setSlotTargeting.mock.calls[0][0].id).toBe('dfp-ad-1');
        expect(typeof adManager.setSlotTargeting.mock.calls[0][1].addService).toEqual('function');
      });

      it('- defines the slot on the google tag object', function() {
        expect(window.googletag.defineSlot).toHaveBeenCalledWith('/4246/fmg.onion', sizes, 'dfp-ad-1');
      });

      it('- defines activeSizes mapped to the google tag object', function() {
        expect(slotStub.activeSizes).toEqual(sizes);
      });

      it('- defines slotName to be used in a9 amazon header bidding', function() {
        expect(slotStub.slotName).toEqual('header');
      });

      it('- returns the configured slot and adds it to the slots object', function() {
        expect(typeof adManager.slots['dfp-ad-1'].addService).toEqual('function');
      });
    });

    describe('> site section configured', function() {
      var slotStub;

      beforeEach(function() {
        delete window.kinja;
        jest.spyOn(adManager, 'getAdUnitCode').mockImplementation(() => '/4246/fmg.onion/front');
        jest.spyOn(adManager, 'setSlotTargeting');
        jest.spyOn(adManager, 'generateId').mockImplementation(() => 'dfp-ad-1');
        jest.spyOn(window.googletag, 'pubads').mockImplementation(() => 'Stub pub ads');
        slotStub = {
          addService: jest.fn(),
          getTargeting: jest.fn(),
          setTargeting: () => {}
        };
        jest.spyOn(window.googletag, 'defineSlot').mockImplementation(() => slotStub);
        adManager.configureAd(adSlot1);
      });

      afterEach(function() {
        delete window.dfpSiteSection;
      });

      it('- defines the slot on the google tag object', function() {
        expect(window.googletag.defineSlot).toHaveBeenCalledWith('/4246/fmg.onion/front', sizes, 'dfp-ad-1');
      });

      it('- sets whether the ad should be eager loaded', function() {
        var configuredSlot = adManager.configureAd(adSlot1);
        expect(configuredSlot.eagerLoad).toEqual(true);
      });
    });
  });
});

