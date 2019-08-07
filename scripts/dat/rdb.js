if (typeof dat === 'undefined') var dat = {};

dat.rdb = {
	channels: [],
	groups: {},
	ignore: {},
	add: function (channel) {
		var ref = firebase.database().ref(`poke/${firebaseAuth.userId}/${channel}`);
		ref.on('value', dat.rdb.onChange);
		this.channels.push(channel);
	},
	remove: function (channel) {
		var ref = firebase.database().ref(`poke/${firebaseAuth.userId}/${channel}`);
		ref.off('value', dat.rdb.onChange);
		var i = this.channels.indexOf(channel);
		if (i > -1) this.channels.splice(i, 1);
	},
	removeAll: function () {
		for (i in this.channels) this.remove(this.channels[i]);
	},
	onChange: async function (snapshot) {
		var newVal = snapshot.val();
		if (newVal == null) return;

		var channel = snapshot.ref.key;
		var p = snapshot.ref.parent;
		while (p != null && p.key !== firebaseAuth.userId) {
			channel = `${p.key}/${channel}`;
			p = p.parent;
		}

		console.log(`onchange triggered on ${channel}`);

		if (dat.rdb.ignore[channel] != null && dat.rdb.ignore[channel] === newVal) {
			// wait until ignore removed
			setTimeout(() => {
				dat.rdb.onChange(snapshot);
			}, 500);
			return;
		}

		var curData = await dat.db.saved.where({ channel: channel }).first();
		if (curData == null) curData = {};

		if (newVal !== curData['lastTimestamp']) {
			console.log(`changes on ${channel}: ${newVal} vs ${curData['lastTimestamp']}`);
			var f = await dat.talk.fetch(channel, newVal);
			if (f.status !== 200) {
				console.error(`fetch error, retrying after cooldown (${this.retryCoolDown} ms)`);
				setTimeout(() => {
					dat.rdb.onChange(snapshot);
				}, dat.talk.retryCoolDown);
				return;
			}
			var groups = f.b;
		}
		else {
			console.log(`ignoring changes on ${channel} because same timestamp`);
			var groups = curData['data'];
		}

		if (channel === 'group') dat.rdb.updateGroups(groups);
	},
	endpoints: (groupId) => [
		`member/${groupId}`,
		`schedule/${groupId}`,
		`assignment/${groupId}`,
		`exam/${groupId}`,
	],
	updateGroups: async function (newGroups) {
		//compare this.groups vs newGroups
		var added = {};
		for (gid in newGroups) {
			if (this.groups[gid] == null) added[gid] = newGroups[gid].level;
		}
		var removed = {};
		for (gid in this.groups) {
			if (newGroups[gid] == null) removed[gid] = this.groups[gid].level;
		}

		if (Object.keys(added).length == 0 && Object.keys(removed).length == 0) console.log('no change in group list');

		//add new listener
		for (gid in added) {
			if (added[gid] === 'pending') {
				delete newGroups[gid];
				console.log(`skip adding listener for group ${gid} (still pending)`);
				continue;
			}
			var ep = this.endpoints(gid);
			for (j in ep) this.add(ep[j]);
			console.log(`add listener for group ${gid}`);
		}
		//remove unused listener
		for (gid in removed) {
			var ep = this.endpoints(gid);
			await dat.db.saved.bulkDelete(ep) //cleanup child channels for this group
			for (j in ep) {
				this.remove(ep[j]);
				if (dat.talk.status.ongoing.indexOf(ep[j]) < 0) dat.triggerChange(ep[j]); //trigger change when the data of these channels deleted
			}
			console.log(`remove listener for group ${gid}`);
		}

		this.groups = newGroups;
		localJSON.put('dat', 'groups', this.groups); //used by app.js

		//return true if there is a changes in group list
		//return false if there is no change in group list
		return !(added.length == 0 && removed.length == 0)
	},
};

window.addEventListener('firebase-status-signedin', () => {
	dat.rdb.add('group');
	dat.rdb.add('notification');

});

window.addEventListener('firebase-signout', () => {
	dat.rdb.removeAll();
});