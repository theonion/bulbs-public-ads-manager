var MockGoogleTag = function MockGoogleTag () {
  this.enableServices = jest.fn();
  this.sizeMapping = jest.fn();
  this.cmd = [];
};

MockGoogleTag.prototype.content = () => {
  return {
    setContent: jest.fn(),
    addEventListener: jest.fn()
  };
};

MockGoogleTag.prototype.pubads = () => {
  return {
    collapseEmptyDivs: jest.fn(),
    enableSingleRequest: jest.fn(),
    enableAsyncRendering: jest.fn(),
    updateCorrelator: jest.fn(),
    setTargeting: jest.fn(),
    disableInitialLoad: jest.fn(),
    addEventListener: jest.fn(),
    refresh: jest.fn(),
    clear: jest.fn(),
    getSlots: jest.fn().mockImplementation(() => {
      return [{
        getSlotElementId: jest.fn(),
        getAdUnitPath: jest.fn()
      }];
    })
  };
};

MockGoogleTag.prototype.display = () => {};

MockGoogleTag.prototype.defineSlot = function (adUnitPath, size, elementId) {

  return {
    defineSizeMapping: jest.fn(),
    setTargeting: jest.fn(),
    addService: jest.fn(),
    getSlotId: jest.fn().mockImplementation(() => {
      return {
        getDomId: () => {
          return elementId;
        }
      };
    })
  };
};

module.exports = MockGoogleTag;
