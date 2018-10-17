var Cookie = require('js-cookie');

var TargetingPairs = require('./helpers/TargetingPairs');
var AdZone = require('./helpers/AdZone');
var MockGoogleTag = require('../resources/test/mock-google-tag');
var utils = require('./utils');
var AdManagerWrapper = require('./manager');
var adUnits = require('./ad-units');

jest.mock('./helpers/AdZone');

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
      xit('- calls initGoogleTag', function() {
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

    // TODO: valid failure?
    it('- does not reload ads if the viewport has not changed', function() {
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
      it('merges pre-existing contextual targeting with forced ad zone', function() {
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

  describe('#reloadAds', function() {
    beforeEach(function() {
      TestHelper.stub(adManager.googletag, 'pubads').returns({
        updateCorrelator: sinon.spy()
      });
      TestHelper.stub(adManager, 'unloadAds');
      TestHelper.stub(adManager, 'loadAds');
      adManager.reloadAds('domElement');
    });

    xit('- unloads and reloads ads', function() {
      expect(adManager.unloadAds.toHaveBeenCalledWith('domElement'));
      expect(adManager.loadAds.toHaveBeenCalledWith('domElement'));
    });

    xit('- updates the correlator so it is treated like a new pageview request', function() {
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
      TestHelper.stub(adManager.adUnits.units.header, 'onSlotRenderEnded');
      eventSpy = sinon.spy();
      adElement.addEventListener('dfpSlotRenderEnded', eventSpy);
    });

    afterEach(function() {
      $(adElement).remove();
    });

    xit('- sets rendered to true', function() {

      adManager.onSlotRenderEnded(event);

      expect(adManager.rendered).toEqual(true);
    });

    xit('- removes the height property', function() {

      adManager.onSlotRenderEnded(event);

      expect(adElement.style.height).not.toEqual('250px');
    });

    xit('- removes the width property', function() {

      adManager.onSlotRenderEnded(event);

      expect(adElement.style.width).not.toEqual('300px');
    });

    xit('- calls custom slot render ended callback if there is one', function() {

      adManager.onSlotRenderEnded(event);

      expect(adManager.adUnits.units.header.onSlotRenderEnded.toHaveBeenCalledWith(event, adElement));
    });

    xit('- sets loaded state to loaded', function() {

      adManager.onSlotRenderEnded(event);

      expect($(adElement).data('ad-load-state')).toEqual('loaded');
    });

    xit('- emits a dfpSlotRenderEnded event', function() {

      adManager.onSlotRenderEnded(event);

      expect(eventSpy).toHaveBeenCalled();
    });

    xit('- does not dispatch slot render end, does not call callback when ad comes back empty', function() {
      event.isEmpty = true;

      adManager.onSlotRenderEnded(event);

      expect($(adElement).data('ad-load-state')).toEqual('empty');
      expect(adManager.adUnits.units.header.onSlotRenderEnded).not.toHaveBeenCalled();
      expect(eventSpy).not.toHaveBeenCalled();
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
      TestHelper.stub(adManager.adUnits.units.header, 'onSlotRenderEnded');
      eventSpy = sinon.spy();
      adElement.addEventListener('dfpImpressionViewable', eventSpy);
      adManager.onSlotRenderEnded(event);
    });

    afterEach(function() {
      $(adElement).remove();
    });

    xit('- emits a dfpImpressionViewable event', function() {
      expect(eventSpy).to.have.been.called;
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
      TestHelper.stub(adManager.adUnits.units.header, 'onSlotRenderEnded');
      eventSpy = sinon.spy();
      adElement.addEventListener('dfpSlotOnload', eventSpy);
      adManager.onSlotRenderEnded(event);
    });

    afterEach(function() {
      $(adElement).remove();
    });

    xit('- emits a dfpSlotOnload event', function() {
      expect(eventSpy).to.have.been.called;
    });
  });

  describe('#generateId', function() {
    beforeEach(function() {
      adManager.adId = 0;
    });

    xit('- generates a unique ad id by incrementing adId', function() {
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

      xit('- returns an empty []', function() {
        TestHelper.stub(adManager, 'getClientWidth').returns(1000);
        expect(adManager.adUnitSizes(sizeMap)).toEqual([]);
      });
    });

    describe('> a single size, configured for mobile', function() {
      var sizeMap = [
        [[0, 0], [728, 90]]
      ];

      xit('- returns the sizes', function() {
        TestHelper.stub(adManager, 'getClientWidth').returns(375); //iPhone
        expect(adManager.adUnitSizes(sizeMap)).toEqual([728, 90]);
      });
    });

    describe('> desktop sizes only', function() {
      var sizeMap = [
        [[900, 0], [728, 90]],
        [[0, 0], []]
      ];

      xit('- returns valid sizes on desktop', function() {
        TestHelper.stub(adManager, 'getClientWidth').returns(1000);
        expect(adManager.adUnitSizes(sizeMap)).toEqual([728, 90]);
      });

      xit('- returns no valid sizes on mobile', function() {
        TestHelper.stub(adManager, 'getClientWidth').returns(320);
        expect(adManager.adUnitSizes(sizeMap)).toEqual([]);
      });
    });

    describe('> mobile sizes only', function() {
      var sizeMap = [
        [[900, 0], []],
        [[0, 0], [300, 250]]
      ];

      xit('- desktop returns []', function() {
        TestHelper.stub(adManager, 'getClientWidth').returns(1000);
        expect(adManager.adUnitSizes(sizeMap)).toEqual([]);
      });

      xit('- mobile returns the sizes', function() {
        TestHelper.stub(adManager, 'getClientWidth').returns(320);
        expect(adManager.adUnitSizes(sizeMap)).toEqual([300, 250]);
      });
    });

    describe('> desktop and mobile sizes', function() {
      var sizeMap = [
        [[900, 0], [['fluid'], [300, 250]]],
        [[0, 0], [[320, 50], 'fluid']]
      ];

      xit('- desktop returns the sizes', function() {
        TestHelper.stub(adManager, 'getClientWidth').returns(1000);
        expect(adManager.adUnitSizes(sizeMap)).toEqual([['fluid'], [300, 250]]);
      });

      xit('- mobile returns the sizes', function() {
        TestHelper.stub(adManager, 'getClientWidth').returns(320);
        expect(adManager.adUnitSizes(sizeMap)).toEqual([[320, 50], 'fluid']);
      });
    });
  });

  describe('#buildSizeMap', function () {
    var sizeMappingStub;
    beforeEach(function() {
      sizeMappingStub = {
        addSize: sinon.spy(),
        build: sinon.spy(),
      }
      TestHelper.stub(window.googletag, 'sizeMapping').returns(sizeMappingStub)
    });

    xit('- builds valid gpt sizemap', function() {
      adManager.buildSizeMap([]);
      expect(window.googletag.sizeMapping().build.calledOnce).toEqual(true);
    });

    xit("allows ['fluid'] size", function() {
      var sizeMap = [
        [[0, 0], ['fluid']],
      ];
      adManager.buildSizeMap(sizeMap);
      expect(window.googletag.sizeMapping().addSize.toHaveBeenCalledWith([0, 0], ['fluid']));
    });

    xit("converts 'fluid' string into ['fluid'] array", function() {
      var sizeMap = [
        [[0, 0], 'fluid'],
      ];
      adManager.buildSizeMap(sizeMap);
      expect(window.googletag.sizeMapping().addSize.toHaveBeenCalledWith([0, 0], ['fluid']));
    });

    xit("converts [['fluid']] doubly-nested array into ['fluid'] array", function() {
      // in practice, GPT doesn't allow [['fluid']], although the documentation is ambiguous on whether
      // this is supposed to work: https://developers.google.com/doubleclick-gpt/reference#googletag.GeneralSize
      var sizeMap = [
        [[0, 0], [['fluid']]],
      ];
      adManager.buildSizeMap(sizeMap);
      expect(window.googletag.sizeMapping().addSize.toHaveBeenCalledWith([0, 0], ['fluid']));
    });

    xit("allows fluid to be mixed with other sizes", function() {
      var sizeMap = [
        [[0, 0], [['fluid'], [300, 250]]],
        [[900, 0], ['fluid', [728, 90]]],
      ];
      adManager.buildSizeMap(sizeMap);
      expect(window.googletag.sizeMapping().addSize.toHaveBeenCalledWith([0, 0], ['fluid', [300, 250]]));
      expect(window.googletag.sizeMapping().addSize.toHaveBeenCalledWith([900, 0], ['fluid', [728, 90]]));
    });
  });

  describe('#adSlotSizes', function() {
    beforeEach(function() {
    });

    xit('- filters active gpt sizes  into an array', function() {
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

    xit('- returns true if the container has the dfp class', function() {
      container.className = 'dfp';
      expect(adManager.isAd(container)).toEqual(true);
    });

    xit('- returns false if the container does not have the dfp class', function() {
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

      xit('- returns all ads with `dfp` class', function() {
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

      xit('- should return ads matching query selector', function() {
        expect(ads.length).toEqual(1);
        expect(ads[0]).toEqual(adSlot1);
      });
    });

    describe('> passed in a non-ad HTMLElement', function() {
      beforeEach(function() {
        TestHelper.stub(adManager, 'isAd').returns(false);
        ads = adManager.findAds(container3);
      });

      xit('- should returns ads within it', function() {
        expect(ads.length).toEqual(1);
        expect(ads[0]).toEqual(adSlot3);
      });
    });

    describe('> passed in an ad HTMLElement', function() {
      beforeEach(function() {
        TestHelper.stub(adManager, 'isAd').returns(true);
        ads = adManager.findAds(adSlot1);
      });

      xit('- should return the ad', function() {
        expect(ads.length).toEqual(1);
        expect(ads[0]).toEqual(adSlot1);
      });
    });

    describe('> passed in array of containers', function() {
      beforeEach(function() {
        TestHelper.stub(adManager, 'isAd').returns(false);
        containers = document.getElementsByClassName('expected');
        ads = adManager.findAds(containers);
      });

      xit('- should return ads within all the containers', function() {
        expect(ads.length).toEqual(2);
        expect(ads[0][0]).toEqual(adSlot1);
        expect(ads[1][0]).toEqual(adSlot3);
      });
    });

    describe('> passed in an element context containing ads', function() {
      beforeEach(function() {
        TestHelper.stub(adManager, 'isAd').returns(false);
        containers = document.getElementsByClassName('expected');
        ads = adManager.findAds(containers, false, true);
      });

      xit('- should return ads within all the containers', function() {
        expect(ads.length).toEqual(2);
        expect(ads[0][0]).toEqual(adSlot1);
        expect(ads[1][0]).toEqual(adSlot3);
      });
    });
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

  describe('#pause', function() {
    beforeEach(function() {
      adManager.paused = false;
      adManager.pause();
    });

    xit('- pauses any future ad loading', function() {
      expect(adManager.paused).toEqual(true);
    });
  });

  describe('#unpause', function() {
    beforeEach(function() {
      adManager.paused = true;
      adManager.unpause();
    });

    xit('- unpauses any future ad loading', function() {
      expect(adManager.paused).toEqual(false);
    });
  });

  describe('#loadAds', function() {
  var baseContainer, container1, container2, container3, adSlot1, adSlot2, adSlot3, ads;

    beforeEach(function() {
      adManager.paused = false;
      adManager.initialized = true;
      adManager.options.amazonEnabled = false;
      adManager.options.pbjsEnabled = false;

      TestHelper.stub(adManager.googletag, 'pubads').returns({
        collapseEmptyDivs: sinon.spy(),
        enableSingleRequest: sinon.spy(),
        disableInitialLoad: sinon.spy(),
        addEventListener: sinon.spy(),
        updateCorrelator: sinon.spy(),
        refresh: sinon.spy(),
        clear: sinon.spy(),
        setTargeting: sinon.spy()
      });
      TestHelper.stub(adManager.googletag, 'display');
      TestHelper.stub(adManager.googletag, 'enableServices');
      TestHelper.stub(adManager, 'fetchAmazonBids');

      xit('- no call to fetchAmazonBids if parameter amazonEnabled is false', function() {
        expect(adManager.fetchAmazonBids.calledOnce).toEqual(true);
        adManager.options.amazonEnabled = false;
        adManager.initGoogleTag();
        expect(adManager.fetchAmazonBids.calledTwice).toEqual(false);
      });

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

      adManager.configureAd = function(element) {
        return {
          element: element,
          eagerLoad: true
        };
      };

      TestHelper.spyOn(adManager, 'configureAd');
      TestHelper.stub(adManager, 'refreshSlot');
    });

    afterEach(function() {
      $(baseContainer).remove();
    });

    describe('> with wrapper tag', function() {
      beforeEach(function() {

        window.headertag = {
          display: sinon.stub(),
          apiReady: true
        };
        adManager.loadAds();
      });

      xit('- calls wrapper tag instead of googletag', function() {
        expect(window.headertag.display.callCount).toEqual(3);
        expect(window.headertag.display.args[0][0]).toEqual('dfp-ad-1');
        expect(window.headertag.display.args[1][0]).toEqual('dfp-ad-2');
        expect(window.headertag.display.args[2][0]).toEqual('dfp-ad-3');
      });

      xit('- triggers refresh of each slot through wrapper tag', function() {
        expect(adManager.refreshSlot.callCount).toEqual(3);
        expect(adManager.refreshSlot.toHaveBeenCalledWith(adSlot1));
        expect(adManager.refreshSlot.toHaveBeenCalledWith(adSlot2));
        expect(adManager.refreshSlot.toHaveBeenCalledWith(adSlot3));
      });
    });

    describe('> without wrapper tag', function() {
      beforeEach(function() {
        delete window.headertag;
        adManager.loadAds();
      });

      xit('- displays each ad', function() {
        expect(adManager.googletag.display.callCount).toEqual(3);
        expect(adManager.googletag.display.toHaveBeenCalledWith('dfp-ad-1'));
        expect(adManager.googletag.display.toHaveBeenCalledWith('dfp-ad-2'));
        expect(adManager.googletag.display.toHaveBeenCalledWith('dfp-ad-3'));
      });
    });

    describe('> paused', function() {
      beforeEach(function() {
        adManager.paused = true;
        adManager.loadAds();
      });

      xit('- does not refresh any slots', function() {
        expect(adManager.googletag.pubads().refresh).not.toHaveBeenCalled();
      });
    });

    describe('> not initialized', function() {
      beforeEach(function() {
        adManager.initialized = false;
        adManager.loadAds();
      });

      xit('- does not refresh any slots', function() {
        expect(adManager.googletag.pubads().refresh).not.toHaveBeenCalled();
      });
    });

    describe('> pub ads not ready', function() {
      beforeEach(function() {
        $(adSlot1).attr('data-ad-load-state', 'loaded');
        $(adSlot2).attr('data-ad-load-state', 'loaded');
        $(adSlot3).attr('data-ad-load-state', 'loaded');
        adManager.loadAds();
      });

      xit('- enables services', function() {
        expect(adManager.googletag.enableServices).toHaveBeenCalled();
      });
    });

    describe('> loading of all ads already in progress', function() {
      beforeEach(function() {
        $(adSlot1).attr('data-ad-load-state', 'loading');
        $(adSlot2).attr('data-ad-load-state', 'loading');
        $(adSlot3).attr('data-ad-load-state', 'loading');
        adManager.loadAds();
      });

      xit('- does not try to configureAd', function() {
        expect(adManager.configureAd).not.toHaveBeenCalled();
      });

      xit('- does not try to trigger display', function() {
        expect(adManager.googletag.display).not.toHaveBeenCalled();
      });

      xit('- does not try to refresh pubads across the board', function() {
        expect(adManager.googletag.pubads().refresh).not.toHaveBeenCalled();
      });
    });

    describe('> all ads loaded', function() {
      beforeEach(function() {
        $(adSlot1).attr('data-ad-load-state', 'loaded');
        $(adSlot2).attr('data-ad-load-state', 'loaded');
        $(adSlot3).attr('data-ad-load-state', 'loaded');
        adManager.loadAds();
      });

      xit('- does not try to configureAd', function() {
        expect(adManager.configureAd).not.toHaveBeenCalled();
      });

      xit('- does not try to trigger display', function() {
        expect(adManager.googletag.display).not.toHaveBeenCalled();
      });

      xit('- does not try to refresh pubads across the board', function() {
        expect(adManager.googletag.pubads().refresh).not.toHaveBeenCalled();
      });
    });

    describe('> update correlator true', function() {
      beforeEach(function() {
        adManager.loadAds(undefined, true);
      });

      xit('- updates the correlator', function() {
        expect(adManager.googletag.pubads().updateCorrelator).toHaveBeenCalled();
      });
    });

    describe('> no ads loaded', function() {
      beforeEach(function() {
        adManager.refreshSlot.reset();
        adManager.loadAds();
      });

      xit('- configures each ad', function() {
        expect(adManager.configureAd.callCount).toEqual(3);
        expect(adManager.configureAd.toHaveBeenCalledWith(adSlot1));
        expect(adManager.configureAd.toHaveBeenCalledWith(adSlot2));
        expect(adManager.configureAd.toHaveBeenCalledWith(adSlot3));
      });

      xit('- displays each ad', function() {
        expect(adManager.googletag.display.callCount).toEqual(3);
        expect(adManager.googletag.display.toHaveBeenCalledWith('dfp-ad-1'));
        expect(adManager.googletag.display.toHaveBeenCalledWith('dfp-ad-2'));
        expect(adManager.googletag.display.toHaveBeenCalledWith('dfp-ad-3'));
      });

      xit('- triggers refresh of each slot', function() {
        expect(adManager.refreshSlot.toHaveBeenCalledWith(adSlot1));
        expect(adManager.refreshSlot.toHaveBeenCalledWith(adSlot2));
        expect(adManager.refreshSlot.toHaveBeenCalledWith(adSlot3));
      });
    });

    describe('> partial ads loaded', function() {
      beforeEach(function() {
        $(adSlot1).attr('data-ad-load-state', 'loaded');
        adManager.loadAds();
      });

      xit('- configures ads not loaded', function() {
        expect(adManager.configureAd.callCount).toEqual(2);
        expect(adManager.configureAd.toHaveBeenCalledWith(adSlot2));
        expect(adManager.configureAd.toHaveBeenCalledWith(adSlot3));
      });

      xit('- displays unloaded ads', function() {
        expect(adManager.googletag.display.callCount).toEqual(2);
        expect(adManager.googletag.display.toHaveBeenCalledWith('dfp-ad-2'));
        expect(adManager.googletag.display.toHaveBeenCalledWith('dfp-ad-3'));
      });

      xit('- triggers refresh of non-loaded slots', function() {
        expect(adManager.refreshSlot.toHaveBeenCalledWith(adSlot1));
        expect(adManager.refreshSlot.toHaveBeenCalledWith(adSlot2));
        expect(adManager.refreshSlot.toHaveBeenCalledWith(adSlot3));
      });
    });
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
    var baseContainer, container1, adSlot1, stubSlot, variableReferences;
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
    variableReferences = {
      baseContainer: baseContainer,
      container1: container1,
      adSlot1: adSlot1,
      stubSlot: stubSlot
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

      expect(adManager.__iasPET.queue).toEqual(a)('array').to.have.lengthOf(1);
    });
  });

  describe('#refreshSlot', function() {
    var adSlot, stubSlot, baseContainer;

    beforeEach(function() {
      var setupRefs = adSlotSetup();
      adSlot = setupRefs.adSlot1;
      stubSlot = setupRefs.stubSlot;
      baseContainer = setupRefs.baseContainer;
      TestHelper.stub(adManager, 'refreshSlots');
      adManager.options.amazonEnabled = false;
    });

    afterEach(function() {
      $(baseContainer).remove();
    });

    xit('- loads the DFP slot matching up with the DOM element id', function() {

      adManager.refreshSlot(adSlot);
      expect(adManager.refreshSlots.toHaveBeenCalledWith([stubSlot]));
    });

  });

  describe('#refreshSlots', function() {
    describe('> prebidEnabled', function(){
      var adSlot, baseContainer, stubSlot;
      beforeEach(function(){
        var setupRefs = adSlotSetup();
        adSlot = setupRefs.adSlot1;
        stubSlot = setupRefs.stubSlot;
        baseContainer = setupRefs.baseContainer;
        adManager.options.amazonEnabled = false;

        TestHelper.stub(adManager, 'prebidRefresh');
        TestHelper.stub(adManager, 'fetchAmazonBids');
      });

      afterEach(function() {
        $(baseContainer).remove();
      });

      xit('- calls refreshPrebid when prebid is enabled', function() {
        adManager.options.prebidEnabled = true;
        adManager.refreshSlots([stubSlot]);
        expect(adManager.prebidRefresh).toHaveBeenCalled();
      });

      xit('- does not call refreshPrebid when prebid is disabled', function() {
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
        TestHelper.stub(adManager, 'fetchAmazonBids');
        TestHelper.stub(adManager, 'setIndexTargetingForSlots');

        adManager.refreshSlots([stubSlot]);

        expect(adManager.fetchAmazonBids).toHaveBeenCalled();
      });

      xit('- does not calls fetchIasTargeting when enabled', function() {
        adManager = AdManagerWrapper.init({ amazonEnabled: false });
        TestHelper.stub(adManager, 'fetchAmazonBids');
        TestHelper.stub(adManager, 'setIndexTargetingForSlots');

        adManager.refreshSlots([stubSlot]);

        expect(adManager.fetchAmazonBids).not.toHaveBeenCalled();
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
        TestHelper.stub(adManager, 'fetchAmazonBids');
        TestHelper.stub(adManager, 'fetchIasTargeting');
        TestHelper.stub(adManager, 'setIndexTargetingForSlots');

        adManager.refreshSlots([stubSlot]);

        expect(adManager.fetchIasTargeting).toHaveBeenCalled();
      });

      xit('- does not calls fetchIasTargeting when enabled', function() {
        adManager = AdManagerWrapper.init({ iasEnabled: false });
        TestHelper.stub(adManager, 'fetchAmazonBids');
        TestHelper.stub(adManager, 'fetchIasTargeting');
        TestHelper.stub(adManager, 'setIndexTargetingForSlots');

        adManager.refreshSlots([stubSlot]);

        expect(adManager.fetchIasTargeting).not.toHaveBeenCalled();
      });
    });
  });

  describe('#prebidRefresh', function() {
    var baseContainer, container1, adSlot1, stubSlot, pbjs;

    beforeEach(function() {
        adManager.pbjs = pbjs = window.pbjs = {
          que: [],
          requestBids: sinon.spy(),
          addAdUnits: sinon.spy(),
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

    xit('- calls pbjs.requestBids when adunit-level prebid config is present', function() {
      adManager.prebidRefresh([stubSlot]);
      pbjs.que[0](); // let the pbjs queue run one step
      expect(pbjs.requestBids).toHaveBeenCalled();
    });

    xit('- calls googletag.pubads().refresh directly when no units are configured for prebid', function() {
      TestHelper.stub(adManager.googletag, 'pubads').returns({
        refresh: sinon.spy(),
        getSlots: function() {return []}
      });
      stubSlot.prebid = false;
      adManager.refreshSlots([stubSlot]);
      googletag.cmd[0](); // let the googletag queue run one step
      expect(googletag.pubads).toHaveBeenCalled();
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

      xit('- refreshes the slot right away', function() {
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

      xit('- refreshes the slot by way of the `cmd` async queue', function () {
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
        clear: sinon.spy()
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

      xit('- does not clear anything', function() {
        expect(adManager.googletag.pubads().clear).not.toHaveBeenCalled();
      });

      xit('- leaves slots intact', function() {
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

      xit('- removes all elements from the slots', function() {
        expect(adManager.slots).toEqual({});
      });

      xit('- clears all slots through the pubads service', function() {
        expect(adManager.googletag.pubads().clear.toHaveBeenCalledWith([adSlot1, adSlot2]));
      });

      xit('- resets the load state attribute', function() {
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

      xit('- returns the bulbs convention', function() {
        expect(adManager.getAdUnitCode()).toEqual('/4246/fmg.onion');
      });

      xit('- tacks on the dfpSiteSection to the ad unit code if available', function() {
        window.dfpSiteSection = 'front';
        expect(adManager.getAdUnitCode()).toEqual('/4246/fmg.onion/front');
      });
    });

    describe('> Kinja', function() {
      beforeEach(function() {
        window.kinja = {};
        TestHelper.stub(AdZone, 'forcedAdZone').returns(false);
        TestHelper.stub(TargetingPairs, 'getTargetingPairs').returns({
          slotOptions: { page: 'frontpage' }
        })
      });

      describe('> forced ad zone is set to collapse', function() {
        xit('- uses collapse sub-level ad unit', function() {
          AdZone.forcedAdZone.returns('collapse');
          expect(adManager.getAdUnitCode()).toEqual('/4246/fmg.onion/collapse');
        });
      });

      describe('> front page, no forced ad zone', function() {
        xit('- uses front', function() {
          expect(adManager.getAdUnitCode()).toEqual('/4246/fmg.onion/front');
        });
      });

      describe('> most pages', function() {
        xit('- uses the page type on meta', function() {
          TargetingPairs.getTargetingPairs.returns({
            slotOptions: { page: 'permalink' }
          });
          expect(adManager.getAdUnitCode()).toEqual('/4246/fmg.onion/permalink');
        });
      });
    });
  });
});

