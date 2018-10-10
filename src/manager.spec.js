var TargetingPairs = require('./helpers/TargetingPairs');
var AdZone = require('./helpers/AdZone');

describe('AdManager', function() {
  var AdManagerWrapper, adManager, adUnits;
  var MockGoogleTag = require('mock_google_tag');
  var utils = require('./utils');

  beforeEach(function() {
    AdManagerWrapper = require('./manager');
    adUnits = require('./ad-units');
    window.googletag = new MockGoogleTag();

    window.Bulbs = { settings: { AMAZON_A9_ID: '1234' } };
    window.TARGETING = {
      dfp_site: 'onion',
      dfp_pagetype: 'homepage'
    };
    TestHelper.spyOn(Cookies, 'set');
    TestHelper.spyOn(Cookies, 'get');

    adManager = AdManagerWrapper.init({
      dfpSiteCode: 'fmg.onion',
      adUnits: adUnits
    });
    adManager.googletag.cmd = [];
    adManager.countsByAdSlot = {};
  });

  afterEach(function() {
    Cookies.remove('utmSession');
  });

  describe('new AdManager', function() {
    it('- has no slots yet', function() {
      expect(adManager.slots).to.eql({});
    });

    it('- has a default ad id', function() {
      expect(adManager.adId).to.equal(0);
    });

    it('- is not initialized', function() {
      expect(adManager.initialized).to.be.false;
    });

    context('> base defaults', function() {
      it('- IAS supported by default', function() {
        expect(adManager.options.iasEnabled).to.be.true;
      });
      it('- reloads on resize', function() {
        expect(adManager.options.doReloadOnResize).to.be.true;
      });
    });

    context('> IAS functions correctly', function () {
      var adManagerTestOptions = {
        iasPubId: 123456,
        dfpSiteCode: 'fmg.onion',
        adUnits: adUnits
      }
      it('- constructs the adManager correctly', function () {
        adManager = AdManagerWrapper.init(adManagerTestOptions);
        expect(adManager.options.iasEnabled).to.be.true;
        expect(adManager.options.iasPubId).to.equal(adManagerTestOptions.iasPubId);
        expect(adManager.__iasPET).to.deep.equal(window.__iasPET);
      });
      it('- PET tag initialization', function () {
        adManager = AdManagerWrapper.init(adManagerTestOptions);
        expect(window.__iasPET).to.be.a('object');
        expect(window.__iasPET.queue).to.be.a('array');
        expect(window.__iasPET.pubId).to.equal(adManagerTestOptions.iasPubId);
      });
    });

    context('> override options', function() {
      it('- allows override of defaults', function() {
        adManager = AdManagerWrapper.init({
          doReloadOnResize: false,
          dfpSiteCode: 'fmg.onion',
          iasEnabled: false,
          adUnits: adUnits
         });
        expect(adManager.options.doReloadOnResize).to.be.false;
        expect(adManager.options.iasEnabled).to.be.false;
      });
    });

    context('> google tag initialization', function() {
      beforeEach(function() {
        adManager.googletag.cmd = [];
        adManager = AdManagerWrapper.init({
          dfpSiteCode: 'fmg.onion',
          adUnits: adUnits
        });
        TestHelper.stub(adManager, 'initGoogleTag');
        // Call the anonymous function pushed onto the async cmd array
        adManager.googletag.cmd[0]();
      });

      it('- calls initGoogleTag', function() {
        expect(adManager.initGoogleTag.called).to.be.true;
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
        setConfig: sinon.spy(),
      };
    });

    it('- sets prebid sizeConfig if prebid is enabled and sizeConfig exists', function() {
      adManager.options.prebidEnabled = true;
      adManager.adUnits.pbjsSizeConfig = {};
      adManager.prebidInit();
      expect(adManager.pbjs.setConfig.calledOnce).to.be.true;
    });

    it('- does not set sizeConfig if prebid is disabled', function() {
      adManager.prebidInit();
      expect(adManager.pbjs.setConfig.calledOnce).to.be.false;
    });

    it('- does not set sizeConfig if sizeConfig does not exist', function() {
      adManager.options.prebidEnabled = true;
      adManager.adUnits.pbjsSizeConfig = undefined;
      adManager.prebidInit();
      expect(adManager.pbjs.setConfig.calledOnce).to.be.false;
    });
  });

  describe('#handleWindowResize', function() {
    beforeEach(function() {
      adManager.oldViewportWidth = window.document.body.clientWidth - 200;
      TestHelper.stub(adManager, 'reloadAds');
    });

    it('- calls reloadAds if viewport changed', function() {
      adManager.handleWindowResize();
      expect(adManager.reloadAds.called).to.be.true;
    });

    it('- does not reload ads if the viewport has not changed', function() {
      adManager.oldViewportWidth = window.document.body.clientWidth;
      adManager.handleWindowResize();
      expect(adManager.reloadAds.called).to.be.false;
    });

    it('- does not reload ads if the setting is disabled', function() {
      adManager.options.doReloadOnResize = false;
      adManager.handleWindowResize();
      expect(adManager.reloadAds.called).to.be.false;
    });
  });

  describe('#initGoogleTag', function() {
    beforeEach(function() {
      TestHelper.stub(adManager.googletag, 'pubads').returns({
        collapseEmptyDivs: sinon.spy(),
        enableSingleRequest: sinon.spy(),
        disableInitialLoad: sinon.spy(),
        addEventListener: sinon.spy(),
        refresh: sinon.spy(),
        clear: sinon.spy(),
        setTargeting: sinon.spy(),
        updateCorrelator: sinon.spy(),
        enableAsyncRendering: sinon.spy()
      });
      TestHelper.stub(adManager, 'setPageTargeting');
      TestHelper.stub(adManager, 'loadAds');
      TestHelper.stub(adManager.googletag, 'enableServices');
      adManager.initialized = false;
      adManager.initGoogleTag();
    });

    context('TARGETING global, and a forced ad zone', function () {
      beforeEach(function() {
        window.TARGETING = { 'dfpcontentid': 'foo-bar-baz' };
        TestHelper.stub(AdZone, 'forcedAdZone').returns('adtest');
        adManager.initGoogleTag();
      });

      it('merges pre-existing contextual targeting with forced ad zone', function() {
        expect(adManager.targeting.dfpcontentid).to.equal('foo-bar-baz');
        expect(adManager.targeting.forcedAdZone).to.equal('adtest');
      });
    });

    it('- enable single request mode when option enabled, otherwise disable it', function() {
      expect(adManager.googletag.pubads().enableSingleRequest.called).to.be.false;
      adManager.options.enableSRA = true;
      adManager.initGoogleTag();
      expect(adManager.googletag.pubads().enableSingleRequest.called).to.be.true;
    });

    it('- disables initial load of ads, to defer to the eager/lazy loading logic', function() {
      expect(adManager.googletag.pubads().disableInitialLoad.called).to.be.true;
    });

    it('- enables async rendering to avoid page blocking and allow the manual use of `updateCorrelator`', function() {
      expect(adManager.googletag.pubads().enableAsyncRendering.called).to.be.true;
    });

    it('- always updates the correlator automatically whenever the ad lib is loaded', function() {
      expect(adManager.googletag.pubads().updateCorrelator.called).to.be.true;
    });

    it('- sets up custom slot render ended callback', function() {
      expect(adManager.googletag.pubads().addEventListener.calledWith('slotRenderEnded', adManager.onSlotRenderEnded)).to.be.true;
    });

    it('- sets up custom slot onImpressionViewable callback', function() {
      expect(adManager.googletag.pubads().addEventListener.calledWith('impressionViewable', adManager.onImpressionViewable)).to.be.true;
    });

    it('- sets up custom slot onload callback', function() {
      expect(adManager.googletag.pubads().addEventListener.calledWith('slotOnload', adManager.onSlotOnload)).to.be.true;
    });

    it('- sets the global targeting on the pub ads service', function() {
      expect(adManager.setPageTargeting.called).to.be.true;
    });

    it('- sets the initialize flag to true', function() {
      expect(adManager.initialized).to.be.true;
    });

    it('- loads ads initially', function() {
      expect(adManager.loadAds.calledOnce).to.be.true;
    });



    it('- merges global TARGETING with ad unit dfp site param', function() {
      expect(adManager.targeting).to.eql({
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

    it('- sets targeting for each key-value pair', function() {
      expect(googletag.pubads().setTargeting.calledWith('dfp_site', 'onion')).to.be.true;
      expect(googletag.pubads().setTargeting.calledWith('dfp_pagetype', 'home')).to.be.true;
    });

    context('> Krux user id present', function() {
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
        expect(googletag.pubads().setTargeting.calledWith('kuid', '12345')).to.be.true;
      });
    });

    context('> UTM parameters are present', function() {
      beforeEach(function() {
        TestHelper.stub(adManager, 'setUtmTargeting');
        adManager.setPageTargeting();
      });

      it('- sets UTM targeting', function() {
        expect(adManager.setUtmTargeting.called).to.be.true;
      });
    });

  });

  describe('#setUtmTargeting', function() {
    beforeEach(function() {
      TestHelper.stub(adManager.googletag, 'pubads').returns({
        setTargeting: sinon.spy()
      });
    });

    context('> with UTM params', function() {
      beforeEach(function() {
        Cookies.remove('utmSession')
        TestHelper.stub(adManager, 'searchString').returns('?utm_source=Facebook&utm_medium=cpc&utm_campaign=foobar');
        adManager.setUtmTargeting();
      });

      it('- sets utm source as targeting key-val', function() {
        expect(googletag.pubads().setTargeting.calledWith('utm_source', 'Facebook')).to.be.true;
      });

      it('- sets utm campaign as targeting key-val', function() {
        expect(googletag.pubads().setTargeting.calledWith('utm_campaign', 'foobar')).to.be.true;
      });

      it('- sets utm medium as targeting key-val', function() {
        expect(googletag.pubads().setTargeting.calledWith('utm_medium', 'cpc')).to.be.true;
      });

      it('- cookies the UTM parameters', function() {
        var cookies = JSON.parse(Cookies.get('utmSession'));
        expect(cookies.utmSource).to.equal('Facebook');
        expect(cookies.utmCampaign).to.equal('foobar');
        expect(cookies.utmMedium).to.equal('cpc');
      });
    });

    context('> without UTM params', function() {
      beforeEach(function() {
        TestHelper.stub(adManager, 'searchString').returns('');
        adManager.setUtmTargeting();
      });

      it('- does not set anything', function() {
        expect(googletag.pubads().setTargeting.called).to.be.false;
      });
    });

    context('> cookied UTM params', function() {
      beforeEach(function() {
        TestHelper.stub(adManager, 'searchString').returns('');
        Cookies.set('utmSession', {
          utmSource: 'Karma',
          utmMedium: 'cpc',
          utmCampaign: 'test'
        });
        adManager.setUtmTargeting();
      });

      it('- sets utm source as targeting key-val', function() {
        expect(googletag.pubads().setTargeting.calledWith('utm_source', 'Karma')).to.be.true;
      });

      it('- sets utm campaign as targeting key-val', function() {
        expect(googletag.pubads().setTargeting.calledWith('utm_campaign', 'test')).to.be.true;
      });

      it('- sets utm medium as targeting key-val', function() {
        expect(googletag.pubads().setTargeting.calledWith('utm_medium', 'cpc')).to.be.true;
      });
    });

    context('> cookied UTM params, but overriding new params', function() {
      beforeEach(function() {
        TestHelper.stub(adManager, 'searchString').returns('?utm_source=Facebook&utm_campaign=foobar');
        Cookies.set('utmSession', {
          utmSource: 'Karma',
          utmMedium: 'test',
          utmCampaign: 'cpc'
        });
        adManager.setUtmTargeting();
      });

      it('- sets utm source as targeting key-val', function() {
        expect(googletag.pubads().setTargeting.calledWith('utm_source', 'Facebook')).to.be.true;
      });

      it('- sets utm campaign as targeting key-val', function() {
        expect(googletag.pubads().setTargeting.calledWith('utm_campaign', 'foobar')).to.be.true;
      });

      it('- would not have called setTargeting with old utmMedium param', function() {
        expect(googletag.pubads().setTargeting.calledTwice).to.be.true;
        expect(googletag.pubads().setTargeting.calledWith('utm_medium', 'cpc')).to.be.false;
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

    it('- unloads and reloads ads', function() {
      expect(adManager.unloadAds.calledWith('domElement')).to.be.true;
      expect(adManager.loadAds.calledWith('domElement')).to.be.true;
    });

    it('- updates the correlator so it is treated like a new pageview request', function() {
      expect(googletag.pubads().updateCorrelator.called).to.be.true;
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

    it('- sets rendered to true', function() {

      adManager.onSlotRenderEnded(event);

      expect(adManager.rendered).to.be.true;
    });

    it('- removes the height property', function() {

      adManager.onSlotRenderEnded(event);

      expect(adElement.style.height).not.to.equal('250px');
    });

    it('- removes the width property', function() {

      adManager.onSlotRenderEnded(event);

      expect(adElement.style.width).not.to.equal('300px');
    });

    it('- calls custom slot render ended callback if there is one', function() {

      adManager.onSlotRenderEnded(event);

      expect(adManager.adUnits.units.header.onSlotRenderEnded.calledWith(event, adElement)).to.be.true;
    });

    it('- sets loaded state to loaded', function() {

      adManager.onSlotRenderEnded(event);

      expect($(adElement).data('ad-load-state')).to.equal('loaded');
    });

    it('- emits a dfpSlotRenderEnded event', function() {

      adManager.onSlotRenderEnded(event);

      expect(eventSpy.called).to.be.true;
    });

    it('- does not dispatch slot render end, does not call callback when ad comes back empty', function() {
      event.isEmpty = true;

      adManager.onSlotRenderEnded(event);

      expect($(adElement).data('ad-load-state')).to.equal('empty');
      expect(adManager.adUnits.units.header.onSlotRenderEnded.called).to.be.false;
      expect(eventSpy.called).to.be.false;
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

    it('- emits a dfpImpressionViewable event', function() {
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

    it('- emits a dfpSlotOnload event', function() {
      expect(eventSpy).to.have.been.called;
    });
  });

  describe('#generateId', function() {
    beforeEach(function() {
      adManager.adId = 0;
    });

    it('- generates a unique ad id by incrementing adId', function() {
      expect(adManager.generateId()).to.equal('dfp-ad-1');
      expect(adManager.adId).to.equal(1);
    });
  });

  describe('#adUnitSizes', function() {
    context('> no sizes configured on desktop', function() {
      var sizeMap = [
        [[900, 0], []],
        [[0, 0], []]
      ];

      it('- returns an empty []', function() {
        TestHelper.stub(adManager, 'getClientWidth').returns(1000);
        expect(adManager.adUnitSizes(sizeMap)).to.eql([]);
      });
    });

    context('> a single size, configured for mobile', function() {
      var sizeMap = [
        [[0, 0], [728, 90]]
      ];

      it('- returns the sizes', function() {
        TestHelper.stub(adManager, 'getClientWidth').returns(375); //iPhone
        expect(adManager.adUnitSizes(sizeMap)).to.eql([728, 90]);
      });
    });

    context('> desktop sizes only', function() {
      var sizeMap = [
        [[900, 0], [728, 90]],
        [[0, 0], []]
      ];

      it('- returns valid sizes on desktop', function() {
        TestHelper.stub(adManager, 'getClientWidth').returns(1000);
        expect(adManager.adUnitSizes(sizeMap)).to.eql([728, 90]);
      });

      it('- returns no valid sizes on mobile', function() {
        TestHelper.stub(adManager, 'getClientWidth').returns(320);
        expect(adManager.adUnitSizes(sizeMap)).to.eql([]);
      });
    });

    context('> mobile sizes only', function() {
      var sizeMap = [
        [[900, 0], []],
        [[0, 0], [300, 250]]
      ];

      it('- desktop returns []', function() {
        TestHelper.stub(adManager, 'getClientWidth').returns(1000);
        expect(adManager.adUnitSizes(sizeMap)).to.eql([]);
      });

      it('- mobile returns the sizes', function() {
        TestHelper.stub(adManager, 'getClientWidth').returns(320);
        expect(adManager.adUnitSizes(sizeMap)).to.eql([300, 250]);
      });
    });

    context('> desktop and mobile sizes', function() {
      var sizeMap = [
        [[900, 0], [['fluid'], [300, 250]]],
        [[0, 0], [[320, 50], 'fluid']]
      ];

      it('- desktop returns the sizes', function() {
        TestHelper.stub(adManager, 'getClientWidth').returns(1000);
        expect(adManager.adUnitSizes(sizeMap)).to.eql([['fluid'], [300, 250]]);
      });

      it('- mobile returns the sizes', function() {
        TestHelper.stub(adManager, 'getClientWidth').returns(320);
        expect(adManager.adUnitSizes(sizeMap)).to.eql([[320, 50], 'fluid']);
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

    it('- builds valid gpt sizemap', function() {
      adManager.buildSizeMap([]);
      expect(window.googletag.sizeMapping().build.calledOnce).to.be.true;
    });

    it("allows ['fluid'] size", function() {
      var sizeMap = [
        [[0, 0], ['fluid']],
      ];
      adManager.buildSizeMap(sizeMap);
      expect(window.googletag.sizeMapping().addSize.calledWith([0, 0], ['fluid'])).to.be.true;
    });

    it("converts 'fluid' string into ['fluid'] array", function() {
      var sizeMap = [
        [[0, 0], 'fluid'],
      ];
      adManager.buildSizeMap(sizeMap);
      expect(window.googletag.sizeMapping().addSize.calledWith([0, 0], ['fluid'])).to.be.true;
    });

    it("converts [['fluid']] doubly-nested array into ['fluid'] array", function() {
      // in practice, GPT doesn't allow [['fluid']], although the documentation is ambiguous on whether
      // this is supposed to work: https://developers.google.com/doubleclick-gpt/reference#googletag.GeneralSize
      var sizeMap = [
        [[0, 0], [['fluid']]],
      ];
      adManager.buildSizeMap(sizeMap);
      expect(window.googletag.sizeMapping().addSize.calledWith([0, 0], ['fluid'])).to.be.true;
    });

    it("allows fluid to be mixed with other sizes", function() {
      var sizeMap = [
        [[0, 0], [['fluid'], [300, 250]]],
        [[900, 0], ['fluid', [728, 90]]],
      ];
      adManager.buildSizeMap(sizeMap);
      expect(window.googletag.sizeMapping().addSize.calledWith([0, 0], ['fluid', [300, 250]])).to.be.true;
      expect(window.googletag.sizeMapping().addSize.calledWith([900, 0], ['fluid', [728, 90]])).to.be.true;
    });
  });

  describe('#adSlotSizes', function() {
    beforeEach(function() {
    });

    it('- filters active gpt sizes  into an array', function() {
      expect(adManager.generateId()).to.equal('dfp-ad-1');
      expect(adManager.adId).to.equal(1);
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

    it('- returns true if the container has the dfp class', function() {
      container.className = 'dfp';
      expect(adManager.isAd(container)).to.be.true;
    });

    it('- returns false if the container does not have the dfp class', function() {
      expect(adManager.isAd(container)).to.be.false;
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

    context('> no arguments passed in', function() {
      beforeEach(function() {
        ads = adManager.findAds();
      });

      it('- returns all ads with `dfp` class', function() {
        var array = [];
        for(var i = 0; i < ads.length; i++) {
          array.push(ads[i]);
        }
        expect(array).to.eql([adSlot1, adSlot2, adSlot3]);
      });
    });

    context('> passed in a query selector', function() {
      beforeEach(function() {
        ads = adManager.findAds('#dfp-ad-1');
      });

      it('- should return ads matching query selector', function() {
        expect(ads.length).to.equal(1);
        expect(ads[0]).to.eql(adSlot1);
      });
    });

    context('> passed in a non-ad HTMLElement', function() {
      beforeEach(function() {
        TestHelper.stub(adManager, 'isAd').returns(false);
        ads = adManager.findAds(container3);
      });

      it('- should returns ads within it', function() {
        expect(ads.length).to.equal(1);
        expect(ads[0]).to.eql(adSlot3);
      });
    });

    context('> passed in an ad HTMLElement', function() {
      beforeEach(function() {
        TestHelper.stub(adManager, 'isAd').returns(true);
        ads = adManager.findAds(adSlot1);
      });

      it('- should return the ad', function() {
        expect(ads.length).to.equal(1);
        expect(ads[0]).to.eql(adSlot1);
      });
    });

    context('> passed in array of containers', function() {
      beforeEach(function() {
        TestHelper.stub(adManager, 'isAd').returns(false);
        containers = document.getElementsByClassName('expected');
        ads = adManager.findAds(containers);
      });

      it('- should return ads within all the containers', function() {
        expect(ads.length).to.equal(2);
        expect(ads[0][0]).to.eql(adSlot1);
        expect(ads[1][0]).to.eql(adSlot3);
      });
    });

    context('> passed in an element context containing ads', function() {
      beforeEach(function() {
        TestHelper.stub(adManager, 'isAd').returns(false);
        containers = document.getElementsByClassName('expected');
        ads = adManager.findAds(containers, false, true);
      });

      it('- should return ads within all the containers', function() {
        expect(ads.length).to.equal(2);
        expect(ads[0][0]).to.eql(adSlot1);
        expect(ads[1][0]).to.eql(adSlot3);
      });
    });
  });

  describe('#logMessage', function() {
    beforeEach(function() {
      TestHelper.spyOn(console, 'warn');
      adManager.logMessage('My message', 'warn');
    });

    it('- logs a message', function() {
      expect(console.warn.calledWith('My message')).to.be.true;
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

    context('> always', function() {
      beforeEach(function() {
        TargetingPairs.getTargetingPairs.returns({});
        adManager.setSlotTargeting(adSlot1, stubSlot, {});
      });

      it('sets ad index targeting for the slot', function() {
        expect(adManager.setIndexTargetingForSlots.calledWith([stubSlot])).to.be.true;
      });
    });

    context('> kinja targeting pairs', function() {
      beforeEach(function() {
        TargetingPairs.getTargetingPairs.returns({
          slotOptions: {
            postId: 1234,
            page: 'permalink'
          }
        });
        adManager.setSlotTargeting(adSlot1, stubSlot, {});
      });

      it('- sets targeting for each slot option', function() {
        expect(stubSlot.setTargeting.callCount).to.equal(3);
        expect(stubSlot.setTargeting.calledWith('pos', 'header')).to.be.true;
        expect(stubSlot.setTargeting.calledWith('postId', '1234')).to.be.true;
        expect(stubSlot.setTargeting.calledWith('page', 'permalink')).to.be.true;
      });
    });

    context('> element has dataset targeting', function() {
      beforeEach(function() {
        elementTargeting = JSON.stringify({
          dfp_content_id: 12345,
          dfp_feature: 'american-voices'
        });
        $(adSlot1).attr('data-targeting', elementTargeting);
        adManager.setSlotTargeting(adSlot1, stubSlot, {});
      });

      it('- sets all the targeting', function() {
        expect(stubSlot.setTargeting.callCount).to.equal(3);
        expect(stubSlot.setTargeting.calledWith('pos', 'header')).to.be.true;
        expect(stubSlot.setTargeting.calledWith('dfp_content_id', '12345')).to.be.true;
        expect(stubSlot.setTargeting.calledWith('dfp_feature', 'american-voices')).to.be.true;
      });
    });

    context('> element has dataset targeting, with overridden pos value', function() {
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

      it('- sets all the targeting', function() {
        expect(stubSlot.setTargeting.callCount).to.equal(3);
        expect(stubSlot.setTargeting.calledWith('pos', 'overridden_pos')).to.be.true;
      });
    });

    context('> element has no dataset targeting', function() {
      beforeEach(function() {
        adManager.setSlotTargeting(adSlot1, stubSlot, {});
      });

      it('- sets at least the pos value', function() {
        expect(stubSlot.setTargeting.callCount).to.equal(1);
        expect(stubSlot.setTargeting.calledWith('pos', 'header')).to.be.true;
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

    it('sets an ad_index to 1 for first on the page', function() {
      adManager.setIndexTargetingForSlots([slot]);
      expect(slot.setTargeting.calledWith('ad_index', '1')).to.be.true;
    });

    it('increments current ad index for subsequent ad requests', function() {
      adManager.countsByAdSlot = { 'header': 1 };
      adManager.setIndexTargetingForSlots([slot]);
      expect(slot.setTargeting.calledWith('ad_index', '2')).to.be.true;
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

    context('> already loaded ad', function() {
      beforeEach(function() {
        adSlot1.id = 'dfp-ad-1';
        adManager.slots['dfp-ad-1'] = adSlot1;
      });

      it('- returns the ad', function() {
        expect(adManager.configureAd(adSlot1)).to.eql(adSlot1);
      });

      it('- does not overwrite the id', function() {
        adManager.adId = 1;
        adManager.configureAd(adSlot1);
        expect(adSlot1.id).to.eql('dfp-ad-1');
      });

      it('- does not add a duplicate slot to the slots array', function() {
        expect(Object.keys(adManager.slots).length).to.equal(1);
      });
    });

    context('> not already loaded', function() {
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

      it('- sets the slot targeting', function() {
        expect(adManager.setSlotTargeting.called).to.be.true;
        expect(adManager.setSlotTargeting.args[0][0].id).to.equal('dfp-ad-1');
        expect(typeof adManager.setSlotTargeting.args[0][1].addService).to.equal('function');
      });

      it('- defines the slot on the google tag object', function() {
        expect(window.googletag.defineSlot.calledWith('/4246/fmg.onion', sizes, 'dfp-ad-1')).to.be.true;
      });

      it('- defines activeSizes mapped to the google tag object', function() {
        expect(slotStub.activeSizes).to.deep.equal(sizes);
      });

      it('- defines slotName to be used in a9 amazon header bidding', function() {
        expect(slotStub.slotName).to.equal('header');
      });

      it('- returns the configured slot and adds it to the slots object', function() {
        expect(typeof adManager.slots['dfp-ad-1'].addService).to.equal('function');
      });
    });

    context('> site section configured', function() {
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

      it('- defines the slot on the google tag object', function() {
        expect(window.googletag.defineSlot.calledWith('/4246/fmg.onion/front', sizes, 'dfp-ad-1')).to.be.true;
      });

      it('- sets whether the ad should be eager loaded', function() {
        var configuredSlot = adManager.configureAd(adSlot1);
        expect(configuredSlot.eagerLoad).to.be.true;
      });
    });
  });

  describe('#pause', function() {
    beforeEach(function() {
      adManager.paused = false;
      adManager.pause();
    });

    it('- pauses any future ad loading', function() {
      expect(adManager.paused).to.be.true;
    });
  });

  describe('#unpause', function() {
    beforeEach(function() {
      adManager.paused = true;
      adManager.unpause();
    });

    it('- unpauses any future ad loading', function() {
      expect(adManager.paused).to.be.false;
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

      it('- no call to fetchAmazonBids if parameter amazonEnabled is false', function() {
        expect(adManager.fetchAmazonBids.calledOnce).to.be.true;
        adManager.options.amazonEnabled = false;
        adManager.initGoogleTag();
        expect(adManager.fetchAmazonBids.calledTwice).to.be.false;
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

    context('> with wrapper tag', function() {
      beforeEach(function() {

        window.headertag = {
          display: sinon.stub(),
          apiReady: true
        };
        adManager.loadAds();
      });

      it('- calls wrapper tag instead of googletag', function() {
        expect(window.headertag.display.callCount).to.equal(3);
        expect(window.headertag.display.args[0][0]).to.equal('dfp-ad-1');
        expect(window.headertag.display.args[1][0]).to.equal('dfp-ad-2');
        expect(window.headertag.display.args[2][0]).to.equal('dfp-ad-3');
      });

      it('- triggers refresh of each slot through wrapper tag', function() {
        expect(adManager.refreshSlot.callCount).to.equal(3);
        expect(adManager.refreshSlot.calledWith(adSlot1)).to.be.true;
        expect(adManager.refreshSlot.calledWith(adSlot2)).to.be.true;
        expect(adManager.refreshSlot.calledWith(adSlot3)).to.be.true;
      });
    });

    context('> without wrapper tag', function() {
      beforeEach(function() {
        delete window.headertag;
        adManager.loadAds();
      });

      it('- displays each ad', function() {
        expect(adManager.googletag.display.callCount).to.equal(3);
        expect(adManager.googletag.display.calledWith('dfp-ad-1')).to.be.true;
        expect(adManager.googletag.display.calledWith('dfp-ad-2')).to.be.true;
        expect(adManager.googletag.display.calledWith('dfp-ad-3')).to.be.true;
      });
    });

    context('> paused', function() {
      beforeEach(function() {
        adManager.paused = true;
        adManager.loadAds();
      });

      it('- does not refresh any slots', function() {
        expect(adManager.googletag.pubads().refresh.called).to.be.false;
      });
    });

    context('> not initialized', function() {
      beforeEach(function() {
        adManager.initialized = false;
        adManager.loadAds();
      });

      it('- does not refresh any slots', function() {
        expect(adManager.googletag.pubads().refresh.called).to.be.false;
      });
    });

    context('> pub ads not ready', function() {
      beforeEach(function() {
        $(adSlot1).attr('data-ad-load-state', 'loaded');
        $(adSlot2).attr('data-ad-load-state', 'loaded');
        $(adSlot3).attr('data-ad-load-state', 'loaded');
        adManager.loadAds();
      });

      it('- enables services', function() {
        expect(adManager.googletag.enableServices.called).to.be.true;
      });
    });

    context('> loading of all ads already in progress', function() {
      beforeEach(function() {
        $(adSlot1).attr('data-ad-load-state', 'loading');
        $(adSlot2).attr('data-ad-load-state', 'loading');
        $(adSlot3).attr('data-ad-load-state', 'loading');
        adManager.loadAds();
      });

      it('- does not try to configureAd', function() {
        expect(adManager.configureAd.called).to.be.false;
      });

      it('- does not try to trigger display', function() {
        expect(adManager.googletag.display.called).to.be.false;
      });

      it('- does not try to refresh pubads across the board', function() {
        expect(adManager.googletag.pubads().refresh.called).to.be.false;
      });
    });

    context('> all ads loaded', function() {
      beforeEach(function() {
        $(adSlot1).attr('data-ad-load-state', 'loaded');
        $(adSlot2).attr('data-ad-load-state', 'loaded');
        $(adSlot3).attr('data-ad-load-state', 'loaded');
        adManager.loadAds();
      });

      it('- does not try to configureAd', function() {
        expect(adManager.configureAd.called).to.be.false;
      });

      it('- does not try to trigger display', function() {
        expect(adManager.googletag.display.called).to.be.false;
      });

      it('- does not try to refresh pubads across the board', function() {
        expect(adManager.googletag.pubads().refresh.called).to.be.false;
      });
    });

    context('> update correlator true', function() {
      beforeEach(function() {
        adManager.loadAds(undefined, true);
      });

      it('- updates the correlator', function() {
        expect(adManager.googletag.pubads().updateCorrelator.called).to.be.true;
      });
    });

    context('> no ads loaded', function() {
      beforeEach(function() {
        adManager.refreshSlot.reset();
        adManager.loadAds();
      });

      it('- configures each ad', function() {
        expect(adManager.configureAd.callCount).to.equal(3);
        expect(adManager.configureAd.calledWith(adSlot1)).to.be.true;
        expect(adManager.configureAd.calledWith(adSlot2)).to.be.true;
        expect(adManager.configureAd.calledWith(adSlot3)).to.be.true;
      });

      it('- displays each ad', function() {
        expect(adManager.googletag.display.callCount).to.equal(3);
        expect(adManager.googletag.display.calledWith('dfp-ad-1')).to.be.true;
        expect(adManager.googletag.display.calledWith('dfp-ad-2')).to.be.true;
        expect(adManager.googletag.display.calledWith('dfp-ad-3')).to.be.true;
      });

      it('- triggers refresh of each slot', function() {
        expect(adManager.refreshSlot.calledWith(adSlot1));
        expect(adManager.refreshSlot.calledWith(adSlot2));
        expect(adManager.refreshSlot.calledWith(adSlot3));
      });
    });

    context('> partial ads loaded', function() {
      beforeEach(function() {
        $(adSlot1).attr('data-ad-load-state', 'loaded');
        adManager.loadAds();
      });

      it('- configures ads not loaded', function() {
        expect(adManager.configureAd.callCount).to.equal(2);
        expect(adManager.configureAd.calledWith(adSlot2)).to.be.true;
        expect(adManager.configureAd.calledWith(adSlot3)).to.be.true;
      });

      it('- displays unloaded ads', function() {
        expect(adManager.googletag.display.callCount).to.equal(2);
        expect(adManager.googletag.display.calledWith('dfp-ad-2')).to.be.true;
        expect(adManager.googletag.display.calledWith('dfp-ad-3')).to.be.true;
      });

      it('- triggers refresh of non-loaded slots', function() {
        expect(adManager.refreshSlot.calledWith(adSlot1)).to.be.false;
        expect(adManager.refreshSlot.calledWith(adSlot2)).to.be.true;
        expect(adManager.refreshSlot.calledWith(adSlot3)).to.be.true;
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

    it('- call to apstag functions if apstag is defined', function () {
      adManager.fetchAmazonBids(slots);
      expect(window.apstag.fetchBids.called).to.be.true;
      var fetchedSlots = window.apstag.fetchBids.args[0][0].slots;

      expect(fetchedSlots.length).to.equal(1);
      expect(fetchedSlots[0].slotID).to.equal(slots[0].getSlotElementId());
      expect(fetchedSlots[0].sizes).to.equal(slots[0].activeSizes);
      expect(fetchedSlots[0].slotName).to.equal('/4246/fmg.onion_' + slots[0].slotName);
    });

    it('- does not include out of page slots', function () {
      slots.push({
          getSlotElementId: function () { return 'dfp-ad-20'; },
          getOutOfPage: function () { return true; },
          activeSizes: [[728, 90]],
          slotName: 'out-of-page'
      });
      adManager.fetchAmazonBids(slots);
      expect(window.apstag.fetchBids.called).to.be.true;
      var fetchedSlots = window.apstag.fetchBids.args[0][0].slots;

      expect(fetchedSlots.length).to.equal(1);
      expect(fetchedSlots[0].slotID).to.equal(slots[0].getSlotElementId());
    });

    it('- does not include slots which currently have no allowed creative sizes based on the current viewport', function () {
      slots.push({
          getSlotElementId: function () { return 'dfp-ad-20'; },
          getOutOfPage: function () { return false; },
          activeSizes: [],
          slotName: 'non-viewport-slot'
      });
      adManager.fetchAmazonBids(slots);
      expect(window.apstag.fetchBids.called).to.be.true;
      var fetchedSlots = window.apstag.fetchBids.args[0][0].slots;

      expect(fetchedSlots.length).to.equal(1);
      expect(fetchedSlots[0].slotID).to.equal(slots[0].getSlotElementId());
    });

    it('- does not call fetchBids if none of the slots passed in have valid sizes for the viewport', function () {
      slots = [{
          getSlotElementId: function () { return 'dfp-ad-20'; },
          getOutOfPage: function () { return false; },
          activeSizes: [],
          slotName: 'non-viewport-slot'
      }];
      adManager.fetchAmazonBids(slots);
      expect(window.apstag.fetchBids.called).to.be.false;
    });

    it('- does not include native slots (sizes `fluid`)', function () {
      slots.push({
          getSlotElementId: function () { return 'dfp-ad-20'; },
          getOutOfPage: function () { return false; },
          activeSizes: ['fluid'],
          slotName: 'native'
      });
      adManager.fetchAmazonBids(slots);
      expect(window.apstag.fetchBids.called).to.be.true;
      var fetchedSlots = window.apstag.fetchBids.args[0][0].slots;

      expect(fetchedSlots.length).to.equal(1);
      expect(fetchedSlots[0].slotID).to.equal(slots[0].getSlotElementId());
    });

    it('- sets targeting once bids are returned from apstag api', function (done) {
      adManager.fetchAmazonBids(slots);
      callback();
      expect(window.headertag.cmd.push.calledOnce).to.be.true;
      done();
    });

    it('- sets targeting using googletag if Index not on page once bids are returned from apstag api', function (done) {
      delete window.headertag;
      adManager.fetchAmazonBids(slots);
      callback();
      expect(window.googletag.cmd.push.calledOnce).to.be.true;
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

    it('- pushes ad slots to PET tag queue', function(){
      adManager = AdManagerWrapper.init({
        iasEnabled: true
      });
      adSlotSetup();

      adManager.fetchIasTargeting();

      expect(adManager.__iasPET.queue).to.be.a('array').to.have.lengthOf(1);
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

    it('- loads the DFP slot matching up with the DOM element id', function() {

      adManager.refreshSlot(adSlot);
      expect(adManager.refreshSlots.calledWith([stubSlot])).to.be.true;
    });

  });

  describe('#refreshSlots', function() {
    context('> prebidEnabled', function(){
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

      it('- calls refreshPrebid when prebid is enabled', function() {
        adManager.options.prebidEnabled = true;
        adManager.refreshSlots([stubSlot]);
        expect(adManager.prebidRefresh.called).to.be.true;
      });

      it('- does not call refreshPrebid when prebid is disabled', function() {
        adManager.options.prebidEnabled = false;
        adManager.refreshSlots([stubSlot]);
        expect(adManager.prebidRefresh.called).to.be.false;
      });

    });

    context('> amazonEnabled', function() {
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

      it('- calls fetchAmazonBids when enabled', function() {
        adManager = AdManagerWrapper.init({ amazonEnabled: true });
        TestHelper.stub(adManager, 'fetchAmazonBids');
        TestHelper.stub(adManager, 'setIndexTargetingForSlots');

        adManager.refreshSlots([stubSlot]);

        expect(adManager.fetchAmazonBids.called).to.be.true;
      });

      it('- does not calls fetchIasTargeting when enabled', function() {
        adManager = AdManagerWrapper.init({ amazonEnabled: false });
        TestHelper.stub(adManager, 'fetchAmazonBids');
        TestHelper.stub(adManager, 'setIndexTargetingForSlots');

        adManager.refreshSlots([stubSlot]);

        expect(adManager.fetchAmazonBids.called).to.be.false;
      });
    });

    context('> iasEnabled', function(){
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

      it('- calls fetchIasTargeting when enabled', function() {
        adManager = AdManagerWrapper.init({ iasEnabled: true });
        TestHelper.stub(adManager, 'fetchAmazonBids');
        TestHelper.stub(adManager, 'fetchIasTargeting');
        TestHelper.stub(adManager, 'setIndexTargetingForSlots');

        adManager.refreshSlots([stubSlot]);

        expect(adManager.fetchIasTargeting.called).to.be.true;
      });

      it('- does not calls fetchIasTargeting when enabled', function() {
        adManager = AdManagerWrapper.init({ iasEnabled: false });
        TestHelper.stub(adManager, 'fetchAmazonBids');
        TestHelper.stub(adManager, 'fetchIasTargeting');
        TestHelper.stub(adManager, 'setIndexTargetingForSlots');

        adManager.refreshSlots([stubSlot]);

        expect(adManager.fetchIasTargeting.called).to.be.false;
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

    it('- calls pbjs.requestBids when adunit-level prebid config is present', function() {
      adManager.prebidRefresh([stubSlot]);
      pbjs.que[0](); // let the pbjs queue run one step
      expect(pbjs.requestBids.called).to.be.true;
    });

    it('- calls googletag.pubads().refresh directly when no units are configured for prebid', function() {
      TestHelper.stub(adManager.googletag, 'pubads').returns({
        refresh: sinon.spy(),
        getSlots: function() {return []}
      });
      stubSlot.prebid = false;
      adManager.refreshSlots([stubSlot]);
      googletag.cmd[0](); // let the googletag queue run one step
      expect(googletag.pubads.called).to.be.true;
      expect(pbjs.requestBids.called).to.be.false;
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

    context('> api is ready', function() {
      beforeEach(function() {
        window.googletag.apiReady = true;
        adManager.asyncRefreshSlot(adSlot1);
      });

      it('- refreshes the slot right away', function() {
        expect(adManager.refreshSlot.calledWith(adSlot1)).to.be.true;
      });
    });

    context('> api is not ready', function() {
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
        expect(adManager.refreshSlot.calledWith(adSlot1)).to.be.true;
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

    context('> not initialized', function() {
      beforeEach(function() {
        adManager.initialized = false;
        adManager.unloadAds();
      });

      it('- does not clear anything', function() {
        expect(adManager.googletag.pubads().clear.called).to.be.false;
      });

      it('- leaves slots intact', function() {
        expect(adManager.slots).to.eql({
          'dfp-ad-1': adSlot1,
          'dfp-ad-2': adSlot2
        });
      });
    });

    context('> initialized', function() {
      beforeEach(function() {
        adManager.initialized = true;
        adManager.unloadAds();
      });

      it('- removes all elements from the slots', function() {
        expect(adManager.slots).to.eql({});
      });

      it('- clears all slots through the pubads service', function() {
        expect(adManager.googletag.pubads().clear.calledWith([adSlot1, adSlot2])).to.be.true;
      });

      it('- resets the load state attribute', function() {
        expect($(adSlot1).data('ad-load-state')).to.equal('unloaded');
        expect($(adSlot2).data('ad-load-state')).to.equal('unloaded');
      });
    });
  });

  describe('#getAdUnitCode', function() {
    context('> Bulbs', function() {
      beforeEach(function() {
        delete window.kinja;
      });

      afterEach(function() {
        delete window.dfpSiteSection;
      });

      it('- returns the bulbs convention', function() {
        expect(adManager.getAdUnitCode()).to.equal('/4246/fmg.onion');
      });

      it('- tacks on the dfpSiteSection to the ad unit code if available', function() {
        window.dfpSiteSection = 'front';
        expect(adManager.getAdUnitCode()).to.equal('/4246/fmg.onion/front');
      });
    });

    context('> Kinja', function() {
      beforeEach(function() {
        window.kinja = {};
        TestHelper.stub(AdZone, 'forcedAdZone').returns(false);
        TestHelper.stub(TargetingPairs, 'getTargetingPairs').returns({
          slotOptions: { page: 'frontpage' }
        })
      });

      context('> forced ad zone is set to collapse', function() {
        it('- uses collapse sub-level ad unit', function() {
          AdZone.forcedAdZone.returns('collapse');
          expect(adManager.getAdUnitCode()).to.equal('/4246/fmg.onion/collapse');
        });
      });

      context('> front page, no forced ad zone', function() {
        it('- uses front', function() {
          expect(adManager.getAdUnitCode()).to.equal('/4246/fmg.onion/front');
        });
      });

      context('> most pages', function() {
        it('- uses the page type on meta', function() {
          TargetingPairs.getTargetingPairs.returns({
            slotOptions: { page: 'permalink' }
          });
          expect(adManager.getAdUnitCode()).to.equal('/4246/fmg.onion/permalink');
        });
      });
    });
  });
});

