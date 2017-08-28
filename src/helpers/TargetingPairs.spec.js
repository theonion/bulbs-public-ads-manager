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
  	  TestHelper.stub(SocialReferrer, 'isSocialReferrer').returns(false);
  	  TestHelper.stub(PageDepth, 'getPageDepth').returns(1);
  	  window.kinja = {
  	  	meta: {
  	  		blog: { name: 'Onion' },
  	  		pageType: 'permalink'
  	  	},
  	  	postMeta: {}
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
    		var targeting = TargetingPairs.buildTargetingPairs(window);
    	  expect(targeting.pageOptions.exp_variation).to.equal('12345_A');
    	});
    });

    describe('social referrer is present', function() {
  	  beforeEach(function() {
  	    SocialReferrer.isSocialReferrer.returns(true);
  	  });

  	  it('provides the social referrer as slot option targeting', function() {
  	    var targeting = TargetingPairs.buildTargetingPairs(window);
  	    expect(targeting.slotOptions.socialReferrer).to.be.true;
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

    describe('tags are present', function() {
    	beforeEach(function() {
    	  window.kinja.postMeta.tags = 'foo,bar,baz';
    	});

      it('includes tags in the page option targeting', function() {
        var targeting = TargetingPairs.buildTargetingPairs(window);
        expect(targeting.pageOptions.tags).to.eql(['foo', 'bar', 'baz']);
      });
    });

    describe('blog name', function() {
	    it('includes blog name in the page option targeting', function() {
	    	var targeting = TargetingPairs.buildTargetingPairs(window);
	      expect(targeting.pageOptions.blogName).to.equal('Onion');
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
});
