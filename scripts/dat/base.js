if (typeof dat === 'undefined') var dat = {};

dat.init = function () {
	this.db = new Dexie(`${projectId}_data`);

	this.db.version(1).stores({
		saved: 'channel,lastTimestamp',
	});

	this.fetch.init();
};

dat.triggerChange = function (channel) {
	console.log('change triggered');
	var ev = new CustomEvent(`dat-change`, { detail: channel });
	pg.thisPage.dispatchEvent(ev);
	window.dispatchEvent(ev);
};

dat.attachListener = function (callBack, channels) {
	var internalCB = function (e) {
		var i = channels.indexOf(e.detail);
		if (i > -1) callBack(e.detail);
	}
	pg.thisPage.addEventListener(`dat-change`, internalCB);
	internalCB(channels[0])
};

window.addEventListener('firebase-signout', () => {
	dat.db.delete().then(() => {
		dat.init();
	});
	localJSON.drop('dat');
});