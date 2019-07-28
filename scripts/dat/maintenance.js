if (typeof dat === 'undefined') var dat = {};

dat.maintenance = {
	do: async function (b) {
		await this.groups(b.groups);

		await this.cleanOldActivities();
		await this.cleanExpiredParents();
		await this.cleanParentlessChilds();

		//TODO: await this.cleanAttachments();

		return true;
	},
	groups: async function (groups) {
		var groupIds = [firebaseAuth.userId];
		for (i in groups) groupIds.push(groups[i].groupId);
		var deleted = await dat.db.saved.where('owner').noneOf(groupIds).delete();
		console.log(`cleanUpGroups resulting in ${deleted}`);
		return true;
	},
	cleanOldActivities: async () => {
		var minusDays = app.comparableDate(moment().subtract(7, 'd'));
		console.log(`collecting old activities (older than (exclusive) ${minusDays})`);
		var data = await dat.db.saved.where({tableName: 'activity'}).toArray();

		var toDelete = [];
		for (i in data) {
			var r = data[i];
			if (app.comparableDate(r.updateTime * 1000) < minusDays) toDelete.push(r.rowId);
		}

		if (toDelete.length > 0) {
			console.log(`cleaning up old activities`, toDelete);
			await dat.db.saved.bulkDelete(toDelete);
		}
		else console.log(`no old activities need to be cleaned up`);
	},
	cleanExpiredParents: async () => {
		var minusDays = app.comparableDate();
		console.log(`collecting expired (older than (exclusive) ${minusDays})`);
		var data = await dat.db.saved.where('tableName').anyOf(['announcement', 'assignment', 'exam']).toArray();

		var toDelete = [];
		for (i in data) {
			var r = data[i];
			if (app.comparableDate(r.index1) < minusDays) toDelete.push(r.rowId);
		}

		if (toDelete.length > 0) {
			console.log(`cleaning up expired`, toDelete);
			await dat.db.saved.bulkDelete(toDelete);
			//child will be cleaned up by cleanParentlessChilds
		}
		else console.log(`no expired need to be cleaned up`);
	},
	cleanParentlessChilds: async () => {
		var minusDays = app.comparableDate(moment().subtract(7, 'd'));

		console.log(`collecting existing parents`);
		var parents = await dat.db.saved.where('tableName').anyOf(['schedule', 'announcement', 'assignment', 'exam']).toArray();
		var existingParent = {};
		for (i in parents) existingParent[parents[i].rowId] = true;

		console.log(`collecting parentless childs`);
		var data = await dat.db.saved.where('tableName').anyOf(['activity', 'assignmentCheck', 'examCheck']).toArray();
		var toDelete = {};
		for (i in data) {
			var r = data[i];
			if (existingParent[r.index1] === true) continue;

			if (r.tableName === 'activity' && app.comparableDate(r.updateTime * 1000) >= minusDays) {
				toDelete[r.rowId] = false;
				continue;
			}
			else if (toDelete[r.rowId] == null) toDelete[r.rowId] = true;
		}

		var td = [];
		for (i in toDelete) {
			if (toDelete[i] === false) continue;
			td.push(i);
		}

		if (toDelete.length > 0) {
			console.log(`cleaning up parentless childs`, toDelete);
			await dat.db.saved.bulkDelete(toDelete);
		}
		else console.log(`no parentless childs need to be cleaned up`);
	},
};