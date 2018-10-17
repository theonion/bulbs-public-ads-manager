var TargetingPairs = require('./TargetingPairs');
var Experiments = require('./Experiments');
var PageDepth = require('./PageDepth');
var SocialReferrer = require('./SocialReferrer');

jest.mock('./Experiments');
jest.mock('./PageDepth');
jest.mock('./SocialReferrer');

describe('TargetingPairs', function() {
  describe('#buildTargetingPairs', function() {
    beforeEach(function() {
      window.kinja = {
        meta: {
          blog: { name: 'Onion' },
          pageType: 'permalink'
        },
        postMeta: {},
        categoryMeta: {},
      };
      window.Krux = {
        segments: ['123', '456'],
        user: 'foo'
      }
    });

    describe('experiment is present', function() {
      it('provides experiment info as targeting keys', function() {
        Experiments.getExperimentVariation.mockReturnValueOnce('A');
        Experiments.getExperimentId.mockReturnValueOnce('12345');
        SocialReferrer.getSocialReferrer.mockResolvedValueOnce('');

        const positionTargeting = 'top';

        const windowStub = {
          kinja: {
            meta: {
              blog: { name: 'Onion' },
              pageType: 'permalink'
            },
            postMeta: {},
            categoryMeta: {},
          }
        };

        const targeting = TargetingPairs.buildTargetingPairs(windowStub, positionTargeting);

        expect(targeting.slotOptions.exp_variation).toEqual('12345_A_top');
      });
    });

    describe('social referrer is present', function() {
      it('provides the social referrer as slot option targeting', function() {
        SocialReferrer.getSocialReferrer.mockReturnValueOnce('facebook');
        var targeting = TargetingPairs.buildTargetingPairs(window);
        expect(targeting.slotOptions.socialReferrer).toEqual('facebook');
      });
    });

    describe('post id present', function() {
      beforeEach(function() {
        window.kinja.postMeta.postId = '1234';
      });

      it('includes the post id in the slot option targeting', function() {
        var targeting = TargetingPairs.buildTargetingPairs(window);
        expect(targeting.slotOptions.postId).toEqual('1234');
      });
    });

    describe('page type', function() {
      it('includes the page type in the slot option targeting', function() {
        var targeting = TargetingPairs.buildTargetingPairs(window);
        expect(targeting.slotOptions.page).toEqual('permalink');
      });
    });

    describe('page depth present', function() {
      it('includes page depth in the slot option targeting', function() {
        PageDepth.getPageDepth.mockReturnValueOnce(1);
        var targeting = TargetingPairs.buildTargetingPairs(window);
        expect(targeting.slotOptions.pd).toEqual(1);
      });
    });

    describe('post tags are present', function() {
      beforeEach(function() {
        window.kinja.postMeta.tags = 'foo,bar,baz';
      });

      it('includes tags in the page option targeting', function() {
        var targeting = TargetingPairs.buildTargetingPairs(window);
        expect(targeting.pageOptions.tags).toEqual(['foo', 'bar', 'baz']);
      });
    });

    describe('on the tag page', function() {
      beforeEach(function() {
        window.kinja.postMeta = {};
        window.kinja.tagMeta = {
          tags: 'racing'
        };
      });

      it('includes tags in the page option targeting', function() {
        var targeting = TargetingPairs.buildTargetingPairs(window);
        expect(targeting.pageOptions.tags).toEqual(['racing']);
      });
    });

    describe('blog name', function() {
      it('includes blog name in the page option targeting', function() {
        var targeting = TargetingPairs.buildTargetingPairs(window);
        expect(targeting.pageOptions.blogName).toEqual('Onion');
      });
    });

    describe('category on post targeting', function() {
      it('includes single category when on post meta', function() {
        window.kinja.postMeta.categories = 'review';
        var targeting = TargetingPairs.buildTargetingPairs(window);
        expect(targeting.pageOptions.category).toEqual(['review']);
      });

      it('includes multiple categories when on post meta', function() {
        window.kinja.postMeta.categories = 'review,cars';
        var targeting = TargetingPairs.buildTargetingPairs(window);
        expect(targeting.pageOptions.category).toEqual(['review', 'cars']);
      });
    });

    describe('category on category page', function() {
      it('includes single category when on story type page', function() {
        window.kinja.categoryMeta.categories = 'review';
        var targeting = TargetingPairs.buildTargetingPairs(window);
        expect(targeting.pageOptions.category).toEqual(['review']);
      });

      it('includes multiple categories when on category page', function() {
        window.kinja.categoryMeta.categories = 'review,cars';
        var targeting = TargetingPairs.buildTargetingPairs(window);
        expect(targeting.pageOptions.category).toEqual(['review', 'cars']);
      });
    });


    describe('Krux', function() {
      beforeEach(function() {
        window.Krux = {
          segments: '123,456',
          user: 'abc'
        };
      });

      describe('segments and user present', function() {
        it('includes Krux segment in page option targeting', function() {
          var targeting = TargetingPairs.buildTargetingPairs(window);
          expect(targeting.pageOptions.ksg).toEqual('123,456');
        });

        it('includes Krux kuid in page option targeting', function() {
          var targeting = TargetingPairs.buildTargetingPairs(window);
          expect(targeting.pageOptions.kuid).toEqual('abc');
        });
      });

      describe('segments and user not present', function() {
        beforeEach(function() {
          window.Krux = {};
        });

        it('does not include Krux segment in page option targeting', function() {
          var targeting = TargetingPairs.buildTargetingPairs(window);
          expect(targeting.pageOptions.ksg).toBe(undefined);
        });

        it('does not include Krux user in page option targeting', function() {
          var targeting = TargetingPairs.buildTargetingPairs(window);
          expect(targeting.pageOptions.kuid).toBe(undefined);
        });
      });

      describe('Krux not on the page', function() {
        beforeEach(function() {
          window.Krux = undefined;
        });

        it('does not include Krux segment in page option targeting', function() {
          var targeting = TargetingPairs.buildTargetingPairs(window);
          expect(targeting.pageOptions.ksg).toBe(undefined);
        });

        it('does not include Krux user in page option targeting', function() {
          var targeting = TargetingPairs.buildTargetingPairs(window);
          expect(targeting.pageOptions.kuid).toBe(undefined);
        });
      });
    });
  });

  describe('#getTargetingPairs', function() {
    describe('without forced ad zone', function() {
      it('sets forced ad zone as false', function() {
        var pairs =  TargetingPairs.getTargetingPairs();
        expect(pairs.pageOptions.forcedAdZone).toEqual(false);
      });
    });

    describe('with forced ad zone', function() {
      it('uses forced ad zone', function() {
        var pairs =  TargetingPairs.getTargetingPairs('advertiser');
        expect(pairs.pageOptions.forcedAdZone).toEqual('advertiser');
      });
    });

    describe('forced adzone exists but missing scope.kinja', function () {
      beforeEach(function () {
        delete window.kinja;
      });

      it('returns an object with a pageOptions.forcedAdZone property', function () {
        var pairs = TargetingPairs.getTargetingPairs('advertiser');
        expect(pairs.pageOptions.forcedAdZone).toEqual('advertiser');
      });
    });

    describe('missing scope.kinja', function() {
      beforeEach(function() {
        delete window.kinja;
      });

      it('returns an empty object and doesn\'t call buildTargetingPairs', function() {
        var spy = jest.spyOn(TargetingPairs, 'buildTargetingPairs');
        expect(TargetingPairs.getTargetingPairs()).toEqual({});
        expect(spy).not.toHaveBeenCalled();
      });
    });
  });
});
