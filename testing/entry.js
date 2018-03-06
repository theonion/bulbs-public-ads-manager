const Admanager = require('../src/manager.js');
const adUnits = require('./ad_map');

window.Admanager = Admanager.init({
    adUnits,
    dfpId: '4246/torn.reductress',
    doReloadOnResize: false,
    amazonEnabled: true,
    pbjsEnabled: true,
});