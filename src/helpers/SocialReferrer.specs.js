describe('SocialReferrer', function() {
  var PageDepth;

  beforeEach(function() {
    PageDepth = require('./SocialReferrer');
  });

  describe('#getPageDepth', function() {
    describe('test for facebook a social referrer', function() {
      beforeEach(function() {
        window.document.referrer = "facebook.com";
      });

      afterEach(function() {
        window.document.referrer = "";
      });

      it('this referrer should be a social one', function() {
        expect(SocialReferrer.isSocialReferrer()).to.equal('true');
      });
    });
	
    describe('test for instagram as a social referrer', function() {
      beforeEach(function() {
        window.document.referrer = "instagram.com";
      });

      afterEach(function() {
        window.document.referrer = "";
      });

      it('this referrer should be a social one', function() {
        expect(SocialReferrer.isSocialReferrer()).to.equal('true');
      });
    });

    describe('test for a non-social referrer', function() {
        beforeEach(function() {
          window.document.referrer = "";
        });

        afterEach(function() {
          window.document.referrer = "";
        });

      it('this referrer should not be a social one', function() {
        expect(SocialReferrer.isSocialReferrer()).to.equal('false');
      });
    });

  });
});
