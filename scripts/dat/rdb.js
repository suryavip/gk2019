if (typeof dat === 'undefined') var dat = {};

dat.rdb = {
	cacheUserId: '0',
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
	onChange: async function (snapshot) {
		var p = snapshot.ref;
		var channel = '';
		while (p.key !== this.cacheUserId) {
			channel = `${p.key}/${channel}`;
			p = p.parent;
		}

		var newVal = snapshot.val();
		if (newVal == null) return;

		var curVal = await dat.db.saved.where({ channel: channel }).first();
		if (curVal != null) curVal = curVal['lastTimestamp'];

		if (newVal !== curVal) dat.fetch.do(channel, newVal);
	},
};

window.addEventListener('firebase-status-signedin', () => {
	dat.rdb.cacheUserId = firebaseAuth.userId;
	dat.rdb.add('group');
});

window.addEventListener('firebase-signout', () => {
	dat.rdb.removeAll();
});