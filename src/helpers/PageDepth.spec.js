const PageDepth = require('./PageDepth');

describe('PageDepth', function() {
  describe('#getPageDepth', function() {
    describe('test cookie page depth value of 1', function() {
      beforeEach(function() {
        window.document.cookie = 'pageDepth=' + '0' + '; expires=1; path=/';
      });

      afterEach(function() {
        window.document.cookie = '';
      });

      it('it should increment and return a page depth of 1', function() {
        PageDepth.setPageDepth();
        expect(PageDepth.getPageDepth()).toEqual(1);
      });
    });

    describe('test cookie page depth value of 2', function() {
      beforeEach(function() {
        window.document.cookie = 'pageDepth=' + '1' + '; expires=1; path=/';
      });

      afterEach(function() {
        window.document.cookie = '';
      });

      it('it should increment and return a page depth of 2', function() {
        PageDepth.setPageDepth();
        expect(PageDepth.getPageDepth()).toEqual(2);
      });
    });

  });
});
