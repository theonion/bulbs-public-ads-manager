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
    window.pbjs = {
      cmd: {
        push: function() {
          pbjs.setConfig();
        }
      },
      setConfig: sinon.spy(),
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

  describe('#logMessage', function() {
    beforeEach(function() {
      TestHelper.spyOn(console, 'warn');
      adManager.logMessage('My message', 'warn');
    });

    it('- logs a message', function() {
      expect(console.warn.calledWith('My message')).to.be.true;
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
    var baseContainer, container1, adSlot1, stubSlot, eagerStubSlot, variableReferences;
    baseContainer = document.createElement('div');
    container1 = document.createElement('div');
    container1.className ='expected';
    container1.id = 'ad-container-1';
    adSlot1 = document.createElement('div');
    adSlot1.id = 'dfp-ad-1';
    adSlot1.className = 'dfp';
    adSlot1.dataset.adUnit = 'header';
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
      setTargeting: function () {},
      getOutOfPage: function () { return false; }
    };

    eagerStubSlot = Object.assign({}, stubSlot, { eagerLoad: true });

    variableReferences = {
      baseContainer: baseContainer,
      container1: container1,
      adSlot1: adSlot1,
      stubSlot: stubSlot,
      eagerStubSlot: eagerStubSlot
    };

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

    it('- should invoke optional callback onRefresh if provided', function () {
      TestHelper.stub(adManager.adUnits.units.header, 'onRefresh');
      adManager.refreshSlot(adSlot);
      expect(adManager.adUnits.units.header.onRefresh.called).to.be.true;
    });

  });

  describe('#refreshSlots', function() {

  	beforeEach(function() {
		TestHelper.stub(adManager.googletag, 'pubads').returns({
	        updateCorrelator: sinon.spy(),
	        getSlots: function() {return []},
	        refresh: sinon.spy()
	      });
  	});

  	context('always', function() {
      var adSlot, stubSlot, eagerStubSlot, baseContainer;

      beforeEach(function(){
        var setupRefs = adSlotSetup();
        adSlot = setupRefs.adSlot1;
        stubSlot = setupRefs.stubSlot;
        eagerStubSlot = setupRefs.eagerStubSlot;
        baseContainer = setupRefs.baseContainer;
      });

      afterEach(function() {
        $(baseContainer).remove();
      });

      it('updates the correlator when ad is not eager loaded', function() {
        adManager = AdManagerWrapper.init({ iasEnabled: true });
        TestHelper.stub(adManager, 'fetchAmazonBids');
        TestHelper.stub(adManager, 'fetchIasTargeting');
        TestHelper.stub(adManager, 'setIndexTargetingForSlots');

        adManager.refreshSlots([stubSlot]);

        expect(adManager.googletag.pubads().updateCorrelator.called).to.be.true;
      });

      it('does not update the correlator when ad is eager loaded', function() {
        adManager = AdManagerWrapper.init({ iasEnabled: true });
        TestHelper.stub(adManager, 'fetchAmazonBids');
        TestHelper.stub(adManager, 'fetchIasTargeting');
        TestHelper.stub(adManager, 'setIndexTargetingForSlots');

        adManager.refreshSlots([eagerStubSlot]);

        expect(adManager.googletag.pubads().updateCorrelator.called).to.be.false;
      });
    });

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
        getSlots: function() {return []},
        updateCorrelator: sinon.spy()
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

