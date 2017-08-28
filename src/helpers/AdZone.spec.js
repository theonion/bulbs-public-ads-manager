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
});
