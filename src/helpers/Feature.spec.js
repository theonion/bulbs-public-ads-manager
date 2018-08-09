describe('Feature', function() {
  var Feature;

  describe('#isOn', function() {
    beforeEach(function() {
      Feature = require('./Feature');
      Feature.features = null;
      document.body.classList.add('f_testfeature_on');
    });

    afterEach(function() {
      document.body.classList.remove('f_testfeature_on');
    });

    it('returns the feature flag value from url query string when on', function() {
      expect(Feature.isOn('testfeature')).to.be.true;
    });

    it('returns the feature flag value from url query string when off', function() {
      expect(Feature.isOn('featuredoesnotexist')).to.be.false;
    });

  });


});
