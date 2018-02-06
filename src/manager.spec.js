var TargetingPairs = require('./helpers/TargetingPairs');
var AdZone = require('./helpers/AdZone');

describe('AdManager', function() {
  var AdManager, AdManagerWrapper, adManager, adUnits;
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
  });

  afterEach(function() {
    Cookies.remove('utmSession');
  });

  describe('new AdManager', function() {
    it('has no slots yet', function() {
      expect(adManager.slots).to.eql({});
    });

    it('has a default ad id', function() {
      expect(adManager.adId).to.equal(0);
    });

    it('is not initialized', function() {
      expect(adManager.initialized).to.be.false;
    });

    context('base defaults', function() {
      it('reloads on resize', function() {
        expect(adManager.options.doReloadOnResize).to.be.true;
      });
    });

    context('override options', function() {
      it('allows override of defaults', function() {
        adManager = AdManagerWrapper.init({
          doReloadOnResize: false,
          dfpSiteCode: 'fmg.onion',
          adUnits: adUnits
         });
        expect(adManager.options.doReloadOnResize).to.be.false;
      });
    });

    context('google tag initialization', function() {
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

      it('calls initGoogleTag', function() {
        expect(adManager.initGoogleTag.called).to.be.true;
      });
    });
  });

  describe('#handleWindowResize', function() {
    beforeEach(function() {
      adManager.oldViewportWidth = window.document.body.clientWidth - 200;
      TestHelper.stub(adManager, 'reloadAds');
    });

    it('calls reloadAds if viewport changed', function() {
      adManager.handleWindowResize();
      expect(adManager.reloadAds.called).to.be.true;
    });

    it('does not reload ads if the viewport has not changed', function() {
      adManager.oldViewportWidth = window.document.body.clientWidth;
      adManager.handleWindowResize();
      expect(adManager.reloadAds.called).to.be.false;
    });

    it('does not reload ads if the setting is disabled', function() {
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

    it('enable single request mode when option enabled, otherwise disable it', function() {
      expect(adManager.googletag.pubads().enableSingleRequest.called).to.be.false;
      adManager.options.enableSRA = true;
      adManager.initGoogleTag();
      expect(adManager.googletag.pubads().enableSingleRequest.called).to.be.true;
    });

    it('disables initial load of ads, to defer to the eager/lazy loading logic', function() {
      expect(adManager.googletag.pubads().disableInitialLoad.called).to.be.true;
    });

    it('enables async rendering to avoid page blocking and allow the manual use of `updateCorrelator`', function() {
      expect(adManager.googletag.pubads().enableAsyncRendering.called).to.be.true;
    });

    it('always updates the correlator automatically whenever the ad lib is loaded', function() {
      expect(adManager.googletag.pubads().updateCorrelator.called).to.be.true;
    });

    it('sets up custom slot render ended callback', function() {
      expect(adManager.googletag.pubads().addEventListener.calledWith('slotRenderEnded', adManager.onSlotRenderEnded)).to.be.true;
    });

    it('sets up custom slot onImpressionViewable callback', function() {
      expect(adManager.googletag.pubads().addEventListener.calledWith('impressionViewable', adManager.onImpressionViewable)).to.be.true;
    });

    it('sets up custom slot onload callback', function() {
      expect(adManager.googletag.pubads().addEventListener.calledWith('slotOnload', adManager.onSlotOnload)).to.be.true;
    });

    it('sets the global targeting on the pub ads service', function() {
      expect(adManager.setPageTargeting.called).to.be.true;
    });

    it('sets the initialize flag to true', function() {
      expect(adManager.initialized).to.be.true;
    });

    it('loads ads initially', function() {
      expect(adManager.loadAds.calledOnce).to.be.true;
    });



    it('merges global TARGETING with ad unit dfp site param', function() {
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

    it('sets targeting for each key-value pair', function() {
      expect(googletag.pubads().setTargeting.calledWith('dfp_site', 'onion')).to.be.true;
      expect(googletag.pubads().setTargeting.calledWith('dfp_pagetype', 'home')).to.be.true;
    });

    context('Krux user id present', function() {
      beforeEach(function() {
        window.Krux = {
          user: '12345'
        };
        adManager.setPageTargeting();
      });

      afterEach(function() {
        delete window.Krux;
      });

      it('sets the Krux user id if available', function() {
        expect(googletag.pubads().setTargeting.calledWith('kuid', '12345')).to.be.true;
      });
    });

    context('UTM parameters are present', function() {
      beforeEach(function() {
        TestHelper.stub(adManager, 'setUtmTargeting');
        adManager.setPageTargeting();
      });

      it('sets UTM targeting', function() {
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

    context('with UTM params', function() {
      beforeEach(function() {
        Cookies.remove('utmSession')
        TestHelper.stub(adManager, 'searchString').returns('?utm_source=Facebook&utm_medium=cpc&utm_campaign=foobar');
        adManager.setUtmTargeting();
      });

      it('sets utm source as targeting key-val', function() {
        expect(googletag.pubads().setTargeting.calledWith('utm_source', 'Facebook')).to.be.true;
      });

      it('sets utm campaign as targeting key-val', function() {
        expect(googletag.pubads().setTargeting.calledWith('utm_campaign', 'foobar')).to.be.true;
      });

      it('sets utm medium as targeting key-val', function() {
        expect(googletag.pubads().setTargeting.calledWith('utm_medium', 'cpc')).to.be.true;
      });

      it('cookies the UTM parameters', function() {
        var cookies = JSON.parse(Cookies.get('utmSession'));
        expect(cookies.utmSource).to.equal('Facebook');
        expect(cookies.utmCampaign).to.equal('foobar');
        expect(cookies.utmMedium).to.equal('cpc');
      });
    });

    context('without UTM params', function() {
      beforeEach(function() {
        TestHelper.stub(adManager, 'searchString').returns('');
        adManager.setUtmTargeting();
      });

      it('does not set anything', function() {
        expect(googletag.pubads().setTargeting.called).to.be.false;
      });
    });

    context('cookied UTM params', function() {
      beforeEach(function() {
        TestHelper.stub(adManager, 'searchString').returns('');
        Cookies.set('utmSession', {
          utmSource: 'Karma',
          utmMedium: 'cpc',
          utmCampaign: 'test'
        });
        adManager.setUtmTargeting();
      });

      it('sets utm source as targeting key-val', function() {
        expect(googletag.pubads().setTargeting.calledWith('utm_source', 'Karma')).to.be.true;
      });

      it('sets utm campaign as targeting key-val', function() {
        expect(googletag.pubads().setTargeting.calledWith('utm_campaign', 'test')).to.be.true;
      });

      it('sets utm medium as targeting key-val', function() {
        expect(googletag.pubads().setTargeting.calledWith('utm_medium', 'cpc')).to.be.true;
      });
    });

    context('cookied UTM params, but overriding new params', function() {
      beforeEach(function() {
        TestHelper.stub(adManager, 'searchString').returns('?utm_source=Facebook&utm_campaign=foobar');
        Cookies.set('utmSession', {
          utmSource: 'Karma',
          utmMedium: 'test',
          utmCampaign: 'cpc'
        });
        adManager.setUtmTargeting();
      });

      it('sets utm source as targeting key-val', function() {
        expect(googletag.pubads().setTargeting.calledWith('utm_source', 'Facebook')).to.be.true;
      });

      it('sets utm campaign as targeting key-val', function() {
        expect(googletag.pubads().setTargeting.calledWith('utm_campaign', 'foobar')).to.be.true;
      });

      it('would not have called setTargeting with old utmMedium param', function() {
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

    it('unloads and reloads ads', function() {
      expect(adManager.unloadAds.calledWith('domElement')).to.be.true;
      expect(adManager.loadAds.calledWith('domElement')).to.be.true;
    });

    it('updates the correlator so it is treated like a new pageview request', function() {
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

    it('sets rendered to true', function() {

      adManager.onSlotRenderEnded(event);

      expect(adManager.rendered).to.be.true;
    });

    it('removes the height property', function() {

      adManager.onSlotRenderEnded(event);

      expect(adElement.style.height).not.to.equal('250px');
    });

    it('removes the width property', function() {

      adManager.onSlotRenderEnded(event);

      expect(adElement.style.width).not.to.equal('300px');
    });

    it('calls custom slot render ended callback if there is one', function() {

      adManager.onSlotRenderEnded(event);

      expect(adManager.adUnits.units.header.onSlotRenderEnded.calledWith(event, adElement)).to.be.true;
    });

    it('sets loaded state to loaded', function() {

      adManager.onSlotRenderEnded(event);

      expect($(adElement).data('ad-load-state')).to.equal('loaded');
    });

    it('emits a dfpSlotRenderEnded event', function() {

      adManager.onSlotRenderEnded(event);

      expect(eventSpy.called).to.be.true;
    });

    it('does not dispatch slot render end, does not call callback when ad comes back empty', function() {
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

    it('emits a dfpImpressionViewable event', function() {
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

    it('emits a dfpSlotOnload event', function() {
      expect(eventSpy).to.have.been.called;
    });
  });

  describe('#generateId', function() {
    beforeEach(function() {
      adManager.adId = 0;
    });

    it('generates a unique ad id by incrementing adId', function() {
      expect(adManager.generateId()).to.equal('dfp-ad-1');
      expect(adManager.adId).to.equal(1);
    });
  });

  describe('#adUnitSizes', function() {
    beforeEach(function() {
    });

    it('filters ad unit sizes into an array', function() {
      expect(adManager.generateId()).to.equal('dfp-ad-1');
      expect(adManager.adId).to.equal(1);
    });
  });

  describe('#adSlotSizes', function() {
    beforeEach(function() {
    });

    it('filters active gpt sizes  into an array', function() {
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

    it('returns true if the container has the dfp class', function() {
      container.className = 'dfp';
      expect(adManager.isAd(container)).to.be.true;
    });

    it('returns false if the container does not have the dfp class', function() {
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

    context('no arguments passed in', function() {
      beforeEach(function() {
        ads = adManager.findAds();
      });

      it('returns all ads with `dfp` class', function() {
        var array = [];
        for(var i = 0; i < ads.length; i++) {
          array.push(ads[i]);
        }
        expect(array).to.eql([adSlot1, adSlot2, adSlot3]);
      });
    });

    context('passed in a query selector', function() {
      beforeEach(function() {
        ads = adManager.findAds('#dfp-ad-1');
      });

      it('should return ads matching query selector', function() {
        expect(ads.length).to.equal(1);
        expect(ads[0]).to.eql(adSlot1);
      });
    });

    context('passed in a non-ad HTMLElement', function() {
      beforeEach(function() {
        TestHelper.stub(adManager, 'isAd').returns(false);
        ads = adManager.findAds(container3);
      });

      it('should returns ads within it', function() {
        expect(ads.length).to.equal(1);
        expect(ads[0]).to.eql(adSlot3);
      });
    });

    context('passed in an ad HTMLElement', function() {
      beforeEach(function() {
        TestHelper.stub(adManager, 'isAd').returns(true);
        ads = adManager.findAds(adSlot1);
      });

      it('should return the ad', function() {
        expect(ads.length).to.equal(1);
        expect(ads[0]).to.eql(adSlot1);
      });
    });

    context('passed in array of containers', function() {
      beforeEach(function() {
        TestHelper.stub(adManager, 'isAd').returns(false);
        containers = document.getElementsByClassName('expected');
        ads = adManager.findAds(containers);
      });

      it('should return ads within all the containers', function() {
        expect(ads.length).to.equal(2);
        expect(ads[0][0]).to.eql(adSlot1);
        expect(ads[1][0]).to.eql(adSlot3);
      });
    });
	
    context('passed in an element context containing ads', function() {
      beforeEach(function() {
        TestHelper.stub(adManager, 'isAd').returns(false);
        containers = document.getElementsByClassName('expected');
        ads = adManager.findAds(containers, false, true);
      });

      it('should return ads within all the containers', function() {
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

    it('logs a message', function() {
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
      container1.appendChild(adSlot1);
      document.body.appendChild(container1);

      adManager.targeting = { dfp_site: 'onion', dfp_pagetype: 'article' };

      TestHelper.stub(TargetingPairs, 'getTargetingPairs').returns({});
      TestHelper.stub(AdZone, 'forcedAdZone').returns('');

      stubSlot = { setTargeting: sinon.spy() };
    });

    afterEach(function() {
      $(container1).remove();
    });

    context('kinja targeting pairs', function() {
      beforeEach(function() {
        TargetingPairs.getTargetingPairs.returns({
          slotOptions: {
            postId: 1234,
            page: 'permalink'
          }
        });
        adManager.setSlotTargeting(adSlot1, stubSlot, {});
      });

      it('sets targeting for each slot option', function() {
        expect(stubSlot.setTargeting.callCount).to.equal(2);
        expect(stubSlot.setTargeting.calledWith('postId', '1234')).to.be.true;
        expect(stubSlot.setTargeting.calledWith('page', 'permalink')).to.be.true;
      });
    });

    context('element has dataset targeting', function() {
      beforeEach(function() {
        elementTargeting = JSON.stringify({
          dfp_content_id: 12345,
          dfp_feature: 'american-voices'
        });
        $(adSlot1).attr('data-targeting', elementTargeting);
        adManager.setSlotTargeting(adSlot1, stubSlot, {});
      });

      it('sets all the targeting', function() {
        expect(stubSlot.setTargeting.callCount).to.equal(2);
        expect(stubSlot.setTargeting.calledWith('dfp_content_id', '12345')).to.be.true;
        expect(stubSlot.setTargeting.calledWith('dfp_feature', 'american-voices')).to.be.true;
      });
    });

    context('element has no dataset targeting', function() {
      beforeEach(function() {
        adManager.setSlotTargeting(adSlot1, stubSlot, {});
      });

      it('sets no targeting', function() {
        expect(stubSlot.setTargeting.callCount).to.equal(0);
      });
    });
  });

  describe('#configureAd', function() {
    var adSlot1, container1;

    beforeEach(function() {
      TestHelper.stub(adManager, 'getAdUnitCode').returns('/4246/fmg.onion');
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

    context('already loaded ad', function() {
      beforeEach(function() {
        adSlot1.id = 'dfp-ad-1';
        adManager.slots['dfp-ad-1'] = adSlot1;
      });

      it('returns the ad', function() {
        expect(adManager.configureAd(adSlot1)).to.eql(adSlot1);
      });
    });

    context('not already loaded', function() {
      var configuredSlot, slotStub;

      beforeEach(function() {
        TestHelper.stub(adManager, 'setSlotTargeting');
        TestHelper.stub(adManager, 'generateId').returns('dfp-ad-1');
        TestHelper.stub(window.googletag, 'pubads').returns('Stub pub ads');
        slotStub = {
          defineSizeMapping: sinon.spy(),
          addService: sinon.spy(),
          setTargeting: function () {}
        };
        TestHelper.stub(window.googletag, 'defineSlot').returns(slotStub);
        configuredSlot = adManager.configureAd(adSlot1);
      });

      it('sets the slot targeting', function() {
        expect(adManager.setSlotTargeting.called).to.be.true;
        expect(adManager.setSlotTargeting.args[0][0].id).to.equal('dfp-ad-1');
        expect(typeof adManager.setSlotTargeting.args[0][1].addService).to.equal('function');
      });

      it('defines the slot on the google tag object', function() {
        expect(window.googletag.defineSlot.calledWith('/4246/fmg.onion', adManager.adUnits.units.header.sizes[0][1], 'dfp-ad-1')).to.be.true;
      });

      it('defines the size mapping on the google tag object', function() {
        expect(slotStub.defineSizeMapping.calledWith(adManager.adUnits.units.header.sizes)).to.be.true;
      });

      it('returns the configured slot and adds it to the slots object', function() {
        expect(typeof adManager.slots['dfp-ad-1'].addService).to.equal('function');
      });
    });

    context('site section configured', function() {
      var configuredSlot, slotStub;

      beforeEach(function() {
        delete window.kinja;
        adManager.getAdUnitCode.returns('/4246/fmg.onion/front');
        TestHelper.stub(adManager, 'setSlotTargeting');
        TestHelper.stub(adManager, 'generateId').returns('dfp-ad-1');
        TestHelper.stub(window.googletag, 'pubads').returns('Stub pub ads');
        slotStub = {
          defineSizeMapping: sinon.spy(),
          addService: sinon.spy(),
          setTargeting: function () {}
        };
        TestHelper.stub(window.googletag, 'defineSlot').returns(slotStub);
        configuredSlot = adManager.configureAd(adSlot1);
      });

      afterEach(function() {
        delete window.dfpSiteSection;
      });

      it('defines the slot on the google tag object', function() {
        expect(window.googletag.defineSlot.calledWith('/4246/fmg.onion/front', adManager.adUnits.units.header.sizes[0][1], 'dfp-ad-1')).to.be.true;
      });

      it('sets whether the ad should be eager loaded', function() {
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

    it('pauses any future ad loading', function() {
      expect(adManager.paused).to.be.true;
    });
  });

  describe('#unpause', function() {
    beforeEach(function() {
      adManager.paused = true;
      adManager.unpause();
    });

    it('unpauses any future ad loading', function() {
      expect(adManager.paused).to.be.false;
    });
  });

  describe('#loadAds', function() {
	var baseContainer, container1, container2, container3, adSlot1, adSlot2, adSlot3, ads;

    beforeEach(function() {
      adManager.paused = false;
      adManager.initialized = true;
      adManager.options.amazonEnabled = false;

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

      it('no call to fetchAmazonBids if parameter amazonEnalbed is false', function() {
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

    context('with wrapper tag', function() {
      beforeEach(function() {

        window.headertag = {
          display: sinon.stub(),
          apiReady: true
        };
        adManager.loadAds();
      });

      it('calls wrapper tag instead of googletag', function() {
        expect(window.headertag.display.callCount).to.equal(3);
        expect(window.headertag.display.args[0][0]).to.equal('dfp-ad-1');
        expect(window.headertag.display.args[1][0]).to.equal('dfp-ad-2');
        expect(window.headertag.display.args[2][0]).to.equal('dfp-ad-3');
      });

      it('triggers refresh of each slot through wrapper tag', function() {
        expect(adManager.refreshSlot.callCount).to.equal(3);
        expect(adManager.refreshSlot.calledWith(adSlot1)).to.be.true;
        expect(adManager.refreshSlot.calledWith(adSlot2)).to.be.true;
        expect(adManager.refreshSlot.calledWith(adSlot3)).to.be.true;
      });
    });

    context('without wrapper tag', function() {
      beforeEach(function() {
        delete window.headertag;
        adManager.loadAds();
      });

      it('displays each ad', function() {
        expect(adManager.googletag.display.callCount).to.equal(3);
        expect(adManager.googletag.display.calledWith('dfp-ad-1')).to.be.true;
        expect(adManager.googletag.display.calledWith('dfp-ad-2')).to.be.true;
        expect(adManager.googletag.display.calledWith('dfp-ad-3')).to.be.true;
      });
    });

    context('paused', function() {
      beforeEach(function() {
        adManager.paused = true;
        adManager.loadAds();
      });

      it('does not refresh any slots', function() {
        expect(adManager.googletag.pubads().refresh.called).to.be.false;
      });
    });

    context('not initialized', function() {
      beforeEach(function() {
        adManager.initialized = false;
        adManager.loadAds();
      });

      it('does not refresh any slots', function() {
        expect(adManager.googletag.pubads().refresh.called).to.be.false;
      });
    });

    context('pub ads not ready', function() {
      beforeEach(function() {
        $(adSlot1).attr('data-ad-load-state', 'loaded');
        $(adSlot2).attr('data-ad-load-state', 'loaded');
        $(adSlot3).attr('data-ad-load-state', 'loaded');
        adManager.loadAds();
      });

      it('enables services', function() {
        expect(adManager.googletag.enableServices.called).to.be.true;
      });
    });

    context('loading of all ads already in progress', function() {
      beforeEach(function() {
        $(adSlot1).attr('data-ad-load-state', 'loading');
        $(adSlot2).attr('data-ad-load-state', 'loading');
        $(adSlot3).attr('data-ad-load-state', 'loading');
        adManager.loadAds();
      });

      it('does not try to configureAd', function() {
        expect(adManager.configureAd.called).to.be.false;
      });

      it('does not try to trigger display', function() {
        expect(adManager.googletag.display.called).to.be.false;
      });

      it('does not try to refresh pubads across the board', function() {
        expect(adManager.googletag.pubads().refresh.called).to.be.false;
      });
    });

    context('all ads loaded', function() {
      beforeEach(function() {
        $(adSlot1).attr('data-ad-load-state', 'loaded');
        $(adSlot2).attr('data-ad-load-state', 'loaded');
        $(adSlot3).attr('data-ad-load-state', 'loaded');
        adManager.loadAds();
      });

      it('does not try to configureAd', function() {
        expect(adManager.configureAd.called).to.be.false;
      });

      it('does not try to trigger display', function() {
        expect(adManager.googletag.display.called).to.be.false;
      });

      it('does not try to refresh pubads across the board', function() {
        expect(adManager.googletag.pubads().refresh.called).to.be.false;
      });
    });

    context('update correlator true', function() {
      beforeEach(function() {
        adManager.loadAds(undefined, true);
      });

      it('updates the correlator', function() {
        expect(adManager.googletag.pubads().updateCorrelator.called).to.be.true;
      });
    });

    context('no ads loaded', function() {
      beforeEach(function() {
        adManager.refreshSlot.reset();
        adManager.loadAds();
      });

      it('configures each ad', function() {
        expect(adManager.configureAd.callCount).to.equal(3);
        expect(adManager.configureAd.calledWith(adSlot1)).to.be.true;
        expect(adManager.configureAd.calledWith(adSlot2)).to.be.true;
        expect(adManager.configureAd.calledWith(adSlot3)).to.be.true;
      });

      it('displays each ad', function() {
        expect(adManager.googletag.display.callCount).to.equal(3);
        expect(adManager.googletag.display.calledWith('dfp-ad-1')).to.be.true;
        expect(adManager.googletag.display.calledWith('dfp-ad-2')).to.be.true;
        expect(adManager.googletag.display.calledWith('dfp-ad-3')).to.be.true;
      });

      it('triggers refresh of each slot', function() {
        expect(adManager.refreshSlot.calledWith(adSlot1));
        expect(adManager.refreshSlot.calledWith(adSlot2));
        expect(adManager.refreshSlot.calledWith(adSlot3));
      });
    });

    context('partial ads loaded', function() {
      beforeEach(function() {
        $(adSlot1).attr('data-ad-load-state', 'loaded');
        adManager.loadAds();
      });

      it('configures ads not loaded', function() {
        expect(adManager.configureAd.callCount).to.equal(2);
        expect(adManager.configureAd.calledWith(adSlot2)).to.be.true;
        expect(adManager.configureAd.calledWith(adSlot3)).to.be.true;
      });

      it('displays unloaded ads', function() {
        expect(adManager.googletag.display.callCount).to.equal(2);
        expect(adManager.googletag.display.calledWith('dfp-ad-2')).to.be.true;
        expect(adManager.googletag.display.calledWith('dfp-ad-3')).to.be.true;
      });

      it('triggers refresh of non-loaded slots', function() {
        expect(adManager.refreshSlot.calledWith(adSlot1)).to.be.false;
        expect(adManager.refreshSlot.calledWith(adSlot2)).to.be.true;
        expect(adManager.refreshSlot.calledWith(adSlot3)).to.be.true;
      });
    });
  });

  describe('#fetchAmazonBids', function () {

    beforeEach(function() {
	   var headertag = window.headertag = {};
      sandbox = sinon.sandbox.create();
      window.apstag = {
        fetchBids: function () {
			this.callArg(callback)
		}
      };

      headertag.cmd = {
        push: function() {
         window.apstag.setDisplayBids()
        }
      };

      sandbox.stub(window.headertag.cmd, 'push')
      sandbox.stub(window.apstag, 'fetchBids');
    });

    afterEach(function() {
      sandbox.restore();
    });

    it('call to apstag functions if apstag is defined', function () {
      adManager.fetchAmazonBids();
      expect(window.apstag.fetchBids.called).to.be.true;
    });

    it('fetches bids from apstag api', function (done) {
      adManager.fetchAmazonBids();
      callback();
      expect(window.headertag.cmd.push.calledOnce).to.be.true;
      done();
    });

    it('no call to apstag functions if apstag is undefined', function () {
      expect(window.apstag.fetchBids.called).to.be.false;
    });
  });

  describe('#refreshSlot', function() {
    var baseContainer, container1, adSlot1, ads, stubSlot;

    beforeEach(function() {
      TestHelper.stub(adManager, 'refreshSlots');
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

      document.body.appendChild(baseContainer);

      stubSlot = {
        element: adSlot1
      };

      adManager.slots = {
        'dfp-ad-1': stubSlot
      };

    });

    afterEach(function() {
      $(baseContainer).remove();
    });

    it('loads the DFP slot matching up with the DOM element id', function() {
      adManager.refreshSlot(adSlot1);
      expect(adManager.refreshSlots.calledWith([stubSlot], [adSlot1])).to.be.true;
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

    context('api is ready', function() {
      beforeEach(function() {
        window.googletag.apiReady = true;
        adManager.asyncRefreshSlot(adSlot1);
      });

      it('refreshes the slot right away', function() {
        expect(adManager.refreshSlot.calledWith(adSlot1)).to.be.true;
      });
    });

    context('api is not ready', function() {
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

      it('refreshes the slot by way of the `cmd` async queue', function () {
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

    context('not initialized', function() {
      beforeEach(function() {
        adManager.initialized = false;
        adManager.unloadAds();
      });

      it('does not clear anything', function() {
        expect(adManager.googletag.pubads().clear.called).to.be.false;
      });

      it('leaves slots intact', function() {
        expect(adManager.slots).to.eql({
          'dfp-ad-1': adSlot1,
          'dfp-ad-2': adSlot2
        });
      });
    });

    context('initialized', function() {
      beforeEach(function() {
        adManager.initialized = true;
        adManager.unloadAds();
      });

      it('removes all elements from the slots', function() {
        expect(adManager.slots).to.eql({});
      });

      it('clears all slots through the pubads service', function() {
        expect(adManager.googletag.pubads().clear.calledWith([adSlot1, adSlot2])).to.be.true;
      });

      it('resets the load state attribute', function() {
        expect($(adSlot1).data('ad-load-state')).to.equal('unloaded');
        expect($(adSlot2).data('ad-load-state')).to.equal('unloaded');
      });
    });
  });

  describe('#getAdUnitCode', function() {
    context('Bulbs', function() {
      beforeEach(function() {
        delete window.kinja;
      });

      afterEach(function() {
        delete window.dfpSiteSection;
      });

      it('returns the bulbs convention', function() {
        expect(adManager.getAdUnitCode()).to.equal('/4246/fmg.onion');
      });

      it('tacks on the dfpSiteSection to the ad unit code if available', function() {
        window.dfpSiteSection = 'front';
        expect(adManager.getAdUnitCode()).to.equal('/4246/fmg.onion/front');
      });
    });

    context('Kinja', function() {
      beforeEach(function() {
        window.kinja = {};
        TestHelper.stub(AdZone, 'forcedAdZone').returns(false);
        TestHelper.stub(TargetingPairs, 'getTargetingPairs').returns({
          slotOptions: { page: 'frontpage' }
        })
      });

      context('forced ad zone is set to collapse', function() {
        it('uses collapse sub-level ad unit', function() {
          AdZone.forcedAdZone.returns('collapse');
          expect(adManager.getAdUnitCode()).to.equal('/4246/fmg.onion/collapse');
        });
      });

      context('front page, no forced ad zone', function() {
        it('uses front', function() {
          expect(adManager.getAdUnitCode()).to.equal('/4246/fmg.onion/front');
        });
      });

      context('most pages', function() {
        it('uses the page type on meta', function() {
          TargetingPairs.getTargetingPairs.returns({
            slotOptions: { page: 'permalink' }
          });
          expect(adManager.getAdUnitCode()).to.equal('/4246/fmg.onion/permalink');
        });
      });
    });
  });
});

