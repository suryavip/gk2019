if (typeof dat === 'undefined') var dat = {};

dat.fetch = {
	init: function () {
		this.status.installIndicator();
	},
	status: {
		value: 99,
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

			//for group channel, update (add or remove as necessary) rdb listeners
			if (channel === 'group') dat.rdb.updateGroups(f.body);
		}
	},
};

window.addEventListener('firebase-status-signedin', () => {
	dat.fetch.status.value = 0;
});