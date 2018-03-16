var pbjs = require('../src/prebid-load.js');
var Admanager = require('../src/manager.js');

var AdUnits = {};

AdUnits.pbjsSizeConfig = [
  {
    'mediaQuery': '(min-width: 0px) and (max-width: 727px)',
    'labels': ['mobile', 'mobile_sticky'],
  },
  {
    'mediaQuery': '(min-width: 728px) and (max-width: 767px)',
    'labels': ['mobile', 'desktop_sticky'],
  },
  {
    'mediaQuery': '(min-width: 768px) and (max-width: 961px)',
    'labels': ['mobile'],
  },
  {
    'mediaQuery': '(min-width: 962px)',
    'labels': ['desktop'],
  },
];

AdUnits.units = {
  'btf-300-flex': {
    'eagerLoad': true,
    'refreshDisabled': true,
    'pbjsEnabled': true,
    'slotName': 'btf-300-flex',
    'sizes': [
      [[962, 0], [[300, 250], [300, 600]]],
      [[0, 0], [[300, 250]]],
    ],
    'prebid': {
      'bids': [
        {
          'bidder': 'appnexus',
          'labelAll': ['desktop'],
          'params': {
            'placementId': '10433394'
          },
        },
        {
          'bidder': 'appnexus',
          'labelAll': ['mobile'],
          'params': {
            'placementId': '10433394'
          },
        },
      ],
    },
  },
};

window.Admanager = Admanager.init({
  adUnits: AdUnits,
  dfpId: '4246/torn.reductress',
  doReloadOnResize: false,
  amazonEnabled: true,
  prebidEnabled: true,
  prebidTimeout: 1500,
  enableSRA: true,
});