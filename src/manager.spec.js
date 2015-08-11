describe('AdsManager', function () {

  var ads;

  beforeEach(function () {
    var MockGoogleTag = require('mockGoogleTag');

    window.googletag = new MockGoogleTag();

    ads = require('./manager.js');
    ads.init(false);
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

    el.innerHTML = '<div class="dfp" data-slot-name="testing"></div><div class="dfp" data-slot-name="testing-two"></div>';
    expect(ads.findAds(el).length).to.equal(2);

    el.innerHTML = '<section class="bullshit"><div class="dfp" data-ad-unit="testing"></div><div class="dfp" data-ad-unit="testing-two"></div></section>';
    expect(ads.findAds(el).length).to.equal(2);
  });
});
