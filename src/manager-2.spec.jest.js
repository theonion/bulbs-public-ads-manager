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

  describe('#initGoogleTag', function() {
    beforeEach(function() {
      adManager.googletag.pubads = jest.fn().mockImplementation(() => ({
        collapseEmptyDivs: jest.fn(),
        enableSingleRequest: jest.fn(),
        disableInitialLoad: jest.fn(),
        addEventListener: jest.fn(),
        refresh: jest.fn(),
        clear: jest.fn(),
        setTargeting: jest.fn(),
        updateCorrelator: jest.fn(),
        enableAsyncRendering: jest.fn()
      }));
      adManager.setPageTargeting = jest.fn();
      adManager.loadAds = jest.fn();
      adManager.googletag.enableServices = jest.fn();
      adManager.initialized = false;
      adManager.initGoogleTag();
    });

    describe('TARGETING global, and a forced ad zone', function () {
      xit('merges pre-existing contextual targeting with forced ad zone', function() {
        window.TARGETING = { dfpcontentid: 'foo-bar-baz' };
        AdZone.forcedAdZone.mockReturnValue('adtest');

        adManager.initGoogleTag();
        expect(adManager.targeting.dfpcontentid).toEqual('foo-bar-baz');
        expect(adManager.targeting.forcedAdZone).toEqual('adtest');
      });
    });

    xit('- enable single request mode when option enabled, otherwise disable it', function() {
      expect(adManager.googletag.pubads().enableSingleRequest).not.toHaveBeenCalled();
      adManager.options.enableSRA = true;
      adManager.initGoogleTag();
      expect(adManager.googletag.pubads().enableSingleRequest).toHaveBeenCalled();
    });

    xit('- disables initial load of ads, to defer to the eager/lazy loading logic', function() {
      expect(adManager.googletag.pubads().disableInitialLoad).toHaveBeenCalled();
    });

    xit('- enables async rendering to avoid page blocking and allow the manual use of `updateCorrelator`', function() {
      expect(adManager.googletag.pubads().enableAsyncRendering).toHaveBeenCalled();
    });

    xit('- always updates the correlator automatically whenever the ad lib is loaded', function() {
      expect(adManager.googletag.pubads().updateCorrelator).toHaveBeenCalled();
    });

    xit('- sets up custom slot render ended callback', function() {
      expect(adManager.googletag.pubads().addEventListener.toHaveBeenCalledWith('slotRenderEnded', adManager.onSlotRenderEnded));
    });

    xit('- sets up custom slot onImpressionViewable callback', function() {
      expect(adManager.googletag.pubads().addEventListener.toHaveBeenCalledWith('impressionViewable', adManager.onImpressionViewable));
    });

    xit('- sets up custom slot onload callback', function() {
      expect(adManager.googletag.pubads().addEventListener.toHaveBeenCalledWith('slotOnload', adManager.onSlotOnload));
    });

    xit('- sets the global targeting on the pub ads service', function() {
      expect(adManager.setPageTargeting).toHaveBeenCalled();
    });

    xit('- sets the initialize flag to true', function() {
      expect(adManager.initialized).toEqual(true);
    });

    xit('- loads ads initially', function() {
      expect(adManager.loadAds.calledOnce).toEqual(true);
    });



    xit('- merges global TARGETING with ad unit dfp site param', function() {
      expect(adManager.targeting).toEqual({
        dfp_site: 'onion',
        dfp_pagetype: 'homepage'
      });
    });
  });

  describe('#setPageTargeting', function() {
    beforeEach(function() {
      adManager.targeting = {
        dfp_site: 'onion',
        dfp_pagetype: 'home'
      };
      TestHelper.stub(adManager.googletag, 'pubads').returns({
        setTargeting: sinon.spy()
      });
      adManager.setPageTargeting();
    });

    xit('- sets targeting for each key-value pair', function() {
      expect(googletag.pubads().setTargeting.toHaveBeenCalledWith('dfp_site', 'onion'));
      expect(googletag.pubads().setTargeting.toHaveBeenCalledWith('dfp_pagetype', 'home'));
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

      xit('- sets the Krux user id if available', function() {
        expect(googletag.pubads().setTargeting.toHaveBeenCalledWith('kuid', '12345'));
      });
    });

    describe('> UTM parameters are present', function() {
      beforeEach(function() {
        TestHelper.stub(adManager, 'setUtmTargeting');
        adManager.setPageTargeting();
      });

      xit('- sets UTM targeting', function() {
        expect(adManager.setUtmTargeting).toHaveBeenCalled();
      });
    });

  });

  describe('#setUtmTargeting', function() {
    beforeEach(function() {
      TestHelper.stub(adManager.googletag, 'pubads').returns({
        setTargeting: sinon.spy()
      });
    });

    describe('> with UTM params', function() {
      beforeEach(function() {
        Cookie.remove('utmSession')
        TestHelper.stub(adManager, 'searchString').returns('?utm_source=Facebook&utm_medium=cpc&utm_campaign=foobar');
        adManager.setUtmTargeting();
      });

      xit('- sets utm source as targeting key-val', function() {
        expect(googletag.pubads().setTargeting.toHaveBeenCalledWith('utm_source', 'Facebook'));
      });

      xit('- sets utm campaign as targeting key-val', function() {
        expect(googletag.pubads().setTargeting.toHaveBeenCalledWith('utm_campaign', 'foobar'));
      });

      xit('- sets utm medium as targeting key-val', function() {
        expect(googletag.pubads().setTargeting.toHaveBeenCalledWith('utm_medium', 'cpc'));
      });

      xit('- cookies the UTM parameters', function() {
        var cookie = JSON.parse(Cookie.get('utmSession'));
        expect(cookie.utmSource).toEqual('Facebook');
        expect(cookie.utmCampaign).toEqual('foobar');
        expect(cookie.utmMedium).toEqual('cpc');
      });
    });

    describe('> without UTM params', function() {
      beforeEach(function() {
        TestHelper.stub(adManager, 'searchString').returns('');
        adManager.setUtmTargeting();
      });

      xit('- does not set anything', function() {
        expect(googletag.pubads().setTargeting).not.toHaveBeenCalled();
      });
    });

    describe('> cookied UTM params', function() {
      beforeEach(function() {
        TestHelper.stub(adManager, 'searchString').returns('');
        Cookie.set('utmSession', {
          utmSource: 'Karma',
          utmMedium: 'cpc',
          utmCampaign: 'test'
        });
        adManager.setUtmTargeting();
      });

      xit('- sets utm source as targeting key-val', function() {
        expect(googletag.pubads().setTargeting.toHaveBeenCalledWith('utm_source', 'Karma'));
      });

      xit('- sets utm campaign as targeting key-val', function() {
        expect(googletag.pubads().setTargeting.toHaveBeenCalledWith('utm_campaign', 'test'));
      });

      xit('- sets utm medium as targeting key-val', function() {
        expect(googletag.pubads().setTargeting.toHaveBeenCalledWith('utm_medium', 'cpc'));
      });
    });

    describe('> cookied UTM params, but overriding new params', function() {
      beforeEach(function() {
        TestHelper.stub(adManager, 'searchString').returns('?utm_source=Facebook&utm_campaign=foobar');
        Cookie.set('utmSession', {
          utmSource: 'Karma',
          utmMedium: 'test',
          utmCampaign: 'cpc'
        });
        adManager.setUtmTargeting();
      });

      xit('- sets utm source as targeting key-val', function() {
        expect(googletag.pubads().setTargeting.toHaveBeenCalledWith('utm_source', 'Facebook'));
      });

      xit('- sets utm campaign as targeting key-val', function() {
        expect(googletag.pubads().setTargeting.toHaveBeenCalledWith('utm_campaign', 'foobar'));
      });

      xit('- would not have called setTargeting with old utmMedium param', function() {
        expect(googletag.pubads().setTargeting.calledTwice).toEqual(true);
        expect(googletag.pubads().setTargeting.toHaveBeenCalledWith('utm_medium', 'cpc'));
      });
    });
  });
});

