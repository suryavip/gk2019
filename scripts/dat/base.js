if (typeof dat === 'undefined') var dat = {};

dat.init = function () {
	this.db = new Dexie(`${projectId}_data`);

	this.db.version(1).stores({
		saved: 'channel',
		ownership: 'id,channel',

		/*schedule: 'scheduleId,owner',
		assignment: 'assignmentId,owner',
		exam: 'examId,owner',*/
	});

	this.server.init();
};

dat.triggerChange = function (channel) {
	console.log('change triggered', channel);
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
	callBack(channels[0])
	return internalCB;
};

dat.mergeData = function (fromArray) {
	var r = {};
	for (i in fromArray) {
		for (ii in fromArray[i].data) r[ii] = fromArray[i].data[ii];
	}
	return r;
};

window.addEventListener('firebase-signout', () => {
	dat.db.delete().then(() => {
		dat.init();
	});
	localJSON.drop('dat');
});