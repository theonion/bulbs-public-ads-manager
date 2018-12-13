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

  describe('new AdManager', function() {
    it('- has no slots yet', function() {
      expect(adManager.slots).to.eql({});
    });
  });
});

