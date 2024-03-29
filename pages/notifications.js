vipPaging.pageTemplate['notifications'] = {
	import: [
		'scripts/GroundLevel.js',
		'scripts/ProfileResolver.js',
	],
	preopening: () => firebaseAuth.authCheck(true),
	opening: () => {
		GroundLevel.init();
		dat.attachListener(pg.load, ['group', 'notification']);
		dat.server.status.listen(status => {
			pg.getEl('loader').setAttribute('data-active', status > 0);
		});
	},
	innerHTML: d => `
<div class="vipPaging-vLayout">
	<div class="head"><div>${GroundLevel.head(d.pageId)}</div></div>
	<div class="body"><div><div class="maxWidthWrap-640">
		
		<div class="activable" data-active="true" id="loader">${vipLoading.loader}</div>
		<div class="aPadding-30 activable" style="text-align:center" id="empty">
			<h2>${gl('empty')}</h2>
			<div class="vSpace-30"></div>
			<img src="illustrations/undraw_confirmed_81ex.svg" width="200px" />
		</div>
		<div id="content"></div>

	</div></div></div>
	<div class="foot"><div>${GroundLevel.foot(d.pageId)}</div></div>
</div>
`,
	functions: {
		load: async () => {
			var oldestLimit = app.comparableDate(moment().subtract(3, 'd'));
			var currentPage = `${pg.thisPage.id}`;
			var groups = await dat.db.group.toArray();
			var notifications = await dat.db.notification.orderBy('time').filter(n => app.comparableDate(n.time * 1000) >= oldestLimit).toArray();
			if (pg.thisPage.id !== currentPage) return;

			//clear newIndicator
			setTimeout(() => {
				if (pg.thisPage.id !== currentPage) return;
				localJSON.put('newIndicator', 'notification', false);
				console.log('newIndicator notification clear')
				pg.getEl('groundLevelNotifNewIndicator').setAttribute('data-active', false);
			}, 2000);

			//make groupName dict by groupId
			pg.groupName = {};
			for (i in groups) pg.groupName[groups[i].groupId] = groups[i].name;

			//reverse sort
			notifications.reverse();

			var out = '';
			var tagItem = {};
			for (i in notifications) {
				var n = notifications[i];
				console.log(n);

				if (n.data.groupId != null && n.data.groupId in pg.groupName !== true) {
					console.log('not in group');
					continue; //not in group
				}

				//skip if not the latest
				if (n.type.startsWith('assignment')) {
					if (tagItem[n.data.assignmentId] === true) {
						console.log('not the latest');
						continue;
					}
					tagItem[n.data.assignmentId] = true;
				}
				if (n.type.startsWith('exam')) {
					if (tagItem[n.data.examId] === true) {
						console.log('not the latest');
						continue;
					}
					tagItem[n.data.examId] = true;
				}
				if (n.type.startsWith('schedule')) {
					if (tagItem[n.data.scheduleId] === true) {
						console.log('not the latest');
						continue;
					}
					tagItem[n.data.scheduleId] = true;
				}

				out += pg.build(n);
			}
			pg.getEl('content').innerHTML = out;

			photoLoader.autoLoad(pg.getEl('content'));
			ProfileResolver.fillData(pg.getEl('content'));

			pg.getEl('empty').setAttribute('data-active', out === '');
		},
		build: n => {
			var onclick = '';
			if (['assignment-new', 'assignment-edit'].indexOf(n.type) >= 0) onclick = `GroundLevel.highlight('assignmentsAndExams', '${n.data.assignmentId}')`;

			if (['exam-new', 'exam-edit'].indexOf(n.type) >= 0) onclick = `GroundLevel.highlight('assignmentsAndExams', '${n.data.examId}')`;

			if (n.type === 'schedule-edit') onclick = `GroundLevel.highlight('schedules', '${n.data.scheduleId}')`;

			var isGroupThings = [
				'group-edit',
				'pending-new',
				'member-new-target',
				'member-new',
				'admin-new-target',
				'admin-new',
				'admin-stop',
				'member-delete-self',
				'member-delete',
				'admin-delete',
			];
			if (isGroupThings.indexOf(n.type) >= 0) onclick = `go('group', '${n.data.groupId}')`;

			var card = '';
			/*card = `<div class="aPadding-20-tandem"><div class="card list feedback">
				<div class="iconCircle"><div><i class="fas fa-minus"></i></div></div>
				<!--div class="iconCircle"><div class="theme-positive"><i class="fas fa-check"></i></div></div-->
				<div class="content childSingleLine" onclick="GroundLevel.highlight('assignmentsAndExams', '${assignmentId}')">
					<h4>${app.escapeHTML(a.subject)}</h4>
					${note}
				</div>
			</div></div>`;*/

			if (n.data.performerName != null) n.data.performerName = `<strong data-profile="${n.data.performerUserId}" data-profileData="name">${app.escapeHTML(n.data.performerName)}</strong>`;

			if (n.data.targetName != null) n.data.targetName = `<strong data-profile="${n.data.targetUserId}" data-profileData="name">${app.escapeHTML(n.data.targetName)}</strong>`;

			if (n.data.groupName != null) {
				n.data.groupName = `<strong>${app.escapeHTML(n.data.groupName)}</strong>`;
				n.data.newGroupName = `<strong>${app.escapeHTML(pg.groupName[n.data.groupId])}</strong>`;
			}

			if (n.data.subject != null) n.data.subject = `<strong>${app.escapeHTML(n.data.subject)}</strong>`;

			if (n.data.day != null) n.data.dayName = `<strong>${moment(n.data.day, 'd').format('dddd')}</strong>`;

			var notifText = gl(n.type, n.data);
			if (notifText == null) {
				console.log('notif text not supported');
				return '';
			}

			return `<div class="container">
				<div class="list feedback">
					<div class="photo"><div data-photoRefPath="profile_pic/${n.data.performerUserId}_thumb" data-fullPhotoRefPath="profile_pic/${n.data.performerUserId}"><i class="fas fa-user"></i></div></div>
					<div class="content" onclick="${onclick}">
						<p>${notifText}</p>
						<h5>${moment(n.time * 1000).fromNow()}</h5>
					</div>
				</div>
				${card}
			</div>`;
		},
	},
	lang: {
		en: {
			empty: `You're all caught up!`,

			'assignment-new': p => `${p['performerName']} added new ${p['subject']}\'s assignment`,
			'assignment-edit': p => `${p['performerName']} edited ${p['subject']}\'s assignment`,
			'assignment-delete': p => `${p['performerName']} deleted ${p['subject']}\'s assignment`,
			'exam-new': p => `${p['performerName']} added new ${p['subject']}\'s exam`,
			'exam-edit': p => `${p['performerName']} edited ${p['subject']}\'s exam`,
			'exam-delete': p => `${p['performerName']} deleted ${p['subject']}\'s exam`,
			'group-edit': p => `${p['performerName']} changed ${p['groupName']} group info's`,
			'pending-new': p => `${p['performerName']} asked to join ${p['newGroupName']}`,
			'member-new-target': p => `${p['performerName']} accepted you to join ${p['newGroupName']}`,
			'member-new': p => `${p['performerName']} accepted ${p['targetName']} to join ${p['newGroupName']}`,
			'admin-new-target': p => `${p['performerName']} promoted you as admin of ${p['newGroupName']}`,
			'admin-new': p => `${p['performerName']} promoted ${p['targetName']} as admin of ${p['newGroupName']}`,
			'admin-stop': p => `${p['performerName']} stopped from being admin of ${p['newGroupName']}`,
			'member-delete-self': p => `${p['performerName']} left from ${p['newGroupName']}`,
			'member-delete': p => `${p['performerName']} kicked ${p['targetName']} from ${p['newGroupName']}`,
			'admin-delete': p => `${p['performerName']} left from ${p['newGroupName']}`,
			'schedule-edit': p => `${p['performerName']} changed ${p['dayName']}\'s schedule`,
		},
		id: {
			empty: 'Tidak ada notifikasi',

			'assignment-new': p => `${p['performerName']} menambahkan tugas ${p['subject']}`,
			'assignment-edit': p => `${p['performerName']} mengubah tugas ${p['subject']}`,
			'assignment-delete': p => `${p['performerName']} menghapus tugas ${p['subject']}`,
			'exam-new': p => `${p['performerName']} menambahkan ujian ${p['subject']}`,
			'exam-edit': p => `${p['performerName']} mengubah ujian ${p['subject']}`,
			'exam-delete': p => `${p['performerName']} menghapus ujian ${p['subject']}`,
			'group-edit': p => `${p['performerName']} mengubah info grup ${p['groupName']}`,
			'pending-new': p => `${p['performerName']} meminta bergabung kedalam grup ${p['newGroupName']}`,
			'member-new-target': p => `${p['performerName']} menerima kamu bergabung kedalam grup ${p['newGroupName']}`,
			'member-new': p => `${p['performerName']} menerima ${p['targetName']} bergabung kedalam grup ${p['newGroupName']}`,
			'admin-new-target': p => `${p['performerName']} menjadikan kamu sebagai admin grup ${p['newGroupName']}`,
			'admin-new': p => `${p['performerName']} menjadikan ${p['targetName']} sebagai admin grup ${p['newGroupName']}`,
			'admin-stop': p => `${p['performerName']} berhenti menjadi admin grup ${p['newGroupName']}`,
			'member-delete-self': p => `${p['performerName']} keluar dari grup ${p['newGroupName']}`,
			'member-delete': p => `${p['performerName']} mengeluarkan ${p['targetName']} dari grup ${p['newGroupName']}`,
			'admin-delete': p => `${p['performerName']} keluar dari grup ${p['newGroupName']}`,
			'schedule-edit': p => `${p['performerName']} mengubah jadwal hari ${p['dayName']}`,
		},
	},
};