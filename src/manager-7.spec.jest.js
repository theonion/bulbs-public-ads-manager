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

  describe('#prebidRefresh', function() {
    var baseContainer, container1, adSlot1, stubSlot, pbjs;

    beforeEach(function() {
        adManager.pbjs = pbjs = window.pbjs = {
          que: [],
          requestBids: jest.fn(),
          addAdUnits: jest.fn(),
        };
        baseContainer = document.createElement('div');
        container1 = document.createElement('div');
        container1.className ='expected';
        container1.id = 'ad-container-1';
        adSlot1 = document.createElement('div');
        adSlot1.id = 'dfp-ad-1';
        adSlot1.className = 'dfp';
        container1.appendChild(adSlot1);
        baseContainer.appendChild(container1);
        adManager.options.amazonEnabled = false;
        adManager.options.prebidEnabled = true;

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
          setTargeting: function () {}
        };

        adManager.slots = {
          'dfp-ad-1': stubSlot
        };

    });

    afterEach(function() {
      $(baseContainer).remove();
    });

    it('- calls pbjs.requestBids when adunit-level prebid config is present', function() {
      adManager.prebidRefresh([stubSlot]);
      pbjs.que[0](); // let the pbjs queue run one step
      expect(pbjs.requestBids).toHaveBeenCalled();
    });

    xit('- calls googletag.pubads().refresh directly when no units are configured for prebid', function() {
      // adManager.googletag.pubads.mockReturnValue({
      //   refresh: jest.fn(),
      //   getSlots: function() {return []},
      //   updateCorrelator: sinon.spy()
      // });
      stubSlot.prebid = false;
      adManager.refreshSlots([stubSlot]);
      googletag.cmd[0](); // let the googletag queue run one step
      expect(googletag.pubads).toHaveBeenCalled();
      // expect(googletag.pubads().refresh).toHaveBeenCalled(); // shouldn't it be this..?
      expect(pbjs.requestBids).not.toHaveBeenCalled();
    });
  });

  describe('#asyncRefreshSlot', function() {
    var baseContainer, container1, adSlot1, ads, stubSlot;

    beforeEach(function() {
      TestHelper.stub(adManager, 'refreshSlot');

      baseContainer = document.createElement('div');
      container1 = document.createElement('div');
      container1.className ='expected';
      container1.id = 'ad-container-1';
      adSlot1 = document.createElement('div');
      adSlot1.id = 'dfp-ad-1';
      adSlot1.className = 'dfp';
      container1.appendChild(adSlot1);
      baseContainer.appendChild(container1);

      document.body.appendChild(baseContainer);
    });

    afterEach(function() {
      $(baseContainer).remove();
    });

    describe('> api is ready', function() {
      beforeEach(function() {
        window.googletag.apiReady = true;
        adManager.asyncRefreshSlot(adSlot1);
      });

      it('- refreshes the slot right away', function() {
        expect(adManager.refreshSlot.toHaveBeenCalledWith(adSlot1));
      });
    });

    describe('> api is not ready', function() {
      beforeEach(function (done) {
        window.googletag.apiReady = false;
        window.googletag.cmd = {
          push: function(callback) {
            setTimeout(function() {
              callback();
              done();
            }, 50);
          }
        };
        adManager.asyncRefreshSlot(adSlot1);
      });

      it('- refreshes the slot by way of the `cmd` async queue', function () {
        expect(adManager.refreshSlot.toHaveBeenCalledWith(adSlot1));
      });
    });
  });

  describe('#unloadAds', function() {
    var baseContainer, container1, container2, adSlot1, adSlot2;

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

      document.body.appendChild(baseContainer);

      TestHelper.stub(adManager.googletag, 'pubads').returns({
        clear: jest.fn()
      });

      adManager.slots = {};
      adManager.slots['dfp-ad-1'] = adSlot1;
      adManager.slots['dfp-ad-2'] = adSlot2;
    });

    afterEach(function() {
      $(baseContainer).remove();
    });

    describe('> not initialized', function() {
      beforeEach(function() {
        adManager.initialized = false;
        adManager.unloadAds();
      });

      it('- does not clear anything', function() {
        expect(adManager.googletag.pubads().clear).not.toHaveBeenCalled();
      });

      it('- leaves slots intact', function() {
        expect(adManager.slots).toEqual({
          'dfp-ad-1': adSlot1,
          'dfp-ad-2': adSlot2
        });
      });
    });

    describe('> initialized', function() {
      beforeEach(function() {
        adManager.initialized = true;
        adManager.unloadAds();
      });

      it('- removes all elements from the slots', function() {
        expect(adManager.slots).toEqual({});
      });

      it('- clears all slots through the pubads service', function() {
        expect(adManager.googletag.pubads().clear).toHaveBeenCalledWith([adSlot1, adSlot2]);
      });

      it('- resets the load state attribute', function() {
        expect($(adSlot1).data('ad-load-state')).toEqual('unloaded');
        expect($(adSlot2).data('ad-load-state')).toEqual('unloaded');
      });
    });
  });

  describe('#getAdUnitCode', function() {
    describe('> Bulbs', function() {
      beforeEach(function() {
        delete window.kinja;
      });

      afterEach(function() {
        delete window.dfpSiteSection;
      });

      it('- returns the bulbs convention', function() {
        expect(adManager.getAdUnitCode()).toEqual('/4246/fmg.onion');
      });

      it('- tacks on the dfpSiteSection to the ad unit code if available', function() {
        window.dfpSiteSection = 'front';
        expect(adManager.getAdUnitCode()).toEqual('/4246/fmg.onion/front');
      });
    });

    describe('> Kinja', function() {
      beforeEach(function() {
        window.kinja = {};
      });

      describe('> forced ad zone is set to collapse', function() {
        it('- uses collapse sub-level ad unit', function() {
          AdZone.forcedAdZone.mockReturnValueOnce('collapse');
          expect(adManager.getAdUnitCode()).toEqual('/4246/fmg.onion/collapse');
        });
      });

      describe('> front page, no forced ad zone', function() {
        it('- uses front', function() {
          TargetingPairs.getTargetingPairs.mockReturnValueOnce({
            slotOptions: { page: 'frontpage' }
          });
          expect(adManager.getAdUnitCode()).toEqual('/4246/fmg.onion/front');
        });
      });

      describe('> most pages', function() {
        it('- uses the page type on meta', function() {
          TargetingPairs.getTargetingPairs.mockReturnValueOnce({
            slotOptions: { page: 'permalink' }
          });
          expect(adManager.getAdUnitCode()).toEqual('/4246/fmg.onion/permalink');
        });
      });
    });
  });
});

