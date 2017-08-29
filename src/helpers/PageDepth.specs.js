describe('PageDepth', function () {
  var PageDepth;

  beforeEach(function () {
    PageDepth = require('./PageDepth');
  });

  describe('#getPageDepth', function () {
    describe('test cookie page depth value of 1', function () {
      beforeEach(function () {
        window.document.cookie = 'pageDepth=' + '1' + '; expires=1; path=/';
      });

      afterEach(function () {
        window.document.cookie = '';
      });

      it('it should return a page depth of 1', function () {
        expect(PageDepth.getPageDepth()).to.equal('1');
      });
    });

    describe('test cookie page depth value of 2', function () {
      beforeEach(function () {
        window.document.cookie = 'pageDepth=' + '2' + '; expires=1; path=/';
      });

      afterEach(function () {
        window.document.cookie = '';
      });

      it('it should return a page depth of 1', function () {
        expect(PageDepth.getPageDepth()).to.equal('2');
      });
    });

  });
});
