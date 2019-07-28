if (typeof dat === 'undefined') var dat = {};

dat.init = function () {
	this.db = new Dexie(`${projectId}_data`);

	this.db.version(1).stores({
		saved: 'channel,lastTimestamp',
	});

	this.fetch.init();
};