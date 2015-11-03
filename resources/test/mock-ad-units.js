/**
 * This file defines all ad units used on the site. The format of the config is:
 *
 *  '<ad unit name>': {
 *    'slotName': <name>,
 *    'sizes': <sizes>,
 *    'onSlotRenderEnded': <function (event, element)>
 *  }
 *
 * Where:
 *  - {string} name - Name that slot is referenced by when loading ads.
 *  - {array} sizes - attribute is a list of ad sizes, which can be passed
 *      directly to `slot.defineSizeMapping()` (https://developers.google.com/doubleclick-gpt/reference#googletag.Slot_defineSizeMapping).
 *  - {function} onSlotRenderEnded - function that takes an event and element,
 *      where element is the ad container. Fires when an ad slot has finished rendering.
 */

module.exports = {

  settings: {
    dfpSite: 'onion',
    screenDistanceLoadThreshload: 100
  },

  units: {

    'header': {
      slotName: 'header',
      sizes: [
        [[970, 0], [[728, 90], [970, 250], [970, 90], [970, 415]]],
        [[728, 0], [728, 90]],
        [[0, 0], [320, 50]]
      ]
    },

    'article-header': {
      slotName: 'header',
      sizes: [
        [[970, 0], [[728, 90], [970, 250]]],
        [[728, 0], [728, 90]],
        [[0, 0], [320, 50]]
      ]
    },

    'sidebar-primary': {
      sizes: [
        [[0, 0], [300, 250]]
      ]
    },

    'sidebar-secondary': {
      sizes: [
        [[0, 0], [300, 250]]
      ]
    },

    'sidebar-tertiary': {
      sizes: [
        [[0, 0], [300, 250]]
      ]
    }
  }
};
