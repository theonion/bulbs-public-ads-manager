var SocialReferrer = require('./SocialReferrer');

describe('SocialReferrer', function () {
  describe('#getSocialReferrer', function () {
    describe('test for facebook a social referrer', function () {
      beforeEach(function () {
        Object.defineProperty(window.document, 'referrer', {
          writable: true,
          value: 'facebook.com'
        });
      });

      it('this referrer should be a social one', function () {
        expect(SocialReferrer.getSocialReferrer()).toEqual('facebook');
      });
    });

    describe('test for instagram as a social referrer', function () {
      beforeEach(function () {
        Object.defineProperty(window.document, 'referrer', {
          writable: true,
          value: 'instagram.com'
        });
      });

      it('this referrer should be a social one', function () {
        expect(SocialReferrer.getSocialReferrer()).toEqual('instagram');
      });
    });

    describe('test for a non-social referrer', function () {
      beforeEach(function () {
        Object.defineProperty(window.document, 'referrer', {
          writable: true,
          value: 'notathing.com'
        });
      });

      it('this referrer should not be a social one', function () {
        expect(SocialReferrer.getSocialReferrer()).toEqual('');
      });
    });

  });
});
