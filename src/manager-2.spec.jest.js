var Cookie = require('js-cookie');
var AdZone = require('./helpers/AdZone');
var MockGoogleTag = require('../resources/test/mock-google-tag-jest');
var utils = require('./utils');
var AdManagerWrapper = require('./manager');
var adUnits = require('./ad-units');

describe('AdManager', function() {
  var adManager, pubads;

  beforeEach(function() {
    window.googletag = new MockGoogleTag();
    window.Bulbs = { settings: { AMAZON_A9_ID: '1234' } };
    window.TARGETING = {
      dfp_site: 'onion',
      dfp_pagetype: 'homepage'
    };
    window.Cookies = Cookie;
    jest.spyOn(Cookie, 'set');
    jest.spyOn(Cookie, 'get');

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

  afterEach(function() {
    Cookie.remove('utmSession');
  });

  describe('#initGoogleTag', function() {
    beforeEach(function() {
      adManager.setPageTargeting = jest.fn();
      adManager.loadAds = jest.fn();
      adManager.googletag.enableServices = jest.fn();
      adManager.initialized = false;
      adManager.initGoogleTag();
    });

    describe('TARGETING global, and a forced ad zone', function () {
      it('merges pre-existing contextual targeting with forced ad zone', function() {
        window.TARGETING = { dfpcontentid: 'foo-bar-baz' };
        jest.spyOn(AdZone, 'forcedAdZone').mockImplementation(() => 'adtest');
        adManager.initGoogleTag();

        expect(adManager.targeting.dfpcontentid).toEqual('foo-bar-baz');
        expect(adManager.targeting.forcedAdZone).toEqual('adtest');
      });
    });

    it('- enable single request mode when option enabled, otherwise disable it', function() {
      expect(adManager.googletag.pubads().enableSingleRequest).not.toHaveBeenCalled();
      adManager.options.enableSRA = true;
      adManager.initGoogleTag();
      expect(adManager.googletag.pubads().enableSingleRequest).toHaveBeenCalled();
    });

    it('- disables initial load of ads, to defer to the eager/lazy loading logic', function() {
      expect(adManager.googletag.pubads().disableInitialLoad).toHaveBeenCalled();
    });

    it('- enables async rendering to avoid page blocking and allow the manual use of `updateCorrelator`', function() {
      expect(adManager.googletag.pubads().enableAsyncRendering).toHaveBeenCalled();
    });

    it('- always updates the correlator automatically whenever the ad lib is loaded', function() {
      expect(adManager.googletag.pubads().updateCorrelator).toHaveBeenCalled();
    });

    it('- sets up custom slot render ended callback', function() {
      expect(adManager.googletag.pubads().addEventListener).toHaveBeenCalledWith('slotRenderEnded', adManager.onSlotRenderEnded);
    });

    it('- sets up custom slot onImpressionViewable callback', function() {
      expect(adManager.googletag.pubads().addEventListener).toHaveBeenCalledWith('impressionViewable', adManager.onImpressionViewable);
    });

    it('- sets up custom slot onload callback', function() {
      expect(adManager.googletag.pubads().addEventListener).toHaveBeenCalledWith('slotOnload', adManager.onSlotOnload);
    });

    it('- sets the global targeting on the pub ads service', function() {
      expect(adManager.setPageTargeting).toHaveBeenCalled();
    });

    it('- sets the initialize flag to true', function() {
      expect(adManager.initialized).toEqual(true);
    });

    it('- loads ads initially', function() {
      expect(adManager.loadAds).toHaveBeenCalledTimes(1);
    });

    it('- merges global TARGETING with ad unit dfp site param', function() {
      jest.mock('./helpers/TargetingPairs');
      expect(adManager.targeting).toHaveProperty('dfp_site', 'onion');
      expect(adManager.targeting).toHaveProperty('dfp_pagetype', 'homepage');
    });
  });

  describe('#setPageTargeting', function() {
    beforeEach(function() {
      adManager.targeting = {
        dfp_site: 'onion',
        dfp_pagetype: 'home'
      };
      adManager.setPageTargeting();
    });

    it('- sets targeting for each key-value pair', function() {
      expect(googletag.pubads().setTargeting).toHaveBeenCalledWith('dfp_site', 'onion');
      expect(googletag.pubads().setTargeting).toHaveBeenCalledWith('dfp_pagetype', 'home');
    });

    describe('> Krux user id present', function() {
      beforeEach(function() {
        window.Krux = {
          user: '12345'
        };
        adManager.setPageTargeting();
      });

      afterEach(function() {
        delete window.Krux;
      });

      it('- sets the Krux user id if available', function() {
        expect(googletag.pubads().setTargeting).toHaveBeenCalledWith('kuid', '12345');
      });
    });

    describe('> UTM parameters are present', function() {
      beforeEach(function() {
        jest.spyOn(adManager, 'setUtmTargeting');
        adManager.setPageTargeting();
      });

      it('- sets UTM targeting', function() {
        expect(adManager.setUtmTargeting).toHaveBeenCalled();
      });
    });

  });

  describe('#setUtmTargeting', function() {
    beforeEach(function() {
      jest.spyOn(adManager, 'setUtmTargeting');
    });

    describe('> with UTM params', function() {
      beforeEach(function() {
        Cookie.remove('utmSession')
        jest.spyOn(adManager, 'searchString').mockImplementation(() => '?utm_source=Facebook&utm_medium=cpc&utm_campaign=foobar');
        adManager.setUtmTargeting();
      });

      it('- sets utm source as targeting key-val', function() {
        expect(googletag.pubads().setTargeting).toHaveBeenCalledWith('utm_source', 'Facebook');
      });

      it('- sets utm campaign as targeting key-val', function() {
        expect(googletag.pubads().setTargeting).toHaveBeenCalledWith('utm_campaign', 'foobar');
      });

      it('- sets utm medium as targeting key-val', function() {
        expect(googletag.pubads().setTargeting).toHaveBeenCalledWith('utm_medium', 'cpc');
      });

      it('- cookies the UTM parameters', function() {
        var cookie = JSON.parse(Cookie.get('utmSession'));
        expect(cookie.utmSource).toEqual('Facebook');
        expect(cookie.utmCampaign).toEqual('foobar');
        expect(cookie.utmMedium).toEqual('cpc');
      });
    });

    describe('> without UTM params', function() {
      beforeEach(function() {
        jest.spyOn(adManager, 'searchString').mockImplementation(() => '');
        adManager.setUtmTargeting();
      });

      it('- does not set anything', function() {
        expect(googletag.pubads().setTargeting).not.toHaveBeenCalled();
      });
    });

    describe('> cookied UTM params', function() {
      beforeEach(function() {
        jest.spyOn(adManager, 'searchString').mockImplementation(() => '');
        Cookie.set('utmSession', {
          utmSource: 'Karma',
          utmMedium: 'cpc',
          utmCampaign: 'test'
        });
        adManager.setUtmTargeting();
      });

      it('- sets utm source as targeting key-val', function() {
        expect(googletag.pubads().setTargeting).toHaveBeenCalledWith('utm_source', 'Karma');
      });

      it('- sets utm campaign as targeting key-val', function() {
        expect(googletag.pubads().setTargeting).toHaveBeenCalledWith('utm_campaign', 'test');
      });

      it('- sets utm medium as targeting key-val', function() {
        expect(googletag.pubads().setTargeting).toHaveBeenCalledWith('utm_medium', 'cpc');
      });
    });

    describe('> cookied UTM params, but overriding new params', function() {
      beforeEach(function() {
        jest.spyOn(adManager, 'searchString').mockImplementation(() => '?utm_source=Facebook&utm_campaign=foobar');
        Cookie.set('utmSession', {
          utmSource: 'Karma',
          utmMedium: 'test',
          utmCampaign: 'cpc'
        });
        adManager.setUtmTargeting();
      });

      it('- sets utm source as targeting key-val', function() {
        expect(googletag.pubads().setTargeting).toHaveBeenCalledWith('utm_source', 'Facebook');
      });

      it('- sets utm campaign as targeting key-val', function() {
        expect(googletag.pubads().setTargeting).toHaveBeenCalledWith('utm_campaign', 'foobar');
      });

      it('- would not have called setTargeting with old utmMedium param', function() {
        expect(googletag.pubads().setTargeting).toHaveBeenCalledTimes(2);
        expect(googletag.pubads().setTargeting).not.toHaveBeenCalledWith('utm_medium', 'cpc');
      });
    });
  });
});

