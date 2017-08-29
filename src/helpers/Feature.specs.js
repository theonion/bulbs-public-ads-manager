describe('Feature', function () {
  var Experiments;

  beforeEach(function () {
    Experiments = require('./Feature');
  });

  describe('#isOn', function () {

    beforeEach(function () {
      TestHelper.stub(Feature, 'locationSearch', '?testfeature=on');
    });

    it('returns the feature flag value from url query string when on', function () {
      expect(Feature.getQueryParameter('testfeature')).to.equal('on');
    });

    it('returns the feature flag value from url query string when off', function () {
      expect(Feature.getQueryParameter('featuredoesnotexist')).to.equal('off');
    });

  });


});
