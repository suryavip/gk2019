if (typeof dat === 'undefined') var dat = {};

dat.local = {
	update: async function (channel, timestamp, data) {
		await dat.db.transaction(
			'rw',
			dat.db.lastTimestamp,
			dat.db.group,
			dat.db.notification,
			dat.db.opinion,
			dat.db.member,
			dat.db.schedule,
			dat.db.assignment,
			dat.db.exam,
			async () => {
				await dat.db.lastTimestamp.put({
					channel: channel,
					lastTimestamp: timestamp,
				});

				var splitted = channel.split('/');

				if (splitted[0] === 'group') {
					await dat.db.group.clear();
					await dat.db.group.bulkPut(data);
				}
				else if (splitted[0] === 'notification') {
					await dat.db.notification.clear();
					await dat.db.notification.bulkPut(data);
				}
				else if (splitted[0] === 'opinion') {
					await dat.db.opinion.where({ source: 'server' }).delete();
					for (i in data) data[i]['source'] = 'server';
					await dat.db.opinion.bulkPut(data);
				}
				else if (splitted[0] === 'member') {
					await dat.db.member.clear();
					for (i in data) data[i]['groupId'] = splitted[1];
					await dat.db.member.bulkPut(data);
				}
				else if (splitted[0] === 'schedule') {
					await dat.db.schedule.where({ source: 'server' }).delete();
					for (i in data) {
						data[i]['owner'] = splitted[1];
						data[i]['source'] = 'server';
					}
					await dat.db.schedule.bulkPut(data);
				}
				else if (splitted[0] === 'assignment') {
					await dat.db.assignment.where({ source: 'server' }).delete();
					for (i in data) {
						data[i]['owner'] = splitted[1];
						data[i]['source'] = 'server';
					}
					await dat.db.assignment.bulkPut(data);
				}
				else if (splitted[0] === 'exam') {
					await dat.db.exam.where({ source: 'server' }).delete();
					for (i in data) {
						data[i]['owner'] = splitted[1];
						data[i]['source'] = 'server';
					}
					await dat.db.exam.bulkPut(data);
				}
			});

		if (dat.server.status.ongoing.indexOf(channel) < 2) dat.triggerChange(channel);
	},
	bulkDelete: function (owner, endpoints) {
		return dat.db.transaction(
			'rw',
			dat.db.lastTimestamp,
			dat.db.member,
			dat.db.schedule,
			dat.db.assignment,
			dat.db.exam,
			async () => {
				await dat.db.lastTimestamp.bulkDelete(endpoints);
				await dat.db.member.where({ owner: owner }).delete();
				await dat.db.schedule.where({ owner: owner }).delete();
				await dat.db.assignment.where({ owner: owner }).delete();
				await dat.db.exam.where({ owner: owner }).delete();
			});
	},
};