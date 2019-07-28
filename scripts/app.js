var app = {
	state: {}, //use this to save state
	reload: () => {
		window.onbeforeunload = null;
		window.location.reload();
	},
	escapeHTML: function (unsafe) {
		return unsafe
			.replace(/&/g, "&amp;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;")
			.replace(/"/g, "&quot;")
			.replace(/'/g, "&#039;")
			.replace(/(?:\r\n|\r|\n)/g, "<br>");
	},
	multiToSingleLine: function (multiLine) {
		//use class .singleLine to limit number of character automatically according to width
		var a = multiLine.split(/(?:\r\n|\r|\n)/g);
		if (a.length > 1) return `${a[0]}...`;
		else return multiLine;
	},
	displayDate: (d, noMonthNoYear, withTime) => {
		if (d == null) d = moment();
		if (typeof d === 'number' || typeof d === 'string') d = moment(d);
		var m = d.year() === moment().year() ? ' MMMM' : ' MMM YYYY';
		if (noMonthNoYear) m = '';
		var t = '';
		if (withTime) t = ', HH:mm'
		return d.calendar(null, {
			sameDay: `[${gl('today', null, 'app')}], D${m}${t}`,
			nextDay: `[${gl('tomorrow', null, 'app')}], D${m}${t}`,
			nextWeek: `dddd, D${m}${t}`,
			lastDay: `[${gl('yesterday', null, 'app')}], D${m}${t}`,
			lastWeek: `dddd, D${m}${t}`,
			sameElse: `dddd, D${m}${t}`
		});
	},
	listenForChange: (els, callBack) => {
		var lastValue = []; var nowPage = `${pg.thisPage.id}`;
		var pooling = () => {
			if (nowPage !== pg.thisPage.id) {
				console.log('listenForChange pooling terminated');
				return;
			}
			var isChange = false;
			for (i in els) {
				var el = els[i];
				try {
					if (typeof el === 'string') el = pg.getEl(el);
					if (lastValue[i] != null && el.value !== lastValue[i]) isChange = true;
					lastValue[i] = el.value;
				}
				catch { }
			}
			if (isChange) callBack();
			setTimeout(pooling, 100);
		};
		pooling();
		callBack();
	},
	listenForEnterKey: (els, callBack) => {
		for (i in els) {
			var el = els[i];
			if (typeof el === 'string') el = pg.getEl(el);
			el.addEventListener("keydown", function (e) {
				if (e.keyCode === 13) {  //checks whether the pressed key is "Enter"
					callBack(e);
					el.blur();
				}
			});
		}
	},
	passwordShowHideToggle: (btn) => {
		var i = btn.querySelector('i');
		var input = btn.parentElement.querySelector('input');

		if (input.getAttribute('type') === 'password') {
			//show
			input.type = 'text';
			i.className = 'fas fa-eye-slash';
		}
		else {
			//hide
			input.type = 'password';
			i.className = 'fas fa-eye';
		}
	},
	baseAPIAddress: 'https://boostedcode.com/project/rk2019/api/1',
	//baseAPIAddress: 'http://localhost:5000',
	baseAPPAddress: 'https://ruangkelas.boostedcode.com',
	comparableDate: i => {
		var d = moment(i);
		return parseInt(d.format('YYYYMMDD'));
	},
	forceValidUsername: i => {
		var a = i.replace(/[^a-z0-9_]/gi, '');
		if (a.substr(0, 1) === '_') a = a.substr(1);
		return a;
	},
	dynamicBackButton: (isIndex) => {
		if (vipHistory.isFirstPage.get()) {
			//show exit or home
			if (isIndex) return `<div class="button" onclick="vipHistory.closeApp()"><i class="fas fa-times"></i></div>`;
			else return `<div class="button" onclick="go('${firebaseAuth.isSignedIn() ? 'home' : 'index'}', null, true);"><i class="fas fa-home"></i></div>`
		}
		else return `<div class="button" onclick="window.history.go(-1)"><i class="fas fa-arrow-left"></i></div>`;
	},
	activeGroup: {
		get: () => {
			var groups = localJSON.get('dat', 'groups');
			if (groups == null || groups.length == 0) return 'empty';

			var activeGroup = localJSON.get('appState', 'activeGroup');
			if (activeGroup == null || groups.indexOf(activeGroup) < 0) {
				app.activeGroup.set(groups[0]);
				return groups[0];
			}
			return activeGroup;
		},
		set: (groupId) => {
			localJSON.put('appState', 'activeGroup', groupId);
			dat.triggerChange(null, 'activeGroup.set');
		},
	},
};

window.addEventListener('vipLanguageInit', () => {
	vipLanguage.lang['app'] = {
		en: {
			today: 'Today',
			tomorrow: 'Tomorrow',
			yesterday: 'Yesterday',
			connectionError: 'Please check your internet connection',
			unexpectedError: p => `Unexpected error (${p})`,
		},
		id: {
			today: 'Hari Ini',
			tomorrow: 'Besok',
			yesterday: 'Kemarin',
			connectionError: 'Koneksi internet gagal',
			unexpectedError: p => `Error tak terduga (${p})`,
		},
	};
});

window.addEventListener('firebase-signout', () => {
	localJSON.drop('appState');
});