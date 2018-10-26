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

  describe('new AdManager', function() {
    it('- has no slots yet', function() {
      expect(adManager.slots).toEqual({});
    });

    it('- has a default ad id', function() {
      expect(adManager.adId).toEqual(0);
    });

    it('- is not initialized', function() {
      expect(adManager.initialized).toEqual(false);
    });

    describe('> base defaults', function() {
      it('- IAS supported by default', function() {
        expect(adManager.options.iasEnabled).toEqual(true);
      });
      it('- reloads on resize', function() {
        expect(adManager.options.doReloadOnResize).toEqual(true);
      });
    });

    describe('> IAS functions correctly', function () {
      var adManagerTestOptions = {
        iasPubId: 123456,
        dfpSiteCode: 'fmg.onion',
        adUnits: adUnits
      }
      it('- constructs the adManager correctly', function () {
        adManager = AdManagerWrapper.init(adManagerTestOptions);
        expect(adManager.options.iasEnabled).toEqual(true);
        expect(adManager.options.iasPubId).toEqual(adManagerTestOptions.iasPubId);
        expect(adManager.__iasPET).toEqual(window.__iasPET);
      });
      it('- PET tag initialization', function () {
        adManager = AdManagerWrapper.init(adManagerTestOptions);
        expect(typeof window.__iasPET).toEqual('object');
        expect(Array.isArray(window.__iasPET.queue)).toEqual(true);
        expect(window.__iasPET.pubId).toEqual(adManagerTestOptions.iasPubId);
      });
    });

    describe('> override options', function() {
      it('- allows override of defaults', function() {
        adManager = AdManagerWrapper.init({
          doReloadOnResize: false,
          dfpSiteCode: 'fmg.onion',
          iasEnabled: false,
          adUnits: adUnits
         });
        expect(adManager.options.doReloadOnResize).toEqual(false);
        expect(adManager.options.iasEnabled).toEqual(false);
      });
    });

    describe('> google tag initialization', function() {
      // TODO - come back to this one later
      fit('- calls initGoogleTag', function() {
        adManager.googletag.cmd = [];
        adManager = AdManagerWrapper.init({
          dfpSiteCode: 'fmg.onion',
          adUnits: adUnits
        });
        // Call the anonymous function pushed onto the async cmd array
        adManager.googletag.cmd[0]();
        var spy = jest.spyOn(adManager, 'initGoogleTag');
        expect(spy).toHaveBeenCalled();
      });
    });
  });

  describe('#prebidInit', function() {
    var pbjs;
    beforeEach(function() {
      pbjs = window.pbjs = {
        cmd: {
          push: function() {
            pbjs.setConfig();
          }
        },
        setConfig: jest.fn(),
      };
    });

    it('- sets prebid sizeConfig if prebid is enabled and sizeConfig exists', function() {
      adManager.options.prebidEnabled = true;
      adManager.adUnits.pbjsSizeConfig = {};
      adManager.prebidInit();
      expect(adManager.pbjs.setConfig).toHaveBeenCalledTimes(1);
    });

    it('- does not set sizeConfig if prebid is disabled', function() {
      adManager.prebidInit();
      expect(adManager.pbjs.setConfig).not.toHaveBeenCalled();
    });

    it('- does not set sizeConfig if sizeConfig does not exist', function() {
      adManager.options.prebidEnabled = true;
      adManager.adUnits.pbjsSizeConfig = undefined;
      adManager.prebidInit();
      expect(adManager.pbjs.setConfig).not.toHaveBeenCalled();
    });
  });

  describe('#handleWindowResize', function() {
    beforeEach(function() {
      adManager.oldViewportWidth = window.document.body.clientWidth - 200;
      adManager.reloadAds = jest.fn();
    });

    it('- calls reloadAds if viewport changed', function() {
      adManager.handleWindowResize();
      expect(adManager.reloadAds).toHaveBeenCalled();
    });

    // TODO: this is a valid failure
    xit('- does not reload ads if the viewport has not changed', function() {
      adManager.oldViewportWidth = window.document.body.clientWidth;
      adManager.handleWindowResize();
      expect(adManager.reloadAds).not.toHaveBeenCalled();
    });

    it('- does not reload ads if the setting is disabled', function() {
      adManager.options.doReloadOnResize = false;
      adManager.handleWindowResize();
      expect(adManager.reloadAds).not.toHaveBeenCalled();
    });
  });
});

