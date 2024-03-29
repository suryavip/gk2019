if (typeof dat === 'undefined') var dat = {};

dat.init = function () {
	this.db = new Dexie(`${projectId}_data`);

	this.db.version(1).stores({
		/*saved: 'channel',
		ownership: 'id,channel',*/

		lastTimestamp: 'channel',
		group: 'groupId,name',
		notification: '++,time',
		opinion: 'parentId,source',
		member: '++,groupId',
		schedule: 'scheduleId,owner,source',
		assignment: 'assignmentId,dueDate,owner,source',
		exam: 'examId,examDate,owner,source',

		deletedAssignment: 'assignmentId', //pending delete
		deletedExam: 'examId', //pending delete
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
		var root = e.detail.split('/')[0];
		var i = channels.indexOf(root);
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
});