var utils = require('./utils');

describe('Utils', function () {
  beforeEach(function () {
    var element = document.createElement('div');
    document.body.appendChild(element);
  });

  it('should emit custom events', function () {
    var element = document.createElement('div');
    var spy = jest.fn();
    element.addEventListener('coolEvent', spy);
    utils.dispatchEvent(element, 'coolEvent');
    expect(spy).toHaveBeenCalled();
  });

  describe('#extend', function() {
    it('extends an object', function() {
      var extendedObject = { foo: '1', bar: '2' };
      var objectWithOverrides = { foo: '3' };

      expect(utils.extend(extendedObject, objectWithOverrides).foo).toEqual('3');
    });
  });
});
