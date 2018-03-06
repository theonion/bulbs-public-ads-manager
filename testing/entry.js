const Admanager = require('../src/manager.js');
const adUnits = require('./reductress_ad_map');

window.Admanager = Admanager.init({
    adUnits,
    dfpId: '4246/torn.reductress',
    doReloadOnResize: false,
    amazonEnabled: true,
    pbjsEnabled: true,
});