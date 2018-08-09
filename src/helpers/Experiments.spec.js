describe('Experiments', function() {
  var Experiments;
  var Feature;

  beforeEach(function() {
    Feature = require('./Feature');
    Feature.features = null;
    Experiments = require('./Experiments');
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
        expect(Experiments.getExperimentVariation()).to.equal('A');
      });

      it('returns number instead of letter, if enable_experiments enabled', () => {
        sinon.stub(Feature, 'isOn').returns(true);
        expect(Experiments.getExperimentVariation()).to.equal(0);
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
        expect(Experiments.getExperimentVariation()).to.equal('B');
      });
    });

    describe('no chosen variation', function() {
			beforeEach(function() {
        window.cxApi = undefined;
      });

      it('returns null', function() {
        expect(Experiments.getExperimentVariation()).to.be.null;
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
        expect(Experiments.getExperimentId()).to.equal('456');
      });
    });

    describe('overridden scope', function() {
    	var scopeOverride;

      it('uses overridden scope if available', function() {
        expect(Experiments.getExperimentId({ gaExperimentId: '123' })).to.equal('123');
      });
    });

    describe('no experiment id', function() {
    	it('should be null', function() {
	      expect(Experiments.getExperimentId()).to.be.null;
    	});
    });
  });
});
