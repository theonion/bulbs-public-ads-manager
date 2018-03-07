'use strict';

var AdUnits = {
  headerSlotRenderEnded: function() {}
};

AdUnits.units = {
  'campaign-pixel': {
    'eagerLoad': true,
    'sizes': [
      [[0, 0], [1, 1]]
    ]
  },

  'header': {
    'refreshDisabled': true,
    'eagerLoad': true,
    'slotName': 'header',
    'sizes': [
      [[970, 0], [[728, 90], [1,1], [970, 415], [970, 250], [970, 90], [1280, 720]]],
      [[728, 0], [[1,1], [728, 90], [1280, 720]]],
      [[0, 0], [[1,1], [320, 50], [300, 250], [1280, 720]]]
    ],
    onSlotRenderEnded: AdUnits.headerSlotRenderEnded,
    'prebid': {
      'bids': [
        {
          'bidder': 'appnexusAst',
          'params': {
            'placementId': '10433394', // magic ID that always returns an (unpaid) $0.50 bid
          }
        }
      ]
    }
  },

  'inbetween': {
    'slotName': 'header',
    'sizes': [
      [[728, 0], [[728, 90]]],
      [[0, 0], []]
    ]
  },

  'sidebar-primary': {
    'slotName': 'sidebar-primary',
    'refreshDisabled': true,
    'sizes': [
      [[1000, 0], [300, 250]],
      [[0, 0], []]
    ]
  },

  'mobile-only-cube': {
    'slotName': 'sidebar-primary',
    'sizes': [
      [[728, 0], []],
      [[0, 0], [300, 250]]
    ]
  },

  'sidebar-short-primary': {
    'slotName': 'sidebar-primary',
    'sizes': [
      [[600, 0], [300, 250]],
      [[0, 0], []]
    ]
  },

  'sidebar-secondary': {
    'slotName': 'sidebar-secondary',
    'sizes': [
      [[0, 0], [300, 250]]
    ]
  },

  'sidebar-tertiary': {
    'slotName': 'sidebar-tertiary',
    'sizes': [
      [[1240, 0], [300, 250]],
      [[0, 0], []]
    ]
  },

  'non-mobile-leaderboard': {
    'slotName': 'horizontal-secondary',
    'sizes': [
      [[728, 0], [728, 90]],
      [[0, 0], []]
    ]
  },

  'horizontal-secondary': {
    'slotName': 'horizontal-secondary',
    'sizes': [
      [[728, 0], [[728, 90]]],
      [[0, 0], [[320, 50]]]
    ]
  },

  'horizontal-tertiary': {
    'slotName': 'horizontal-tertiary',
    'sizes': [
      [[728, 0], [[728, 90]]],
      [[0, 0], [[320, 50]]]
    ]
  },

  'article-button': {
    'slotName': 'article-button',
    'sizes': [
      [[768, 0], [120, 60]],
      [[0, 0], []]
    ]
  },

  'inread': {
    'slotName': 'inread',
    'sizes': [
      [[728, 0], []],
      [[0,0], [[1,1], [300,250]]]
    ]
  },

  'instant-article-inread': {
    'eagerLoad': true,
    'slotName': 'instant-article-inread',
    'sizes': [
      [[0,0], [300,250]]
    ]
  }
};

module.exports = AdUnits;
