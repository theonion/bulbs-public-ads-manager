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
// ATF Desktop Only
	'atf-970-flex': {
    'refreshDisabled': true,
    'pbjsEnabled': true,
		'slotName': 'atf-970-flex',
		'sizes': [
			[[962, 0], [[728, 90], [970, 250], [970, 90]]],
			[[0, 0], []],
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
            'zoneId': '843002',
          },
        },
        // {
        //   'bidder': 'criteo',
        //   'labelAll': ['desktop'],
        //   'params': {
        //     'zoneId': '1151652',
        //   },
        // },
        {
          'bidder': 'appnexus',
          'labelAll': ['desktop'],
          'params': {
            'placementId': '12829009',
          },
        },
      ],
    },
	},

	// ATF Mobile Only
	'atf-300-post': {
		'refreshDisabled': true,
    'pbjsEnabled': true,
		'slotName': 'atf-300-post',
		'sizes': [
			[[0, 0], [[300, 250], [320, 50]]],
			[[962, 0], [[300, 250]]],
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
            'zoneId': '843000',
          },
        },
        {
          'bidder': 'rubicon',
          'labelAll': ['mobile'],
          'params': {
            'accountId': '12156',
            'siteId': '148550',
            'zoneId': '843014',
          },
        },
        // {
        //   'bidder': 'criteo',
        //   'labelAll': ['desktop'],
        //   'params': {
        //     'zoneId': '1151651',
        //   },
        // },
        // {
        //   'bidder': 'criteo',
        //   'labelAll': ['mobile'],
        //   'params': {
        //     'zoneId': '1151650',
        //   },
        // },
        {
          'bidder': 'appnexus',
          'labelAll': ['desktop'],
          'params': {
            'placementId': '12829006',
          },
        },
        {
          'bidder': 'appnexus',
          'labelAll': ['mobile'],
          'params': {
            'placementId': '12828971',
          },
        },
        {
          'bidder': 'aol',
          'labelAll': ['desktop'],
          'params': {
            'network': '10434.1',
            'placement': '4771402',
          },
        },
        {
          'bidder': 'aol',
          'labelAll': ['mobile'],
          'params': {
            'network': '10434.1',
            'placement': '4770109',
          },
        },
        {
          'bidder': 'aol',
          'labelAll': ['mobile'],
          'params': {
            'network': '10434.1',
            'placement': '4771394',
          },
        },
        {
          'bidder': 'yieldmo',
          'labelAll': ['mobile'],
          'params': {
            'placementId': '1881231339714938050',
          },
        },
      ],
    },
	},

	// ATF Flex
	'atf-300': {
		'refreshDisabled': true,
    'pbjsEnabled': true,
		'slotName': 'atf-300',
		'sizes': [
			[[0, 0], [[300, 250]]],
			[[962, 0], [[300, 250]]],
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
            'zoneId': '842998',
          },
        },
        {
          'bidder': 'rubicon',
          'labelAll': ['mobile'],
          'params': {
            'accountId': '12156',
            'siteId': '148550',
            'zoneId': '843012',
          },
        },
        // {
        //   'bidder': 'criteo',
        //   'labelAll': ['desktop'],
        //   'params': {
        //     'zoneId': '1151649',
        //   },
        // },
        // {
        //   'bidder': 'criteo',
        //   'labelAll': ['mobile'],
        //   'params': {
        //     'zoneId': '1151648',
        //   },
        // },
        {
          'bidder': 'appnexus',
          'labelAll': ['desktop'],
          'params': {
            'placementId': '12829002',
          },
        },
        {
          'bidder': 'appnexus',
          'labelAll': ['mobile'],
          'params': {
            'placementId': '12828957',
          },
        },
        {
          'bidder': 'aol',
          'labelAll': ['desktop'],
          'params': {
            'network': '10434.1',
            'placement': '4771400',
          },
        },
        {
          'bidder': 'aol',
          'labelAll': ['mobile'],
          'params': {
            'network': '10434.1',
            'placement': '4770108',
          },
        },
        {
          'bidder': 'yieldmo',
          'labelAll': ['mobile'],
          'params': {
            'placementId': '1881229752506418368',
          },
        },
      ],
    },
	},

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

