describe('AdZone', function() {
	var AdZone;

  beforeEach(function() {
    AdZone = require('./AdZone');
  });

  describe('#getQueryParameter', function() {
  	describe('with query string param', function() {
  	 beforeEach(function() {
  	   TestHelper.stub(AdZone, 'locationSearch', '?adzone=foo');
  	 });

  	 it('returns the query param value', function() {
  	   expect(AdZone.getQueryParameter('adzone')).to.equal('foo');
  	 });

  	});

  	describe('with no query string params', function() {
  	  it('returns an empty string if missing query param', function() {
			  TestHelper.stub(AdZone, 'locationSearch', '?adzone=foo');
			  expect(AdZone.getQueryParameter('missing')).to.equal('');
  	  });

  	  it('returns an empty string if completely empty params', function() {
  	    TestHelper.stub(AdZone, 'locationSearch', '');
			  expect(AdZone.getQueryParameter('missing')).to.equal('');
  	  });
  	});
  });

  describe('#forcedAdZone', function() {
    describe('forced ad zone query param present', function() {
      beforeEach(function() {
        TestHelper.stub(AdZone, 'locationSearch', '?adzone=foo');
        window.kinja = {};
      });

      it('returns the forced ad zone param', function() {
        expect(AdZone.forcedAdZone()).to.equal('foo');
      });
    });

    describe('forced collapsed zone specified based on blog rule', function() {
    	beforeEach(function() {
        TestHelper.stub(AdZone, 'locationSearch', '');
        window.kinja = {
        	postMeta: {
        		tags: ['gamergate, foo, bar, baz']
        	}
        };
      });

      it('returns blog rule forced ad zone', function() {
        expect(AdZone.forcedAdZone()).to.equal('collapse');
      });

      it('returns blog rule forced ad zone only if no - non collapse', function() {
        window.kinja.postMeta.tags.push('wyts');
        expect(AdZone.forcedAdZone()).to.be.null;
      });
    });

    describe('post has specific forced ad zone', function() {
    	beforeEach(function() {
        TestHelper.stub(AdZone, 'locationSearch', '');
        window.kinja = {
        	postMeta: {
        		tags: [],
        		post: {
        			adZone: 'someThing'
        		}
        	}
        };
      });

      it('returns blog rule forced ad zone', function() {
        expect(AdZone.forcedAdZone()).to.equal('someThing');
      });
    });
  });
});
