if (typeof dat === 'undefined') var dat = {};

dat.fetch = {
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

	do: async function (channel, lastTimestamp) {
		//fetch data
		this.status.add(channel);
		var f = await jsonFetch.doWithIdToken(`${app.baseAPIAddress}/channel`);
		if (f.status === 200) {

			//store data and lastTimestamp
			await dat.db.saved.put({
				channel: channel,
				lastTimestamp: lastTimestamp,
				data: f.body,
			});

			this.status.remove(channel);

			//trigger changes
			dat.triggerChange(channel);
			return f;
		}
		else {
			this.status.remove(channel);
			console.error(`fetch error, retrying after cooldown (${this.retryCoolDown} ms)`);
			setTimeout(() => {
				this.do(channel, lastTimestamp);
			}, this.retryCoolDown);
		}
	},
};

window.addEventListener('firebase-status-signedin', () => {
	dat.fetch.status.ongoing = [];
});