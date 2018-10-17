const Feature = require('./Feature');

describe('Feature', function() {
  describe('#isOn', function() {
    beforeEach(function() {
      Feature.features = null;
      document.body.classList.add('f_testfeature_on');
    });

    afterEach(function() {
      document.body.classList.remove('f_testfeature_on');
    });

    it('returns the feature flag value from url query string when on', function() {
      expect(Feature.isOn('testfeature')).toEqual(true);
    });

    it('returns the feature flag value from url query string when off', function() {
      expect(Feature.isOn('featuredoesnotexist')).toEqual(false);
    });
  });

  describe('#features', function() {
    beforeEach(function() {
      document.body.classList.add('f_testfeature_on');
    });

    afterEach(function() {
      document.body.classList.remove('f_testfeature_on');
    });

    it('returns the list of active features', function() {
      expect(Feature.features).toEqual({"testfeature": "on"});
    });
  });
});
