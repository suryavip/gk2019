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
					await dat.db.member.where({ groupId: splitted[1] }).delete();
					for (i in data) data[i]['groupId'] = splitted[1];
					await dat.db.member.bulkPut(data);
				}
				else if (splitted[0] === 'schedule') {
					await dat.db.schedule.where({ owner: splitted[1], source: 'server' }).delete();
					for (i in data) {
						data[i]['owner'] = splitted[1];
						data[i]['source'] = 'server';
					}
					await dat.db.schedule.bulkPut(data);
				}
				else if (splitted[0] === 'assignment') {
					await dat.db.assignment.where({ owner: splitted[1], source: 'server' }).delete();
					for (i in data) {
						data[i]['owner'] = splitted[1];
						data[i]['source'] = 'server';
					}
					await dat.db.assignment.bulkPut(data);
				}
				else if (splitted[0] === 'exam') {
					await dat.db.exam.where({ owner: splitted[1], source: 'server' }).delete();
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
				await dat.db.member.where({ groupId: owner }).delete();
				await dat.db.schedule.where({ owner: owner }).delete();
				await dat.db.assignment.where({ owner: owner }).delete();
				await dat.db.exam.where({ owner: owner }).delete();
			});
	},

	private: {
		opinion: {
			put: async function (type, parentId, checked) {
				await dat.db.opinion.put({
					type: type, //this is addition info for when actually sending request
					parentId: parentId, //not used when actually sending request
					//parentId will be transformed to ${type}Id when actually sending request
					checked: checked === true,

					source: 'local',
				});
				dat.triggerChange('opinion');
				dat.server.pending.opinion.put();
			},
		},
		schedule: {
			put: async function (day, data) {
				await dat.db.schedule.put({
					scheduleId: `${firebaseAuth.userId}schedule${day}`, //not used when actually sending request
					day: day, //this is addition info for when actually sending request
					data: data,

					owner: firebaseAuth.userId,
					source: 'local',
				});
				dat.triggerChange(`schedule/${firebaseAuth.userId}`);
				dat.server.pending.schedule.put();
			},
		},
		generateId: tableName => `${firebaseAuth.userId}${tableName}${new Date().getTime().toString(36)}`,
		assignment: {
			post: async function (subject, dueDate, note, attachment, attachmentUploadDate) {
				await dat.db.assignment.put({
					assignmentId: dat.local.private.generateId('assignment'),
					subject: subject,
					dueDate: dueDate,
					note: note,
					attachment: attachment,
					attachmentUploadDate: attachmentUploadDate, //this is addition info for when actually sending request

					owner: firebaseAuth.userId,
					source: 'local-new',
				});
				dat.triggerChange(`assignment/${firebaseAuth.userId}`);
				dat.server.pending.assignment.post();
			},
			put: async function (assignmentId, dueDate, note, attachment, attachmentUploadDate) {
				var currentSource = await dat.db.assignment.where({ assignmentId: assignmentId }).first();
				await dat.db.assignment.update(assignmentId, {
					dueDate: dueDate,
					note: note,
					attachment: attachment,
					attachmentUploadDate: attachmentUploadDate, //this is addition info for when actually sending request

					source: currentSource.source === 'local-new' ? 'local-new' : 'local',
				});
				dat.triggerChange(`assignment/${firebaseAuth.userId}`);
				if (currentSource.source === 'local-new') dat.server.pending.assignment.post();
				else dat.server.pending.assignment.put();
			},
			delete: async function (assignmentId) {
				await dat.db.transaction(
					'rw',
					dat.db.assignment,
					dat.db.deletedAssignment,
					dat.db.opinion,
					async () => {
						await dat.db.deletedAssignment.put({ assignmentId: assignmentId });
						await dat.db.assignment.delete(assignmentId);
						//delete pending related opinion too
						await dat.db.opinion.where({parentId: assignmentId, source: 'local'}).delete();
					});
				dat.triggerChange(`assignment/${firebaseAuth.userId}`);
				dat.server.pending.assignment.delete();
			},
		},
		exam: {
			post: async function (subject, examDate, examTime, note, attachment, attachmentUploadDate) {
				await dat.db.exam.put({
					examId: dat.local.private.generateId('exam'),
					subject: subject,
					examDate: examDate,
					examTime: examTime,
					note: note,
					attachment: attachment,
					attachmentUploadDate: attachmentUploadDate, //this is addition info for when actually sending request

					owner: firebaseAuth.userId,
					source: 'local-new',
				});
				dat.triggerChange(`exam/${firebaseAuth.userId}`);
				dat.server.pending.exam.post();
			},
			put: async function (examId, examDate, examTime, note, attachment, attachmentUploadDate) {
				var currentSource = await dat.db.exam.where({ examId: examId }).first();
				await dat.db.exam.update(examId, {
					examDate: examDate,
					examTime: examTime,
					note: note,
					attachment: attachment,
					attachmentUploadDate: attachmentUploadDate, //this is addition info for when actually sending request

					source: currentSource.source === 'local-new' ? 'local-new' : 'local',
				});
				dat.triggerChange(`exam/${firebaseAuth.userId}`);
				if (currentSource.source === 'local-new') dat.server.pending.exam.post();
				else dat.server.pending.exam.put();
			},
			delete: async function (examId) {
				await dat.db.transaction(
					'rw',
					dat.db.exam,
					dat.db.deletedExam,
					dat.db.opinion,
					async () => {
						await dat.db.deletedExam.put({ examId: examId });
						await dat.db.exam.delete(examId);
						//delete pending related opinion too
						await dat.db.opinion.where({parentId: examId, source: 'local'}).delete();
					});
				dat.triggerChange(`exam/${firebaseAuth.userId}`);
				dat.server.pending.exam.delete();
			},
		},
	},
};