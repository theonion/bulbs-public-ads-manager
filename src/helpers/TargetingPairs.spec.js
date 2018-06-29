var Experiments = require('./Experiments');
var SocialReferrer = require('./SocialReferrer');
var PageDepth = require('./PageDepth');

describe('TargetingPairs', function() {
  var TargetingPairs;

  beforeEach(function() {
    TargetingPairs = require('./TargetingPairs');
  });

  describe('#buildTargetingPairs', function() {
  	beforeEach(function() {
  	  TestHelper.stub(Experiments, 'getExperimentVariation').returns('null');
  	  TestHelper.stub(Experiments, 'getExperimentId').returns('null');
  	  TestHelper.stub(SocialReferrer, 'getSocialReferrer').returns('');
  	  TestHelper.stub(PageDepth, 'getPageDepth').returns(1);
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
    	beforeEach(function() {
    	  Experiments.getExperimentVariation.returns('A');
    	  Experiments.getExperimentId.returns('12345');
    	});

    	it('provides experiment info as targeting keys', function() {
      	  var positionTargeting = 'top',
    		targeting = TargetingPairs.buildTargetingPairs(window, positionTargeting);
    	  expect(targeting.slotOptions.exp_variation).to.equal('12345_A_top');
    	});
    });

    describe('social referrer is present', function() {
  	  beforeEach(function() {
  	    SocialReferrer.getSocialReferrer.returns('facebook');
  	  });

  	  it('provides the social referrer as slot option targeting', function() {
  	    var targeting = TargetingPairs.buildTargetingPairs(window);
  	    expect(targeting.slotOptions.socialReferrer).to.equal('facebook');
  	  });
    });

    describe('post id present', function() {
      beforeEach(function() {
        window.kinja.postMeta.postId = '1234';
      });

      it('includes the post id in the slot option targeting', function() {
        var targeting = TargetingPairs.buildTargetingPairs(window);
        expect(targeting.slotOptions.postId).to.equal('1234');
      });
    });

    describe('page type', function() {
      it('includes the page type in the slot option targeting', function() {
        var targeting = TargetingPairs.buildTargetingPairs(window);
        expect(targeting.slotOptions.page).to.equal('permalink');
      });
    });

    describe('page depth present', function() {
      it('includes page depth in the slot option targeting', function() {
        var targeting = TargetingPairs.buildTargetingPairs(window);
        expect(targeting.slotOptions.pd).to.equal(1);
      });
    });

    describe('post tags are present', function() {
    	beforeEach(function() {
    	  window.kinja.postMeta.tags = 'foo,bar,baz';
    	});

      it('includes tags in the page option targeting', function() {
        var targeting = TargetingPairs.buildTargetingPairs(window);
        expect(targeting.pageOptions.tags).to.eql(['foo', 'bar', 'baz']);
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
        expect(targeting.pageOptions.tags).to.eql(['racing']);
      });
    });

    describe('blog name', function() {
	    it('includes blog name in the page option targeting', function() {
	    	var targeting = TargetingPairs.buildTargetingPairs(window);
	      expect(targeting.pageOptions.blogName).to.equal('Onion');
	    });
    });

    describe('category on post targeting', function() {
      it('includes single category when on post meta', function() {
        window.kinja.postMeta.categories = 'review';
        var targeting = TargetingPairs.buildTargetingPairs(window);
        expect(targeting.pageOptions.category).to.eql(['review']);
      });

      it('includes multiple categories when on post meta', function() {
        window.kinja.postMeta.categories = 'review,cars';
        var targeting = TargetingPairs.buildTargetingPairs(window);
        expect(targeting.pageOptions.category).to.eql(['review', 'cars']);
      });
    });

    describe('category on category page', function() {
      it('includes single category when on story type page', function() {
        window.kinja.categoryMeta.categories = 'review';
        var targeting = TargetingPairs.buildTargetingPairs(window);
        expect(targeting.pageOptions.category).to.eql(['review']);
      });

      it('includes multiple categories when on category page', function() {
        window.kinja.categoryMeta.categories = 'review,cars';
        var targeting = TargetingPairs.buildTargetingPairs(window);
        expect(targeting.pageOptions.category).to.eql(['review', 'cars']);
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
		      expect(targeting.pageOptions.ksg).to.equal('123,456');
        });

        it('includes Krux kuid in page option targeting', function() {
          var targeting = TargetingPairs.buildTargetingPairs(window);
		      expect(targeting.pageOptions.kuid).to.equal('abc');
        });
      });

      describe('segments and user not present', function() {
      	beforeEach(function() {
      	  window.Krux = {};
      	});

      	it('does not include Krux segment in page option targeting', function() {
      	  var targeting = TargetingPairs.buildTargetingPairs(window);
		      expect(targeting.pageOptions.ksg).to.be.undefined;
      	});

      	it('does not include Krux user in page option targeting', function() {
      	  var targeting = TargetingPairs.buildTargetingPairs(window);
		      expect(targeting.pageOptions.kuid).to.be.undefined;
      	});
      });

      describe('Krux not on the page', function() {
        beforeEach(function() {
          window.Krux = undefined;
        });

        it('does not include Krux segment in page option targeting', function() {
      	  var targeting = TargetingPairs.buildTargetingPairs(window);
		      expect(targeting.pageOptions.ksg).to.be.undefined;
      	});

      	it('does not include Krux user in page option targeting', function() {
      	  var targeting = TargetingPairs.buildTargetingPairs(window);
		      expect(targeting.pageOptions.kuid).to.be.undefined;
      	});
      });
    });
  });

  describe('#getTargetingPairs', function() {
    beforeEach(function() {
      TestHelper.stub(TargetingPairs, 'buildTargetingPairs').returns({
        pageOptions: {
          blogName: 'Onion'
        }
      });
    });

    context('without forced ad zone', function() {
      it('sets forced ad zone as false', function() {
        var pairs =  TargetingPairs.getTargetingPairs();
        expect(pairs.pageOptions.forcedAdZone).to.be.false;
      });
    });

    context('with forced ad zone', function() {
      it('uses forced ad zone', function() {
        var pairs =  TargetingPairs.getTargetingPairs('advertiser');
        expect(pairs.pageOptions.forcedAdZone).to.equal('advertiser');
      });
    });

    context('forced adzone exists but missing scope.kinja', function () {
      beforeEach(function () {
        delete window.kinja;
      });

      it('returns an object with a pageOptions.forcedAdZone property', function () {
        var pairs =  TargetingPairs.getTargetingPairs('advertiser');
        expect(pairs.pageOptions.forcedAdZone).to.equal('advertiser');
      });
    });

    context('missing scope.kinja', function() {
      beforeEach(function() {
        delete window.kinja
      });

      it('never tries to call buildTargetingPairs', function() {
        expect(TargetingPairs.buildTargetingPairs.called).to.be.false;
      });

      it('returns an empty object', function() {
        expect(TargetingPairs.getTargetingPairs()).to.eql({});
      });
    });
  });
});
