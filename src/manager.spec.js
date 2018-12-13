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

