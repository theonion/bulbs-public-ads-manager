describe('Utils', function () {

  var utils;
  var element;

  beforeEach(function () {
    utils = require('./utils');

    element = document.createElement('div');
    document.body.appendChild(element);
  });

  it('should have a function to check if an element has a class', function () {
    element.className = 'something dfp-ad';

    expect(utils.hasClass(element, 'something')).to.equal(true);
    expect(utils.hasClass(element, 'dfp')).to.equal(false);
  });

  it('should have a function to remove a class frome an element', function () {
    element.className = 'onetwothree one two three';

    utils.removeClass(element, 'two');

    expect(element.className).to.equal('onetwothree one three');
  });

  it('should have a function to add a class to an element', function () {
    element.className = 'dfp ads';

    utils.addClass(element, 'yay');

    expect(element.className).to.equal('dfp ads yay');
  });

  it('should be able to tell if an element is close to the viewport', function () {
    var innerHeight = window.innerHeight;

    expect(utils.elementNearViewport(element, { withinDistance: 0 })).to.equal(true);

    element.style.position = 'absolute';
    element.style.top = innerHeight + 1 + 'px';

    expect(utils.elementNearViewport(element, { withinDistance: 0 })).to.equal(false);

    element.style.top = innerHeight + 100 + 'px';

    expect(utils.elementNearViewport(element, { withinDistance: 0})).to.equal(false);
    expect(utils.elementNearViewport(element, { withinDistance: 100 })).to.equal(true);

    element.style.top = '-200px';

    expect(utils.elementNearViewport(element, { withinDistance: 100})).to.equal(false);
    expect(utils.elementNearViewport(element, { withinDistance: 201})).to.equal(true);
  });
});
