if (typeof dat === 'undefined') var dat = {};

dat.sync = {
	init: function () {
		this.status.installIndicator();
	},
	status: {
		value: 99,
		change: function (v) {
			this.value = v;
			pg.thisPage.dispatchEvent(new Event(`dat-status-change`));
			window.dispatchEvent(new Event(`dat-status-change`));
			var syncIndicator = document.getElementById('dat-syncIndicator');
			syncIndicator.setAttribute('data-active', this.value > 0);

			//preventing close while sync incomplete
			if (!isLocal) {
				if (this.value != 0) window.onbeforeunload = function () { return true };
				else window.onbeforeunload = null;
			}
		},
		listen: function (callBack) {
			callBack(this.value);
			pg.thisPage.addEventListener('dat-status-change', () => {
				callBack(this.value);
			});
		},
		installIndicator: function () {
			//dont install indicator when there is one already
			if (document.querySelector('#dat-syncIndicator') != null) return;
			var syncIndicator = document.createElement('div');
			syncIndicator.id = 'dat-syncIndicator';
			syncIndicator.innerHTML = '<div></div>';
			syncIndicator.setAttribute('data-active', this.value > 0 && this.value !== 99);
			document.body.appendChild(syncIndicator);
		},
	},

	retryCoolDown: 10 * 1000, //when sync retry after failed
	startup: 1 * 1000, //when stepA called after start called
	start: function (param) {
		if (param == null) param = {};
		this.param = param;
		console.log('dat.sync.start called');
		if (this.status.value <= 0) {
			this.status.change(1);
			setTimeout(() => { this.stepA(); }, this.param.immediate ? 0 : this.startup);
		}
		else if (this.status.value == 1) {
			console.log(`dat.sync.start already called previously, but not started yet`);
		}
		else console.log('dat.sync.start rejected');
	},
	stepA: function () {
		console.log('dat.sync.start actually started');
		/*1. local to server
		- where synced == false
		- items to be deleted
		- lastUpdateTag*/
		this.status.change(2);
		this.param.queue = [];
		this.param.deletedOnRequest = [];
		dat.db.transaction('r', dat.db.saved, dat.db.deleted, async () => {
			//strip out synced col, and stringify data col
			var saved = await dat.db.saved.where({ synced: 'false' }).toArray();
			for (i in saved) {
				var tw = saved[i];
				delete tw.synced;
				tw.data = JSON.stringify(tw.data);
				this.param.queue.push(tw);
			}
			var deleted = await dat.db.deleted.toArray();
			for (i in deleted) {
				var tw = deleted[i];
				this.param.queue.push({
					tableName: tw.tableName,
					rowId: tw.rowId,
					updateTime: tw.deleteTime,
					data: null,
				});
				this.param.queue.deletedOnRequest.push(tw.rowId);
			}
		}).then(() => {
			this.param.lastUpdateTag = localJSON.get('dat', 'lastUpdateTag') || {};
			this.stepB();
		}).catch(e => {
			this.status.change(-2);
			console.error('sync error on stepA');
			if (e.name === 'NotFoundError') {
				console.error('NotFoundError. typicaly because structure changed', e);
			}
			else console.error(e);
		});
	},
	stepB: async function () {
		//actualy send to server
		this.status.change(3);

		var f = await jsonFetch.doWithIdToken(`${app.baseAPIAddress}/sync`, {
			method: 'POST',
			body: JSON.stringify({
				lastUpdateTag: this.param.lastUpdateTag,
				personalData: this.param.queue,
				groupRequest: this.param.groupRequest,
			}),
		}, this.param.forceNewToken);

		if (f.status === 201) {
			console.log(`server proccessing performance: ${f.b.processTime}`);

			if (f.b.customToken !== '') firebase.auth().signInWithCustomToken(f.b.customToken)
				.then(() => {
					console.log('customToken applied');
					for (i in f.b.rdbSuggestion) dat.rdb.update(i);
				})
				.catch(error => { console.error(error); });
			else for (i in f.b.rdbSuggestion) dat.rdb.update(i);

			this.stepC(f.b);
		}
		else {
			if (f.status === 'connectionError') this.status.change(-3);
			else this.status.change(-3.5);
			if (this.param.noRetry) {
				console.error(`sync error on stepB, but noRetry`);
				return;
			}
			console.error(`sync error on stepB, retrying after cooldown (${this.retryCoolDown} ms)`);
			setTimeout(() => {
				this.param.immediate = false;
				this.start(this.param);
			}, this.retryCoolDown);
		}
	},
	stepC: function (b) {
		/*4. on local
		- apply data returned by server (including updatedTime) with synced = true
		- set lastUpdateTag to latest updateTag that returned by server*/
		this.status.change(4);

		var lastUpdateTag = localJSON.get('dat', 'lastUpdateTag') || {};

		var toUpdate = [];
		var toDelete = [];

		for (i in b.catchUp) {
			var t = b.catchUp[i];
			if (typeof t.data === 'string') {
				//set synced and parse stringified data
				t.synced = 'true';
				t.data = JSON.parse(t.data);
				toUpdate.push(t);
			}
			else {
				toDelete.push(t.rowId);
			}
			if (lastUpdateTag[t.owner] == null) lastUpdateTag[t.owner] = '0';
			if (t.updateTag > lastUpdateTag[t.owner]) lastUpdateTag[t.owner] = t.updateTag;
		}

		console.log(toUpdate, toDelete, this.param.deletedOnRequest);

		dat.db.transaction('rw', dat.db.saved, dat.db.deleted, async () => {
			await dat.db.saved.bulkPut(toUpdate);
			await dat.db.saved.bulkDelete(toDelete);
			await dat.db.deleted.bulkDelete(this.param.deletedOnRequest);
			if (b.catchUp.length < 40) {
				await dat.maintenance.do(b);
			}
		}).then(() => {
			var groupListChanged = dat.rdb.manageGroupListeners(b.groups);

			if (groupListChanged || b.catchUp.length > 0) {
				// when groupListChanged, it's possible there is a group deleted
				// catchUp will be empty in case of group deleted (this user is kicked or whatever)
				dat.triggerChange(null, 'stepC');
			}

			localJSON.put('dat', 'lastUpdateTag', lastUpdateTag);

			setTimeout(() => {
				this.status.change(0);

				if (b.catchUp.length == 40) {
					console.log('there is seems more data to sync');
					this.start();
				}
				else {
					console.log('sync complete');
				}
			}, 2000);
		}).catch(e => {
			this.status.change(-4);
			console.error('sync error on stepC');
			console.error(e);
		});
	},

	groupRequest: function (param, callBack, errorCallBack) {
		//making sure sync is not in progress
		if (this.status.value !== 0) {
			setTimeout(() => {
				this.groupRequest(param, callBack, errorCallBack);
			}, 1000);
			return;
		}
		this.start({
			immediate: true,
			noRetry: true,
			groupRequest: param,
		});

		//status listener
		var listener = () => {
			var status = this.status.value;
			if (status < 0) {
				window.removeEventListener('dat-status-change', listener);
				errorCallBack(status === -3); // -3 means connection error
				this.status.change(0); //reset
			}
			else if (status > 0) {
				console.log(`still in progress (${status})`);
			}
			else {
				window.removeEventListener('dat-status-change', listener);
				callBack();
			}
		}
		window.addEventListener(`dat-status-change`, listener);
	},
};

window.addEventListener('firebase-status-signedin', () => {
	dat.sync.status.value = 0;
	dat.sync.start({
		immediate: true,
		forceNewToken: true,
	});
});