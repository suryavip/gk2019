if (typeof dat === 'undefined') var dat = {};

dat.local = {
	update: async function (channel, timestamp, data) {
		await dat.db.transaction('rw', dat.db.saved, dat.db.ownership, async () => {
			await dat.db.saved.put({
				channel: channel,
				lastTimestamp: timestamp,
				data: data,
			});

			var splitted = channel.split('/');
			var mapped = ['schedule', 'assignment', 'exam'];

			if (mapped.indexOf(splitted[0]) >= 0) {
				await dat.db.ownership.where({ channel: channel }).delete();
				var toPut = [];
				for (id in data) toPut.push({
					id: id,
					channel: channel,
				});
				await dat.db.ownership.bulkPut(toPut);
			}
		});

		if (dat.server.status.ongoing.indexOf(channel) < 2) dat.triggerChange(channel);
	},
	bulkDelete: function (owner, endpoints) {
		return dat.db.transaction('rw', dat.db.saved, dat.db.ownership, async () => {
			await dat.db.saved.bulkDelete(endpoints);
			await dat.db.ownership.where('channel').anyOf(endpoints).delete();
		});
	},
};