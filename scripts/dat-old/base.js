if (typeof dat === 'undefined') var dat = {};

dat.init = () => {
	dat.db = new Dexie(`${projectId}_data`);

	dat.db.version(1).stores({
		saved: 'rowId,tableName,[tableName+owner],[tableName+index1],synced,owner',
		deleted: 'rowId',
	});

	dat.deleteConstraint = {
		//none because assignment and exam data are group based
	};
	//when a row from parent deleted, delete all rows from childs which have the foreignKeyReferToParentsRowId (index1 depends on described) match with parent's rowId
	/*PATTERN:
	'parent': {
		'child': 'foreignKeyReferToParentsRowId',
		'child2': 'foreignKeyReferToParentsRowId',
	}*/

	dat.sync.init();
	//dat.rdb.init();
	//dat.maintenance.init();
};

dat.generateId = i => `${i}${new Date().getTime().toString(36)}`;
dat.put = function (tableName, rowId, data, index, forcePut, groupIdCache) {
	/* NOTES FOR INDEX
	dat.put('test', null, {'nama': 'bimo', 'umur': 17}, {'index1': 'umur'})
	means will store umur value on index1
	*/
	//groupIdCache used when storing group's data cache. like when storing member list cache
	var db = dat.db.saved;
	if (index == null) index = {};
	return new Promise((resolve, reject) => {
		var row = {
			//auto value
			updateTime: parseInt(new Date().getTime() / 1000),
			synced: `${typeof groupIdCache === 'string'}`,
			//indexes
			rowId: (rowId == null) ? dat.generateId(tableName) : rowId,
			tableName: tableName,
			index1: index.index1 == null ? null : data[index.index1],
			//data
			data: data,
		};

		if (typeof groupIdCache === 'string') row.owner = groupIdCache; //to make this cache auto deleteable

		if (rowId == null || forcePut) {
			console.log(row);
			db.put(row).then(newKey => {
				console.log(`put ${tableName}`);
				if (typeof groupIdCache !== 'string') dat.triggerChange(true, 'dat.put 1');
				resolve(newKey);
			}).catch(e => { reject(e); });
		}
		else db.update(rowId, row).then(rowAffected => {
			console.log(`update ${tableName}`);
			if (typeof groupIdCache !== 'string') dat.triggerChange(true, 'dat-put 2');
			if (rowAffected === 1) resolve(rowId);
			else {
				//not posible for "no data changes" to happen because updateTime is always updated
				//the only cause for no data updated is because no primaryKey matched/found
				reject('NOT_FOUND');
			}
		}).catch(e => { reject(e); });
	});
};
dat.delete = (tableName, rowId) => new Promise((resolve, reject) => {
	//get what affected tables
	var childTables = dat.deleteConstraint[tableName];
	dat.db.transaction('rw', dat.db.saved, dat.db.deleted, async () => {
		await dat.db.saved.where({ tableName: tableName, rowId: rowId }).delete();
		var deleteTime = parseInt(new Date().getTime() / 1000);
		var toDelete = [{
			rowId: rowId,
			tableName: tableName,
			deleteTime: deleteTime,
		}];
		//deleting childs
		for (childTableName in childTables) {
			var foreignKeyName = childTables[childTableName];
			console.log(`deleting child (${childTableName}) that have ${foreignKeyName}: ${rowId}`);
			var q = { tableName: childTableName };
			q[foreignKeyName] = rowId;
			var t = await dat.db.saved.where(q).toArray();
			var childToDelete = [];
			for (i in t) {
				toDelete.push({
					rowId: t[i].rowId,
					tableName: childTableName,
					deleteTime: deleteTime,
				});
				childToDelete.push(t[i].rowId);
			}
			await dat.db.saved.bulkDelete(childToDelete);
		}
		await dat.db.deleted.bulkPut(toDelete);
	}).then(() => {
		dat.triggerChange(true, 'dat.delete');
		resolve();
	}).catch(e => {
		console.error(e);
		reject(e);
	});
});

dat.triggerChange = function (startSync, identifier) {
	console.log('change triggered', startSync, identifier);
	pg.thisPage.dispatchEvent(new Event(`dat-change`));
	window.dispatchEvent(new Event(`dat-change`));
	if (startSync) dat.sync.start();
};
dat.attachListener = function (callBack) {
	pg.thisPage.addEventListener(`dat-change`, callBack);
	callBack();
};

window.addEventListener('firebase-signout', () => {
	dat.db.delete().then(() => {
		dat.init();
	});
	localJSON.drop('dat');
});