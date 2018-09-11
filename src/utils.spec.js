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

  context('#extend', function() {
    it('extends an object', function() {
      var extendedObject = { foo: '1', bar: '2' };
      var objectWithOverrides = { foo: '3' };

      expect(utils.extend(extendedObject, objectWithOverrides).foo).to.equal('3');
    });
  });
});
