describe('AdsManager', function () {

  var ads;
  var adUnits = require('bulbs.ads.units');
  var MockGoogleTag = require('mockGoogleTag');
  var sandbox = sinon.sandbox.create();

  beforeEach(function () {
    window.googletag = new MockGoogleTag();

    ads = require('./manager.js');
    ads.init();
  });

  afterEach(function () {
    sandbox.restore();
  });

  it('generates sequential ids', function () {
    // Might changes this in the future to not be ints
    expect(ads.generateId()).to.equal('dfp-ad-1');
    expect(ads.generateId()).to.equal('dfp-ad-2');
    expect(ads.generateId()).to.equal('dfp-ad-3');
  });

  it('can detect ad divs', function () {
    var adDiv = document.createElement('div');
    adDiv.className = 'something dfp dfp-ad';

    var notAdDiv = document.createElement('div');
    notAdDiv.className = 'something dfp-ad';

    expect(ads.isAd(adDiv)).to.equal(true);
    expect(ads.isAd(notAdDiv)).to.equal(false);
  });

  it('can find ad slots', function () {
    var el = document.createElement('div');

    el.innerHTML = '<div class="dfp" data-slot-name="testing"></div>';
    expect(ads.findAds(el).length).to.equal(1);

    el.innerHTML =
      '<div class="dfp" data-slot-name="testing"></div>' +
      '<div class="dfp" data-slot-name="testing-two"></div>';
    expect(ads.findAds(el).length).to.equal(2);

    el.innerHTML =
      '<section class="bullshit">' +
        '<div class="dfp" data-ad-unit="testing"></div>' +
        '<div class="dfp" data-ad-unit="testing-two"></div>' +
      '</section>';
    expect(ads.findAds(el).length).to.equal(2);
  });

  it('can find ads by CSS selector', function () {
    var el = document.createElement('div');

    el.innerHTML =
      '<section>'
        + '<div class="dfp" data-ad-unit="testing"></div>'
        + '<div class="dfp" data-ad-unit="testing"></div>'
      + '</section>'
      + '<section>'
        + '<div class="dfp" data-ad-unit="testing"></div>'
        + '<div class="dfp" data-ad-unit="testing"></div>'
      + '</section>';

    document.body.appendChild(el);

    expect(ads.findAds('section .dfp').length).to.equal(4);
  });

  it('should use the dfpSite setting from bulbs.ads.units', function () {
    expect(adUnits.settings.dfpSite).to.equal(ads.targeting.dfp_site);
  });

  describe('resize event listener', function () {

    var resizeEvent;
    var setTimeout;

    beforeEach(function () {
      resizeEvent = document.createEvent('UIEvents');
      resizeEvent.initUIEvent('resize', false, true, window);

      setTimeout = sandbox.stub(window, 'setTimeout');
      ads.reloadAds = sandbox.stub();
    });

    it('should reload ads when reload on resize setting is true', function () {
      ads.reloadOnResize(true);
      window.dispatchEvent(resizeEvent);

      var resizeCallback = setTimeout.getCall(0).args[0];
      resizeCallback();

      expect(ads.reloadAds.calledOnce).to.equal(true);
    });

    it('should not reload ads when reload on resize setting is false', function () {
      ads.reloadOnResize(false);
      window.dispatchEvent(resizeEvent);

      expect(setTimeout.calledOnce).to.equal(false);
      expect(ads.reloadAds.calledOnce).to.equal(false);
    });
  });

});
