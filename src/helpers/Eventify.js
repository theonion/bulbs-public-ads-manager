// DOM event helpers (abstracted from http://stackoverflow.com/questions/17720431/javascript-dispatchevent-is-not-working-in-ie9-and-ie10)

var Eventify = {
	
  /**
   * Returns 'on' + capitalized `str` for eventification (so _eventify('what') would return 'onWhat')
   *
   * @param {!string} str
   * @return {!string}
   */
  _eventify: function (str) {
    return 'on' + (str.charAt(0).toUpperCase() + str.slice(1));
  },

  // Other helpers
  /**
   * Bind a native JavaScript event to a DOM element
   * By default, this unbinds the callback after the first invocation (but this can change in the future)
   *
   * @param {!Element} node
   * @param {!string} eventName
   * @param {!Function} callback
   */
  bindDomEvent: function (node, eventName, callback) {
    if (node.addEventListener) {
      node.addEventListener(eventName, callback, false);
    } else {
      node[this._eventify(eventName)] = callback;
    }
  },

  triggerDomEvent: function (node, eventName) {
    var document = window.document,
      event = {};

    event = document.createEvent('HTMLEvents');
    event.initEvent(eventName, true, true);
    event.eventName = eventName;

    if (node.dispatchEvent) {
      node.dispatchEvent(event);
    } else if (node[eventName]) {
      node[eventName]();
    } else if (node[this._eventify(eventName)]) {
      node[this._eventify(eventName)]();
    }
  },

  unbindDomEvent: function (node, eventName, callback) {
    if (node.removeEventListener) {
      node.removeEventListener(eventName, callback, false);
    } else {
      node[this._eventify(eventName)] = null;
    }
  }
};
module.exports = Eventify;
