if (typeof dat === 'undefined') var dat = {};

dat.init = function () {
	this.db = new Dexie(`${projectId}_data`);

	this.db.version(1).stores({
		saved: 'channel,lastTimestamp',
/*
		group: 'groupId',
		notification: ',time',
		
		member: ',groupId',
		schedule: 'scheduleId,owner',
		assignment: 'assignmentId,owner',
		exam: 'examId,owner',*/
	});

	this.talk.init();
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
	callBack(channels[0])
	return internalCB;
};

dat.request = async function (method, channel, body, callBack, failedCallBack) {
	var timestamp = parseInt(new Date().getTime() / 1000);

	//add channel and timestamp to ignore list
	dat.rdb.ignore[channel] = timestamp;

	dat.talk.status.add(channel);

	var f = await jsonFetch.doWithIdToken(`${app.baseAPIAddress}/${channel}`, {
		method: method,
		body: JSON.stringify(body),
		headers: {
			'X-timestamp': timestamp,
		}
	});

	if (f.status === 201 || f.status === 200) {
		//store data and lastTimestamp
		await dat.db.saved.put({
			channel: channel,
			lastTimestamp: timestamp,
			data: f.b,
		});
		if (dat.talk.status.ongoing.indexOf(channel) < 2) dat.triggerChange(channel);
		callBack(f);
	}
	else failedCallBack(f.status === 'connectionError', f);

	delete dat.rdb.ignore[channel];
	dat.talk.status.remove(channel);
};

window.addEventListener('firebase-signout', () => {
	dat.db.delete().then(() => {
		dat.init();
	});
	localJSON.drop('dat');
});