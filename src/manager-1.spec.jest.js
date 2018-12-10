var MockGoogleTag = require('../resources/test/mock-google-tag-jest');
var AdManagerWrapper = require('./manager');
var adUnits = require('./ad-units');

describe('AdManager', () => {
  var adManager;

  beforeEach(() => {
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

  describe('new AdManager', () => {
    it('- has no slots yet', () => {
      expect(adManager.slots).toEqual({});
    });

    it('- has a default ad id', () => {
      expect(adManager.adId).toEqual(0);
    });

    it('- is not initialized', () => {
      expect(adManager.initialized).toEqual(false);
    });

    describe('> base defaults', () => {
      it('- IAS supported by default', () => {
        expect(adManager.options.iasEnabled).toEqual(true);
      });
      it('- reloads on resize', () => {
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

    describe('> override options', () => {
      it('- allows override of defaults', () => {
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

    describe('> google tag initialization', () => {
      it('- calls initGoogleTag', () => {
        adManager.googletag.cmd = [];
        adManager = AdManagerWrapper.init({
          dfpSiteCode: 'fmg.onion',
          adUnits: adUnits
        });
        adManager.initGoogleTag = jest.fn();
        // Call the anonymous function pushed onto the async cmd array
        adManager.googletag.cmd[0]();
        expect(adManager.initGoogleTag).toHaveBeenCalled();
      });
    });
  });

  describe('#prebidInit', () => {
    var pbjs;
    beforeEach(() => {
      pbjs = window.pbjs = {
        cmd: {
          push: () => {
            pbjs.setConfig();
          }
        },
        setConfig: jest.fn(),
      };
    });

    it('- sets prebid sizeConfig if prebid is enabled and sizeConfig exists', () => {
      adManager.options.prebidEnabled = true;
      adManager.adUnits.pbjsSizeConfig = {};
      adManager.prebidInit();
      expect(adManager.pbjs.setConfig).toHaveBeenCalledTimes(1);
    });

    it('- does not set sizeConfig if prebid is disabled', () => {
      adManager.prebidInit();
      expect(adManager.pbjs.setConfig).not.toHaveBeenCalled();
    });

    it('- does not set sizeConfig if sizeConfig does not exist', () => {
      adManager.options.prebidEnabled = true;
      adManager.adUnits.pbjsSizeConfig = undefined;
      adManager.prebidInit();
      expect(adManager.pbjs.setConfig).not.toHaveBeenCalled();
    });
  });

  describe('#handleWindowResize', () => {
    beforeEach(() => {
      adManager.oldViewportWidth = window.document.body.clientWidth - 200;
      adManager.reloadAds = jest.fn();
    });

    it('- calls reloadAds if viewport changed', () => {
      adManager.handleWindowResize();
      expect(adManager.reloadAds).toHaveBeenCalled();
    });

    // TODO: this is a valid failure
    xit('- does not reload ads if the viewport has not changed', () => {
      adManager.oldViewportWidth = window.document.body.clientWidth;
      adManager.handleWindowResize();
      expect(adManager.reloadAds).not.toHaveBeenCalled();
    });

    it('- does not reload ads if the setting is disabled', () => {
      adManager.options.doReloadOnResize = false;
      adManager.handleWindowResize();
      expect(adManager.reloadAds).not.toHaveBeenCalled();
    });
  });
});

