if (typeof dat === 'undefined') var dat = {};

dat.rdb = {
	cacheUserId: '', //filled on status sign in
	ignore: {},
	update: function (id) {
		if (id == null) id = this.cacheUserId;
		var scope = id === this.cacheUserId ? 'user' : 'group';
		this.ignore[id] = true;
		var ref = firebase.database().ref(`${scope}/${id}/lastChange`);
		var timestamp = firebase.database.ServerValue.TIMESTAMP;
		ref.set(timestamp, () => { });
	},
	personalOnChange: function (snapshot) {
		var newVal = snapshot.val();
		if (newVal == null) return;
		if (dat.rdb.ignore[dat.rdb.cacheUserId] === true) {
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
		}
	},
	groupOnChange: function (snapshot) {
		var newVal = snapshot.val();
		if (newVal == null) return;
		var id = snapshot.ref.parent.key;
		if (dat.rdb.ignore[id] === true) {
			delete dat.rdb.ignore[id];
			return;
		}
		if (dat.sync.status.value <= 0) {
			console.log('group rdb change!');
			dat.sync.start();
		}
		else console.log('group rdb change ignored');
	},
	groups: [],
	manageGroupListeners: function (gou) {
		var newGroups = [];
		for (i in gou) newGroups.push(gou[i].groupId);

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
			var ref = firebase.database().ref(`group/${added[i]}/lastChange`);
			console.log(`add listener for group ${added[i]}`);
			this.ignore[added[i]] = true;
			ref.on('value', this.groupOnChange);
		}
		//remove unused listener
		for (i in removed) {
			var ref = firebase.database().ref(`group/${removed[i]}/lastChange`);
			console.log(`remove listener for group ${removed[i]}`);
			ref.off('value', this.groupOnChange);
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
	var lastChange = firebase.database().ref(`user/${dat.rdb.cacheUserId}/lastChange`);
	lastChange.on('value', dat.rdb.personalOnChange);

	//install group listener
	dat.rdb.groups = localJSON.get('dat', 'groups') || [];
	for (i in dat.rdb.groups) {
		var ref = firebase.database().ref(`group/${dat.rdb.groups[i]}/lastChange`);
		ref.on('value', dat.rdb.groupOnChange);
	}
});

window.addEventListener('firebase-signout', () => {
	var lastChange = firebase.database().ref(`user/${dat.rdb.cacheUserId}/lastChange`);
	lastChange.off('value', dat.rdb.personalOnChange);

	//stop listening for groups changes
	var groups = dat.rdb.groups;
	for (i in groups) {
		var ref = firebase.database().ref(`group/${groups[i]}/lastChange`);
		ref.off('value', dat.rdb.groupOnChange);
	}
	dat.rdb.groups = [];
});