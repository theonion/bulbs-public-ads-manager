describe('SocialReferrer', function () {
  var SocialReferrer;

  beforeEach(function () {
    SocialReferrer = require('./SocialReferrer');
  });

  describe('#getSocialReferrer', function () {
    describe('test for facebook a social referrer', function () {
      beforeEach(function () {
        TestHelper.stub(SocialReferrer, 'getReferrer').returns('facebook.com');
      });

      it('this referrer should be a social one', function () {
        expect(SocialReferrer.getSocialReferrer()).to.equal('facebook');
      });
    });

    describe('test for instagram as a social referrer', function () {
      beforeEach(function () {
        TestHelper.stub(SocialReferrer, 'getReferrer').returns('instagram.com');

      });

      it('this referrer should be a social one', function () {
        expect(SocialReferrer.getSocialReferrer()).to.equal('instagram');
      });
    });

    describe('test for a non-social referrer', function () {
      beforeEach(function () {
        TestHelper.stub(SocialReferrer, 'getReferrer').returns('notathing.com');
      });

      it('this referrer should not be a social one', function () {
        expect(SocialReferrer.getSocialReferrer()).to.equal('');
      });
    });

  });
});
