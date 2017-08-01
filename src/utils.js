/**
 * Utility functions for ad loading because we want to load the ads module ASAP,
 *  before any other JS libs that might provide these functions.
 */
var Utils = {

  /**
   * Extend given object by given non-parameterized arguments.
   *
   * @param {object} out - object to extend.
   * @returns {object} extended object.
   */
  extend: function (out) {
    out = out || {};

    for (var i = 1; i < arguments.length; i++) {
      if (!arguments[i])
        continue;

      for (var key in arguments[i]) {
        if (arguments[i].hasOwnProperty(key))
          out[key] = arguments[i][key];
      }
    }

    return out;
  },

  dispatchEvent: function (el, eventName) {
    var customEvent;
    try {
      customEvent = new window.CustomEvent(eventName, {
        bubbles: true,
        cancelable: true
      });
    } catch (e) {
      customEvent = document.createEvent('Event');
      customEvent.initEvent(eventName, true, true);
    }
    el.dispatchEvent(customEvent);
  },

  /**
   * Method that checks emptiness for a given zone
   * @param {Element} slot - element to check.
   * @param {object} gptData - Object containing the slot data
   */
  isAdZoneEmpty: function (slot, gptData) {
    if (gptData.isEmpty) {
      return true;
    }
    var iframes = slot.getElementsByTagName('iframe'),
      adIframe,
      iframeDocument,
      adBody,
      elementsWithSrc,
      // Collapser gifs trafficked in to collapse ad zones.
      r817 = /817-(grey|grey_|blank|blank_)\.gif/,
      rBlank = /ads\/collapser.gif/;


    if (iframes && iframes.length > 0) {
      adIframe = iframes[0];
      if (adIframe.getAttribute('src') && adIframe.getAttribute('src').indexOf('safeframe') > -1) {
        return false;
      }
      iframeDocument = adIframe.contentDocument || adIframe.contentWindow.document;
      adBody = iframeDocument.getElementsByTagName('body');
      if (adBody && adBody.length > 0) {
        adBody = adBody[0];
        if (adBody.childElementCount > 0) {
          elementsWithSrc = adBody.querySelectorAll('[src]');
          if (elementsWithSrc && elementsWithSrc.length > 0) {
            // Convert NodeList to Array
            elementsWithSrc = Array.prototype.slice.call(elementsWithSrc);
            elementsWithSrc = elementsWithSrc.filter(function (element) {
              if (element && element.src && (element.src.match(r817) || element.src.match(rBlank))) {
                return true;
              }
              return false;
            });
            if (elementsWithSrc.length > 0) {
              // The slot has a collapser image
              return true;
            }
          }
        } else {
          // the slot's iframe body doesn't have any children
          return true;
        }
      } else {
        // the slot's iframe doesn't have a body
        return true;
      }
    } else {
      // the ad iframe doesn't exist
      return true;
    }
    return false;
  }
};

module.exports = Utils;
