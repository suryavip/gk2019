vipPaging.pageTemplate['notifications'] = {
	import: [
		'scripts/GroundLevel.js',
		'scripts/ProfileResolver.js',
	],
	preopening: () => firebaseAuth.authCheck(true),
	opening: () => {
		GroundLevel.init();
		dat.attachListener(pg.load, ['notification']);
	},
	innerHTML: d => `
<div class="vipPaging-vLayout">
	<div class="head"><div>${GroundLevel.head(d.pageId)}</div></div>
	<div class="body"><div><div class="maxWidthWrap-640">
		
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
			var currentPage = `${pg.thisPage.id}`;
			var notification = await dat.db.saved.where({ channel: 'notification' }).first();
			if (pg.thisPage.id !== currentPage) return;

			if (notification == null) notification = [];
			else notification = notification.data;

			notification.sort((a, b) => {
				if (a.time < b.time) return 1;
				if (a.time > b.time) return -1;
				return 0;
			});

			var out = '';
			for (i in notification) {
				var n = notification[i];

				var card = '';
				/*card = `<div class="aPadding-20-tandem"><div class="card list feedback">
					<div class="iconCircle"><div><i class="fas fa-minus"></i></div></div>
					<!--div class="iconCircle"><div class="theme-positive"><i class="fas fa-check"></i></div></div-->
					<div class="content childSingleLine" onclick="GroundLevel.highlight('assignmentsAndExams', '${assignmentId}')">
						<h4>${app.escapeHTML(a.subject)}</h4>
						${note}
					</div>
				</div></div>`;*/

				console.log(n);

				out += `<div class="container">
					<div class="list">
						<div class="photo"><div data-photoRefPath="profile_pic/${n.data.performerUserId}_small.jpg" data-fullPhotoRefPath="profile_pic/${n.data.performerUserId}.jpg"><i class="fas fa-user"></i></div></div>
						<div class="content" data-profile="${n.data.performerUserId}">
							<h4 data-profileData="name">${app.escapeHTML(n.data.performerName)}</h4>
							<h5>${moment(n.time * 1000).fromNow()}</h5>
						</div>
					</div>
					${card}
				</div>`;
			}
			pg.getEl('content').innerHTML = out;

			photoLoader.autoLoad(pg.getEl('content'));
			ProfileResolver.fillData(pg.getEl('content'));

			pg.getEl('empty').setAttribute('data-active', out === '');
		},
	},
	lang: {
		en: {
			empty: `You're all caught up!`,

			'assignment-new': '',
			'assignment-edit': '',
			'assignment-delete': '',
			'exam-new': '',
			'exam-edit': '',
			'exam-delete': '',
			'group-edit': p => `${p['performerName']} changed ${p['groupName']} group info's`,
			'pending-new': p => `${p['performerName']} asked to join ${p['groupName']}`,
			'member-new-target': p => `${p['performerName']} accepted you to join ${p['groupName']}`,
			'member-new': p => `${p['performerName']} accepted ${p['targetName']} to join ${p['groupName']}`,
			'admin-new-target': p => `${p['performerName']} promoted you as admin of ${p['groupName']}`,
			'admin-new': p => `${p['performerName']} promoted ${p['targetName']} as admin of ${p['groupName']}`,
			'admin-stop': p => `${p['performerName']} stopped from being admin of ${p['groupName']}`,
			'member-delete-self': p => `${p['performerName']} left from ${p['groupName']}`,
			'member-delete': p => `${p['performerName']} kicked ${p['targetName']} from ${p['groupName']}`,
			'admin-delete': p => `${p['performerName']} left from ${p['groupName']}`,
			'schedule-edit': '',
		},
		id: {
			empty: 'Tidak ada notifikasi',

			'assignment-new': '',
			'assignment-edit': '',
			'assignment-delete': '',
			'exam-new': '',
			'exam-edit': '',
			'exam-delete': '',
			'group-edit': p => `${p['performerName']} mengubah info grup ${p['groupName']}`,
			'pending-new': p => `${p['performerName']} meminta bergabung kedalam grup ${p['groupName']}`,
			'member-new-target': p => `${p['performerName']} menerima kamu bergabung kedalam grup ${p['groupName']}`,
			'member-new': p => `${p['performerName']} menerima ${p['targetName']} bergabung kedalam grup ${p['groupName']}`,
			'admin-new-target': p => `${p['performerName']} menjadikan kamu sebagai admin grup ${p['groupName']}`,
			'admin-new': p => `${p['performerName']} menjadikan ${p['targetName']} sebagai admin grup ${p['groupName']}`,
			'admin-stop': p => `${p['performerName']} berhenti menjadi admin grup ${p['groupName']}`,
			'member-delete-self': p => `${p['performerName']} keluar dari grup ${p['groupName']}`,
			'member-delete': p => `${p['performerName']} mengeluarkan ${p['targetName']} dari grup ${p['groupName']}`,
			'admin-delete': p => `${p['performerName']} keluar dari grup ${p['groupName']}`,
			'schedule-edit': '',
		},
	},
};