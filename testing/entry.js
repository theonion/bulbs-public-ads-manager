const Admanager = require('../src/manager.js');
const adUnits = require('../reductress_ad_map');

// const adUnits = {
//     units: {
//         // ATF Desktop Only
//         'atf-970-flex': {
//             'refreshDisabled': true,
//             'amazonEnabled': true,
//             'pbjsEnabled': true,
//             'slotName': 'atf-970-flex',
//             'sizes': [
//                 [
//                     [962, 0],
//                     [
//                         [728, 90],
//                         [970, 250],
//                         [970, 90]
//                     ]
//                 ],
//                 [
//                     [0, 0],
//                     []
//                 ]
//             ],
//             'prebid': {
//                 'mediaTypes': {
//                     'banner': {
//                         'sizes': [],
//                     }
//                 },
//                 'bids': [{
//                     'bidder': 'htl',
//                     'params': {
//                         'placementId': 'asdfasdfasdf1',
//                     }
//                 }]
//             }
//         },

//         // ATF Mobile Only
//         'atf-300-post': {
//             'refreshDisabled': true,
//             'amazonEnabled': true,
//             'pbjsEnabled': true,
//             'slotName': 'atf-300-post',
//             'sizes': [
//                 [
//                     [0, 0],
//                     [
//                         [300, 250],
//                         [320, 50]
//                     ]
//                 ],
//                 [
//                     [962, 0],
//                     [
//                         [300, 250]
//                     ]
//                 ]
//             ],
//             'prebid': {
//                 'mediaTypes': {
//                     'banner': {
//                         'sizes': [],
//                     }
//                 },
//                 'bids': [{
//                     'bidder': 'htl',
//                     'params': {
//                         'placementId': 'asdfasdfasdf2',
//                     }
//                 }]
//             }
//         },

//         // ATF Flex
//         'atf-300': {
//             'refreshDisabled': true,
//             'eagerLoad': true,
//             'slotName': 'atf-300',
//             'sizes': [
//                 [
//                     [0, 0],
//                     [
//                         [300, 250]
//                     ]
//                 ],
//                 [
//                     [962, 0],
//                     [
//                         [300, 250]
//                     ]
//                 ]
//             ]
//         },

//         // BTF 300 Desktop & Mobile
//         'btf-300-flex': {
//             'refreshDisabled': true,
//             'slotName': 'btf-300-flex',
//             'sizes': [
//                 [
//                     [962, 0],
//                     [
//                         [300, 250],
//                         [300, 600]
//                     ]
//                 ],
//                 [
//                     [0, 0],
//                     [
//                         [300, 250],
//                         [320, 50]
//                     ]
//                 ]
//             ]
//         },

//         // BTF 970 Desktop
//         'btf-728-flex': {
//             'refreshDisabled': true,
//             'slotName': 'btf-728-flex',
//             'sizes': [
//                 [
//                     [962, 0],
//                     [
//                         [728, 90],
//                         [970, 250],
//                         [970, 90]
//                     ]
//                 ],
//                 [
//                     [0, 0],
//                     []
//                 ]
//             ]
//         },

//         // Inner Post Desktop and Mobile
//         'btf-300-in-post': {
//             'refreshDisabled': true,
//             'slotName': 'btf-300-in-post',
//             'sizes': [
//                 [
//                     [0, 0],
//                     [
//                         [300, 250],
//                         [320, 50]
//                     ]
//                 ],
//                 [
//                     [962, 0],
//                     [
//                         [300, 250],
//                         [300, 600]
//                     ]
//                 ]
//             ]
//         },

//         // Mobile Sticky
//         'mobile-sticky': {
//             'refreshDisabled': true,
//             'slotName': 'mobile-sticky',
//             'sizes': [
//                 [
//                     [0, 0],
//                     [
//                         [320, 50]
//                     ]
//                 ],
//                 [
//                     [728, 0],
//                     [
//                         [728, 90]
//                     ]
//                 ],
//                 [
//                     [768, 0],
//                     []
//                 ]
//             ]
//         }
//     }
// };

window.Admanager = Admanager.init({
    adUnits,
    dfpId: '4246/torn.reductress',
    doReloadOnResize: false,
    amazonEnabled: true,
    pbjsEnabled: true,
    debug: true,
});