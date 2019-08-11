if (typeof dat === 'undefined') var dat = {};

dat.server = {
	init: function () {
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
			callBack(f);
		}
		else failedCallBack(f.status === 'connectionError', f);

		delete dat.rdb.ignore[channel];
		this.status.remove(channel);
	}
};

window.addEventListener('firebase-status-signedin', () => {
	dat.server.status.ongoing = [];
});