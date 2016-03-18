var spies;
var stubs;
var promiseStub;
var eventStub;

eventStub = {
  preventDefault: sinon.stub(),
  stopPropagation: sinon.stub(),
  target: sinon.stub(),
  keyCode: 13 // Send enter keyCode by default
};

promiseStub = sinon.stub();
promiseStub.abort = function() {};
promiseStub.fail = function() {};
promiseStub.done = function() {};
promiseStub.always = function() {};
promiseStub.success = function() {};
promiseStub.error = function() {};
promiseStub.then = function() {};

sinon.stub(promiseStub, "abort").returns(promiseStub);
sinon.stub(promiseStub, "fail").returns(promiseStub);
sinon.stub(promiseStub, "done").returns(promiseStub);
sinon.stub(promiseStub, "always").returns(promiseStub);
sinon.stub(promiseStub, "success").returns(promiseStub);
sinon.stub(promiseStub, "error").returns(promiseStub);
sinon.stub(promiseStub, "then").returns(promiseStub);

function spyOn(object, method) {
  var spy = sinon.spy(object, method);
  spies.push(spy);
  return spy;
}

function stub(object, method, retVal) {
   var stub = sinon.stub(object, method).returns(retVal);
   stubs.push(stub);
   return stub;
}

var TestHelper = {
  spyOn: function(object, method) {
    var spy = sinon.spy(object, method);
    spies.push(spy);
    return spy;
  },

  stub: function(object, method, retVal) {
     var stub = sinon.stub(object, method).returns(retVal);
     stubs.push(stub);
     return stub;
  },

  click: function(el){
    var ev = document.createEvent("MouseEvent");
    ev.initMouseEvent(
      "click",
      true, true,
      window, null,
      0, 0, 0, 0,
      false, false, false, false,
      0, null
    );
    el.dispatchEvent(ev);
  }
};

beforeEach(function() {
  spies = [];
  stubs = [];
});

afterEach(function() {
  spies.forEach(function(spy) {
    spy.restore();
  });

  stubs.forEach(function(stub) {
    stub.restore();
  });
});

// PhantomJS does not support #bind until version 2.0
Function.prototype.bind = Function.prototype.bind || function (thisp) {
  var fn = this;
  return function () {
    return fn.apply(thisp, arguments);
  };
};

// PhantomJS doesn't like triggering click events
function click(el){
  var ev = document.createEvent("MouseEvent");
  ev.initMouseEvent(
    "click",
    true, true,
    window, null,
    0, 0, 0, 0,
    false, false, false, false,
    0, null
  );
  el.dispatchEvent(ev);
}

// PhantomJS also hates history (until 2.0...again) - https://github.com/ariya/phantomjs/issues/11100
if (window.navigator.userAgent.match(/PhantomJS/)) {
  history = window.history;
  oldPushState = history.pushState.bind(history);
  oldReplaceState = history.replaceState.bind(history);
  history.pushState = function(state, title, url) {
    history.state = state;
    return oldPushState(state, title, url);
  };
  history.replaceState = function(state, title, url) {
    history.state = state;
    return oldReplaceState(state, title, url);
  };
}
