'use strict';

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
// BTF 300 Desktop & Mobile
	'btf-300-flex': {
    'refreshDisabled': true,
    'pbjsEnabled': true,
		'slotName': 'btf-300-flex',
		'sizes': [
			[[962, 0], [[300, 250], [300, 600]]],
			[[0, 0], [[300, 250]]],
    ],
    'prebid': {
      'mediaTypes': {
        'banner': {
          'sizes': [],
        },
      },
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

module.exports = AdUnits;