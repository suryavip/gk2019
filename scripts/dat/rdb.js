if (typeof dat === 'undefined') var dat = {};

dat.rdb = {
	channels: [],
	add: function (channel) {
		var ref = firebase.database().ref(`poke/${this.cacheUserId}/${channel}`);
		ref.on('value', dat.rdb.onChange);
		this.channels.push(channel);
	},
	remove: function (channel) {
		var ref = firebase.database().ref(`poke/${this.cacheUserId}/${channel}`);
		ref.off('value', dat.rdb.onChange);
	},
	removeAll: function () {
		for (i in this.channels) this.remove(this.channels[i]);
	},
	onChange: function (snapshot) {
		var p = snapshot.ref;
		var channel = '';
		while (p.key !== this.cacheUserId) {
			channel = `${p.key}/${channel}`;
			p = p.parent;
		}

		var newVal = snapshot.val();
		if (newVal == null) return;
		/*if (dat.rdb.ignore[dat.rdb.cacheUserId] === true) {
			delete dat.rdb.ignore[dat.rdb.cacheUserId];
			return;
		}
		var oldVal = localJSON.get('dat', 'personalRDBLastChange');
		if (newVal !== oldVal) {
			if (dat.sync.status.value <= 0) {
				console.log('personal rdb change!');
				dat.sync.start();
			}
			else console.log('personal rdb change ignored');
			localJSON.put('dat', 'personalRDBLastChange', newVal);
		}*/
	},
};

window.addEventListener('firebase-status-signedin', () => {
	dat.rdb.cacheUserId = firebaseAuth.userId;
	dat.rdb.add('group');
});

window.addEventListener('firebase-signout', () => {
	dat.rdb.removeAll();
});