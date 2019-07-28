if (typeof dat === 'undefined') var dat = {};

dat.fetch = {
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

	do: async function (channel, lastTimestamp) {
		//fetch data
		//store data and lastTimestamp
		//for group channel, update (add or remove as necessary) rdb listeners
	},
};

window.addEventListener('firebase-status-signedin', () => {
	dat.fetch.status.value = 0;
});