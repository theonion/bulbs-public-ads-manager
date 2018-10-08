const Experiments = require('./Experiments');
const Feature = require('./Feature');

describe('Experiments', function() {
  beforeEach(function() {
    Feature.features = null;
  });

  describe('#getExperimentVariation', function() {
    describe('uses window gaVariation if available', function() {
      beforeEach(function() {
        window.gaExperimentId = '456';
        window.gaVariation = 0;
        window.cxApi = undefined;
      });

      afterEach(() => {
        window.gaExperimentId = undefined;
        window.gaVariation = undefined;
      });

      it('returns letter A', function () {
        expect(Experiments.getExperimentVariation()).toEqual('A');
      });

      it('returns number instead of letter, if enable_experiments enabled', () => {
        sinon.stub(Feature, 'isOn').returns(true);
        expect(Experiments.getExperimentVariation()).toEqual(0);
        Feature.isOn.restore();
      });
    });

    describe('chosen variation', function() {
      beforeEach(function() {
        window.gaExperimentId = '1234';
        window.cxApi = {
          getChosenVariation: sinon.stub().returns(1)
        };
      });

      it('returns letter B', function() {
        expect(Experiments.getExperimentVariation()).toEqual('B');
      });
    });

    describe('no chosen variation', function() {
      beforeEach(function() {
        window.cxApi = undefined;
      });

      it('returns null', function() {
        expect(Experiments.getExperimentVariation()).toEqual(null);
      });
    });
  });

  describe('#getExperimentId', function() {
    describe('default scope of window', function() {
      beforeEach(function() {
        window.gaExperimentId = '456';
      });

      afterEach(function() {
        window.gaExperimentId = undefined;
      });

      it('checks for scope on window by default', function() {
        expect(Experiments.getExperimentId()).toEqual('456');
      });
    });

    describe('overridden scope', function() {
      var scopeOverride;

      it('uses overridden scope if available', function() {
        expect(Experiments.getExperimentId({ gaExperimentId: '123' })).toEqual('123');
      });
    });

    describe('no experiment id', function() {
      it('should be null', function() {
        expect(Experiments.getExperimentId()).toEqual.null;
      });
    });
  });
});
