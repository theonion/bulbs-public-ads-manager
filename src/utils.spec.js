describe('Utils', function () {

  var utils;
  var element;

  beforeEach(function () {
    utils = require('./utils');

    element = document.createElement('div');
    document.body.appendChild(element);
  });

  it('should emit custom events', function () {
    var element = document.createElement('div');
    var spy = sinon.spy();
    element.addEventListener('coolEvent', spy);
    utils.dispatchEvent(element, 'coolEvent');
    expect(spy).to.have.been.called;
  });
});