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

    expect(utils.hasClass(element, 'something')).to.be.true;
    expect(utils.hasClass(element, 'dfp')).to.be.false;
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
});
