if (typeof dat === 'undefined') var dat = {};

dat.server = {
	init: function () {
		this.status.ongoing = [];
		this.status.installIndicator();
	},
	status: {
		ongoing: [],
		add: function (v) {
			this.ongoing.push(v);
			this.change();
		},
		remove: function (v) {
			var index = this.ongoing.indexOf(v);
			if (index < 0) return;
			this.ongoing.splice(index, 1);
			this.change();
		},
		change: function (v) {
			pg.thisPage.dispatchEvent(new Event(`dat-status-change`));
			window.dispatchEvent(new Event(`dat-status-change`));
			var syncIndicator = document.getElementById('dat-syncIndicator');
			syncIndicator.setAttribute('data-active', this.ongoing.length > 0);

			//preventing close while sync incomplete
			if (!isLocal) {
				if (this.ongoing.length != 0) window.onbeforeunload = function () { return true };
				else window.onbeforeunload = null;
			}
		},
		listen: function (callBack) {
			callBack(this.ongoing.length);
			pg.thisPage.addEventListener('dat-status-change', () => {
				callBack(this.ongoing.length);
			});
		},
		installIndicator: function () {
			//dont install indicator when there is one already
			if (document.querySelector('#dat-syncIndicator') != null) return;
			var syncIndicator = document.createElement('div');
			syncIndicator.id = 'dat-syncIndicator';
			syncIndicator.innerHTML = '<div></div>';
			syncIndicator.setAttribute('data-active', this.ongoing.length > 0);
			document.body.appendChild(syncIndicator);
		},
	},

	retryCoolDown: 10 * 1000, //when sync retry after failed

	fetch: async function (channel, lastTimestamp) {
		//fetch data
		this.status.add(channel);
		var f = await jsonFetch.doWithIdToken(`${app.baseAPIAddress}/${channel}`);
		if (f.status === 200) await dat.local.update(channel, lastTimestamp, f.b);
		this.status.remove(channel);
		return f;
	},

	request: async function (method, channel, body, callBack, failedCallBack) {
		var timestamp = parseInt(new Date().getTime() / 1000);

		//add channel and timestamp to ignore list
		dat.rdb.ignore[channel] = timestamp;

		this.status.add(channel);

		var f = await jsonFetch.doWithIdToken(`${app.baseAPIAddress}/${channel}`, {
			method: method,
			body: JSON.stringify(body),
			headers: { 'X-timestamp': timestamp },
		});

		if (f.status === 201 || f.status === 200) {
			await dat.local.update(channel, timestamp, f.b);
			callBack(f, body);
		}
		else failedCallBack(f.status === 'connectionError', f);

		delete dat.rdb.ignore[channel];
		this.status.remove(channel);
	},

	uploadAttachment: function (file, originalFilename, thumbnail) {
		var form = new FormData()
		form.append('file', file)
		if (typeof originalFilename === 'string') form.append('originalFilename', originalFilename)
		if (thumbnail != null) form.append('thumbnail', thumbnail)
		var options = {
			method: 'POST',
			body: form,
			headers: {},
		};
		options.headers['Content-Type'] = false;
		return jsonFetch.doWithIdToken(`${app.baseAPIAddress}/temp_attachment`, options);
	},

	pending: {
		retrying: false,
		doAll: async function () {
			this.retrying = false;

			dat.server.pending.schedule.put();

			dat.server.pending.assignment.post();
			dat.server.pending.assignment.put();
			dat.server.pending.assignment.delete();

			dat.server.pending.exam.post();
			dat.server.pending.exam.put();
			dat.server.pending.exam.delete();

			var doPendingOpinion = async () => {
				var count = await dat.db.assignment.where('source').anyOf(['local-new', 'local']).count();
				count += await dat.db.exam.where('source').anyOf(['local-new', 'local']).count();
				if (count === 0) dat.server.pending.opinion.put(); //do this after all assignment and exam synced
				else setTimeout(doPendingOpinion, 5000);
			}
			doPendingOpinion();
		},

		failed: async function (connectionError) {
			console.log('pending failed');
			if (connectionError) {
				if (this.retrying) return;
				this.retrying = true;
				console.log(`pending request is retrying in ${dat.server.retryCoolDown}`);
				setTimeout(dat.server.pending.doAll, dat.server.retryCoolDown);
			}
		},

		opinion: {
			put: async function () {
				var opinions = await dat.db.opinion.where({ source: 'local' }).toArray();
				for (i in opinions) {
					var o = opinions[i];
					o[`${o.type}Id`] = o.parentId;
					await dat.server.request('PUT', 'opinion', o, () => { }, dat.server.pending.failed);
				}
			},
		},
		schedule: {
			put: async function () {
				var schedules = await dat.db.schedule.where({ source: 'local' }).toArray();
				for (i in schedules) {
					var s = schedules[i];
					await dat.server.request('PUT', `schedule/${firebaseAuth.userId}`, s, () => { }, dat.server.pending.failed);
				}
			},
		},
		assignment: {
			post: async function () {
				var assignments = await dat.db.assignment.where({ source: 'local-new' }).toArray();
				for (i in assignments) {
					var a = assignments[i];
					await dat.server.request('POST', `assignment/${firebaseAuth.userId}`, a, () => { }, dat.server.pending.failed);
				}
			},
			put: async function () {
				var assignments = await dat.db.assignment.where({ source: 'local' }).toArray();
				for (i in assignments) {
					var a = assignments[i];
					await dat.server.request('PUT', `assignment/${firebaseAuth.userId}`, a, () => { }, dat.server.pending.failed);
				}
			},
			delete: async function () {
				var assignments = await dat.db.deletedAssignment.toArray();
				for (i in assignments) {
					var a = assignments[i];
					await dat.server.request('DELETE', `assignment/${firebaseAuth.userId}`, a, (f, b) => {
						//delete from deletedAssignment if success
						dat.db.deletedAssignment.delete(b.assignmentId);
					}, dat.server.pending.failed);
				}
			},
		},
		exam: {
			post: async function () {
				var exams = await dat.db.exam.where({ source: 'local-new' }).toArray();
				for (i in exams) {
					var a = exams[i];
					await dat.server.request('POST', `exam/${firebaseAuth.userId}`, a, () => { }, dat.server.pending.failed);
				}
			},
			put: async function () {
				var exams = await dat.db.exam.where({ source: 'local' }).toArray();
				for (i in exams) {
					var a = exams[i];
					await dat.server.request('PUT', `exam/${firebaseAuth.userId}`, a, () => { }, dat.server.pending.failed);
				}
			},
			delete: async function () {
				var exams = await dat.db.deletedExam.toArray();
				for (i in exams) {
					var a = exams[i];
					await dat.server.request('DELETE', `exam/${firebaseAuth.userId}`, a, (f, b) => {
						//delete from deletedExam if success
						dat.db.deletedExam.delete(b.examId);
					}, dat.server.pending.failed);
				}
			},
		},
	},
};

window.addEventListener('firebase-status-signedin', () => {
	dat.server.status.ongoing = [];
	dat.server.status.change();

	//do pendings
	dat.server.pending.doAll();
});