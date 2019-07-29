if (typeof dat === 'undefined') var dat = {};

dat.rdb = {
	cacheUserId: '0',
	channels: [],
	groups: [],
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
	endpoints: (groupId) => [
		`member/${groupId}`,
		`schedule/${groupId}`,
		`assignment/${groupId}`,
		`exam/${groupId}`,
	],
	updateGroups: function (g) {
		var newGroups = Object.keys(g);

		//compare this.groups vs newGroups
		var added = [];
		for (i in newGroups) {
			if (this.groups.indexOf(newGroups[i]) < 0) added.push(newGroups[i]);
		}
		var removed = [];
		for (i in this.groups) {
			if (newGroups.indexOf(this.groups[i]) < 0) removed.push(this.groups[i]);
		}

		if (added.length == 0 && removed.length == 0) console.log('no change in group list');

		//add new listener
		for (i in added) {
			var ep = this.endpoints(added[i]);
			for (j in ep) this.add(ep[j]);
			console.log(`add listener for group ${added[i]}`);
		}
		//remove unused listener
		for (i in removed) {
			var ep = this.endpoints(removed[i]);
			for (j in ep) this.remove(ep[j]);
			console.log(`remove listener for group ${removed[i]}`);
		}

		this.groups = newGroups;
		localJSON.put('dat', 'groups', this.groups); //used by app.js

		//return true if there is a changes in group list
		//return false if there is no change in group list
		return !(added.length == 0 && removed.length == 0)
	},
};

window.addEventListener('firebase-status-signedin', () => {
	dat.rdb.cacheUserId = firebaseAuth.userId;
	dat.rdb.add('group');
});

window.addEventListener('firebase-signout', () => {
	dat.rdb.removeAll();
});