// BTF 970 Desktop
	'btf-728-flex': {
    'refreshDisabled': true,
    'pbjsEnabled': true,
		'slotName': 'btf-728-flex',
		'sizes': [
			[[962, 0], [[728, 90], [970, 250], [970, 90]]],
			[[0, 0], []],
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
            'zoneId': '843008',
          },
        },
        // {
        //   'bidder': 'criteo',
        //   'labelAll': ['desktop'],
        //   'params': {
        //     'zoneId': '1151660',
        //   },
        // },
        {
          'bidder': 'appnexus',
          'labelAll': ['desktop'],
          'params': {
            'placementId': '12829019',
          },
        },
        {
          'bidder': 'aol',
          'labelAll': ['desktop'],
          'params': {
            'network': '10434.1',
            'placement': '4771399',
          },
        },
        {
          'bidder': 'aol',
          'labelAll': ['desktop'],
          'params': {
            'network': '10434.1',
            'placement': '4771401',
          },
        },
        {
          'bidder': 'aol',
          'labelAll': ['desktop'],
          'params': {
            'network': '10434.1',
            'placement': '4771403',
          },
        },
      ],
    },
	},

	// Inner Post Desktop and Mobile
	'btf-300-in-post': {
    'refreshDisabled': true,
    'pbjsEnabled': true,
		'slotName': 'btf-300-in-post',
		'sizes': [
			[[0, 0], [[300, 250], [320, 50]]],
			[[962, 0], [[300, 250], [300, 600]]],
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
            'zoneId': '843006',
          },
        },
        {
          'bidder': 'rubicon',
          'labelAll': ['mobile'],
          'params': {
            'accountId': '12156',
            'siteId': '148550',
            'zoneId': '843018',
          },
        },
        // {
        //   'bidder': 'criteo',
        //   'labelAll': ['desktop'],
        //   'params': {
        //     'zoneId': '1151658',
        //   },
        // },
        // {
        //   'bidder': 'criteo',
        //   'labelAll': ['mobile'],
        //   'params': {
        //     'zoneId': '1151657',
        //   },
        // },
        {
          'bidder': 'appnexus',
          'labelAll': ['desktop'],
          'params': {
            'placementId': '12829015',
          },
        },
        {
          'bidder': 'appnexus',
          'labelAll': ['mobile'],
          'params': {
            'placementId': '12828979',
          },
        },
        {
          'bidder': 'aol',
          'labelAll': ['desktop'],
          'params': {
            'network': '10434.1',
            'placement': '4771398',
          },
        },
        {
          'bidder': 'aol',
          'labelAll': ['desktop'],
          'params': {
            'network': '10434.1',
            'placement': '4771405',
          },
        },
        {
          'bidder': 'aol',
          'labelAll': ['mobile'],
          'params': {
            'network': '10434.1',
            'placement': '4771396',
          },
        },
        {
          'bidder': 'aol',
          'labelAll': ['mobile'],
          'params': {
            'network': '10434.1',
            'placement': '4770111',
          },
        },
        {
          'bidder': 'yieldmo',
          'labelAll': ['mobile'],
          'params': {
            'placementId': '1881231919954953414',
          },
        },
      ],
    },
	},

	// Mobile Sticky
	'mobile-sticky': {
    'refreshDisabled': true,
    'pbjsEnabled': true,
		'slotName': 'mobile-sticky',
		'sizes': [
			[[0, 0], [[320, 50]]],
      [[728, 0], [[728, 90]]],
			[[768, 0], []],
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
          'labelAll': ['desktop_sticky'],
          'params': {
            'accountId': '12156',
            'siteId': '148550',
            'zoneId': '843010',
          },
        },
        {
          'bidder': 'rubicon',
          'labelAll': ['mobile_sticky'],
          'params': {
            'accountId': '12156',
            'siteId': '148550',
            'zoneId': '843020',
          },
        },
        // {
        //   'bidder': 'criteo',
        //   'labelAll': ['desktop_sticky'],
        //   'params': {
        //     'zoneId': '1151663',
        //   },
        // },
        // {
        //   'bidder': 'criteo',
        //   'labelAll': ['mobile_sticky'],
        //   'params': {
        //     'zoneId': '1151662',
        //   },
        // },
        {
          'bidder': 'appnexus',
          'labelAll': ['desktop_sticky'],
          'params': {
            'placementId': '12829022',
          },
        },
        {
          'bidder': 'appnexus',
          'labelAll': ['mobile_sticky'],
          'params': {
            'placementId': '12828982',
          },
        },
        {
          'bidder': 'aol',
          'labelAll': ['mobile_sticky'],
          'params': {
            'network': '10434.1',
            'placement': '4770112',
          },
        },
      ],
    },
	},
};

module.exports = AdUnits;