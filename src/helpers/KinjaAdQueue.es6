/* global window, document, define */


window.kinjaads = window.kinjaads || {};
window.kinjaads.queue = window.kinjaads.queue || [];
window.kinjaads.cmd = window.kinjaads.cmd || []; // TODO: try to nicely merge kinjaads.queue with kinjaads.cmd

var kinjaMeta = window.kinja.meta,
	blogSales = kinjaMeta.blogSales,
	initialize,
	processedKinjaCmdQueue = false,
	processKinjaadsCmdQueue;

window.kinjaads = window.kinjaads || {};
window.kinjaads.queue = window.kinjaads.queue || [];
window.kinjaads.cmd = window.kinjaads.cmd || []; // TODO: try to nicely merge kinjaads.queue with kinjaads.cmd

/**
 * Override Array.prototype.push to ensure commands are called FIFO.
 * We need this cmd queue to sychronize between ad.module and ads.controller until
 * we can unite the two files
 * @param  {function} cmd a comamnd to execute
 * @return {undefined}
 */
window.kinjaads.cmd.push = function (cmd) {
	if (processedKinjaCmdQueue) {
		cmd.call(this);
	} else {
		Array.prototype.push.call(this, cmd);
	}
};

processKinjaadsCmdQueue = function () {
	while (window.kinjaads.cmd.length) {
		var cmd = window.kinjaads.cmd.shift();
		cmd.call();
	}
	processedKinjaCmdQueue = true;
};

/**
 * Initialize GPT for us now
 *
 * VOID->VOID
 */
initialize = function () {
	var adsEnabled = blogSales && blogSales.adsEnabled,
		disabledAdSlots = (adsEnabled) ? blogSales.adSlotsDisabled : [],
		collapseAllAdZones = kinjaMeta.post && kinjaMeta.post.adZone === 'collapse';

	if (!adsEnabled || collapseAllAdZones || disabledAdSlots.indexOf('blarf') !== -1) {
		return;
	}
	processKinjaadsCmdQueue();
};

initialize();