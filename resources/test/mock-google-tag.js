var MockGoogleTag = function MockGoogleTag () {
  this.enableServices = function () {};
  this.sizeMapping = function() {};
  this.cmd = [];
};

MockGoogleTag.prototype.content = function () {
  return {
    setContent: function () {},
    addEventListener: function () {}
  };
};

MockGoogleTag.prototype.pubads = function () {
  return {
    collapseEmptyDivs: function () {},
    enableSingleRequest: function () {},
    disableInitialLoad: function () {},
    addEventListener: function () {},
    refresh: function () {},
    clear: function () {},
    getSlots: function() {
      return [{
          getSlotElementId: function () {},
          getAdUnitPath: function () {}
      }];
    }
  };
};

MockGoogleTag.prototype.display = function () {};

MockGoogleTag.prototype.defineSlot = function (adUnitPath, size, elementId) {

  return {
    defineSizeMapping: function () {},
    setTargeting: function () {},
    addService: function () {},
    getSlotId: function () {
      return {
        getDomId: function () {
          return elementId;
        }
      };
    }
  };
};

module.exports = MockGoogleTag;
