var MockGoogleTag = function MockGoogleTag () {
  this.enableServices = function () {};
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
    addEventListener: function () {}
  };
};

module.exports = MockGoogleTag;
