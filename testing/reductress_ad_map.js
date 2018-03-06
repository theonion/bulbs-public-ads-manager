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
			[[0, 0], [[300, 250], [320, 50]]],
    ],
    'prebid': {
      'mediaTypes': {
        'banner': {
          'sizes': [],
        },
      },
      'bids': [
        {
          'bidder': 'rubicon',
          'labelAll': ['desktop'],
          'params': {
            'accountId': '12156',
            'siteId': '148550',
            'zoneId': '843004',
          },
        },
        {
          'bidder': 'rubicon',
          'labelAll': ['mobile'],
          'params': {
            'accountId': '12156',
            'siteId': '148550',
            'zoneId': '843016',
          },
        },
        // {
        //   'bidder': 'criteo',
        //   'labelAll': ['desktop'],
        //   'params': {
        //     'zoneId': '1151655',
        //   },
        // },
        // {
        //   'bidder': 'criteo',
        //   'labelAll': ['mobile'],
        //   'params': {
        //     'zoneId': '1151654',
        //   },
        // },
        {
          'bidder': 'appnexus',
          'labelAll': ['desktop'],
          'params': {
            'placementId': '12829012',
          },
        },
        {
          'bidder': 'appnexus',
          'labelAll': ['mobile'],
          'params': {
            'placementId': '12828975',
          },
        },
        {
          'bidder': 'aol',
          'labelAll': ['desktop'],
          'params': {
            'network': '10434.1',
            'placement': '4771397',
          },
        },
        {
          'bidder': 'aol',
          'labelAll': ['desktop'],
          'params': {
            'network': '10434.1',
            'placement': '4771404',
          },
        },
        {
          'bidder': 'aol',
          'labelAll': ['mobile'],
          'params': {
            'network': '10434.1',
            'placement': '4770110',
          },
        },
        {
          'bidder': 'aol',
          'labelAll': ['mobile'],
          'params': {
            'network': '10434.1',
            'placement': '4771395',
          },
        },
        {
          'bidder': 'yieldmo',
          'labelAll': ['mobile'],
          'params': {
            'placementId': '1881231668179272900',
          },
        },
      ],
    },
	},
};

module.exports = AdUnits;