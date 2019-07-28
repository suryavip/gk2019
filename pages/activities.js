vipPaging.pageTemplate['activities'] = {
	import: [
		'scripts/ProfileResolver.js',
	],
	preopening: () => firebaseAuth.authCheck(true),
	opening: () => {
		enableAllTippy();
		dat.attachListener(pg.loadData);
	},
	innerHTML: (d) => `
<div class="vipPaging-vLayout">
	<div class="head"><div>
		<div class="actionBar">
			<div class="button" onclick="window.history.go(-1)"><i class="fas fa-arrow-left"></i></div>
			<div class="title">${gl('title')}</div>
		</div>
	</div></div>
	<div class="body"><div><div class="maxWidthWrap-640" id="content"></div></div></div>
</div>
`,
	functions: {
		jump: (tab, id) => {
			app.state.highlightFromActivity = [tab, id];
			go('group');
		},
		loadData: async () => {
			pg.groupId = app.activeGroup.get();
			if (pg.groupId === 'empty') {
				window.history.go(-1);
				return;
			}

			var currentPage = `${pg.thisPage.id}`;
			var activities = await dat.db.saved.where({ tableName: 'activity', owner: pg.groupId }).toArray();
			if (pg.thisPage.id !== currentPage) return;

			activities.sort((a, b) => {
				if (a.updateTime < b.updateTime) return 1;
				if (a.updateTime > b.updateTime) return -1;
				return 0;
			});

			var out = [];
			var exists = {};
			for (i in activities) {
				var a = activities[i];
				a.isLatest = exists[a.index1] == null;

				var type = a.data.referTableName;
				if (a.data.oldData == null) type += '-new';
				else if (a.data.newData == null) type += '-delete';
				else type += '-edit';

				if (pg.buildChanges[a.data.referTableName] == null) var item = '';
				else var item = pg.buildChanges[a.data.referTableName](a);

				out.push(`<div class="container">
					<div class="list">
						<div class="photo"><div data-photoRefPath="profile_pic/${a.data.actorUserId}_small.jpg" data-fullPhotoRefPath="profile_pic/${a.data.actorUserId}.jpg"><i class="fas fa-user"></i></div></div>
						<div class="content" data-profile="${a.data.actorUserId}">
							<h4 data-profileData="name">...</h4>
							<h5>${moment(a.updateTime * 1000).fromNow()}</h5>
						</div>
					</div>
					<div class="aPadding-20-tandem">
						<p>${gl(type, a.data)}</p>
						${item}
					</div>
					<!--div class="bottomAction aPadding-20-tandem">
						<div class="space"></div>
						<div><i class="far fa-thumbs-down"></i><p>0</p></div>
						<div><i class="far fa-thumbs-up"></i><p>0</p></div>
					</div-->
				</div>`);

				exists[a.index1] = true;
			}

			pg.getEl('content').innerHTML = out.join('');
			photoLoader.autoLoad(pg.getEl('content'));
			ProfileResolver.fillData(pg.getEl('content'));
		},
		buildChanges: {
			announcement: function (a) {
				if (a.data.oldData == null) return `<div class="vSpace-20"></div>${pg.quickAnnouncement(a, 'new')}`;

				else if (a.data.newData == null) return `<div class="vSpace-20"></div>${pg.quickAnnouncement(a, 'old')}`;

				return `<div class="horizontalOverflow vSpace-20">
					${pg.quickAnnouncement(a, 'old')}
					<div class="arrow"><i class="fas fa-arrow-right"></i></div>
					${pg.quickAnnouncement(a, 'new')}
				</div>`;
			},
			schedule: function (a) {
				if (a.data.oldData == null) return `<div class="vSpace-20"></div>${pg.quickSchedule(a, 'new')}`;

				return `<div class="horizontalOverflow vSpace-20">
					${pg.quickSchedule(a, 'old')}
					<div class="arrow"><i class="fas fa-arrow-right"></i></div>
					${pg.quickSchedule(a, 'new')}
				</div>`;
			},
			assignment: function (a) {
				if (a.data.oldData == null) return `<div class="vSpace-20"></div>${pg.quickAssignment(a, 'new')}`;

				else if (a.data.newData == null) return `<div class="vSpace-20"></div>${pg.quickAssignment(a, 'old')}`;

				return `<div class="horizontalOverflow vSpace-20">
					${pg.quickAssignment(a, 'old')}
					<div class="arrow"><i class="fas fa-arrow-right"></i></div>
					${pg.quickAssignment(a, 'new')}
				</div>`;
			},
			exam: function (a) {
				if (a.data.oldData == null) return `<div class="vSpace-20"></div>${pg.quickExam(a, 'new')}`;

				else if (a.data.newData == null) return `<div class="vSpace-20"></div>${pg.quickExam(a, 'old')}`;

				return `<div class="horizontalOverflow vSpace-20">
					${pg.quickExam(a, 'old')}
					<div class="arrow"><i class="fas fa-arrow-right"></i></div>
					${pg.quickExam(a, 'new')}
				</div>`;
			},
		},
		quickAnnouncement: (a, dataSource) => {
			var onclick = `go('oldVersion', ['${a.rowId}', '${dataSource}'])`;
			if (a.isLatest && dataSource === 'new') onclick = `pg.jump(1, 'a${a.data.referRowId}')`;

			var data = dataSource === 'new' ? a.data.newData : a.data.oldData;

			var aTime = moment(`${data.date}${data.time != null ? ` ${data.time}` : ''}`);
			return `<div class="card aPadding-20 feedback" onclick="${onclick}">
				<h3 class="singleLine">${app.escapeHTML(data.title)}</h3>
				<h5 class="singleLine">${app.displayDate(aTime, false, data.time != null)}</h5>
				<div class="vSpace-10"></div>
				<p class="singleLine">${app.escapeHTML(app.multiToSingleLine(data.text))}</p>
			</div>`;
		},
		quickSchedule: (a, dataSource) => {
			var onclick = `go('oldVersion', ['${a.rowId}', '${dataSource}'])`;
			if (a.isLatest && dataSource === 'new') onclick = `pg.jump(2, 'a${a.data.referRowId}')`;

			var data = dataSource === 'new' ? a.data.newData : a.data.oldData;

			var subjects = [];
			var times = [];
			for (i in data) {
				var d = data[i];
				subjects.push(`<p class="singleLine">${app.escapeHTML(d.subject)}</p>`);
				var endTime = moment(d.time, 'HH:mm').add(d.length, 'minutes');
				times.push(`<h5 class="singleLine">${d.time} - ${endTime.format('HH:mm')}</h5>`);
			}
			var day = moment(a.data.referRowId[a.data.referRowId.length - 1], 'd');
			return `<div class="card aPadding-20 feedback" onclick="${onclick}">
				<h3 class="singleLine">${day.format('dddd')}</h3>
				<div class="table">
					<div>${subjects.join('')}</div>
					<div style="width: 80px; text-align: right">${times.join('')}</div>
				</div>
			</div>`;
		},
		quickAssignment: (a, dataSource) => {
			var onclick = `go('oldVersion', ['${a.rowId}', '${dataSource}'])`;
			if (a.isLatest && dataSource === 'new') onclick = `pg.jump(3, 'a${a.data.referRowId}')`;

			var data = dataSource === 'new' ? a.data.newData : a.data.oldData;

			var aTime = moment(`${data.date}${data.time != null ? ` ${data.time}` : ''}`);
			return `<div class="card aPadding-20 feedback" onclick="${onclick}">
				<h3 class="singleLine">${app.escapeHTML(data.subject)}</h3>
				<h5 class="singleLine">${app.displayDate(aTime)}</h5>
				<p class="singleLine">${app.escapeHTML(app.multiToSingleLine(data.note))}</p>
			</div>`;
		},
		quickExam: (a, dataSource) => {
			var onclick = `go('oldVersion', ['${a.rowId}', '${dataSource}'])`;
			if (a.isLatest && dataSource === 'new') onclick = `pg.jump(4, 'a${a.data.referRowId}')`;

			var data = dataSource === 'new' ? a.data.newData : a.data.oldData;

			var aTime = moment(`${data.date}${data.time != null ? ` ${data.time}` : ''}`);
			return `<div class="card aPadding-20 feedback" onclick="${onclick}">
				<h3 class="singleLine">${app.escapeHTML(data.subject)}</h3>
				<h5 class="singleLine">${app.displayDate(aTime, false, data.time != null)}</h5>
				<p class="singleLine">${app.escapeHTML(app.multiToSingleLine(data.note))}</p>
			</div>`;
		},
	},
	lang: {
		en: {
			title: 'Activities',

			'group-new': 'Created this group',
			'group-edit': p => `Changed this group's name from <strong>&quot;${app.escapeHTML(p.oldData['name'])}&quot;</strong> to <strong>&quot;${app.escapeHTML(p.newData['name'])}&quot;</strong>`,
		},
		id: {
			title: 'Aktivitas',

			'group-new': 'Membuat grup ini',
			'group-edit': p => `Mengubah nama grup ini dari <strong>&quot;${app.escapeHTML(p.oldData['name'])}&quot;</strong> menjadi <strong>&quot;${app.escapeHTML(p.newData['name'])}&quot;</strong>`,

			'announcement-new': p => `Menambahkan pengumuman berjudul <strong>&quot;${app.escapeHTML(p.newData['title'])}&quot;</strong>`,
			'announcement-edit': p => `Mengubah pengumuman berjudul <strong>&quot;${app.escapeHTML(p.oldData['title'])}&quot;</strong>`,
			'announcement-delete': p => `Menghapus pengumuman berjudul <strong>&quot;${app.escapeHTML(p.oldData['title'])}&quot;</strong>`,

			'schedule-new': p => `Menambahkan jadwal hari <strong>${moment(p.referRowId[p.referRowId.length - 1], 'd').format('dddd')}</strong>`,
			'schedule-edit': p => `Mengubah jadwal hari <strong>${moment(p.referRowId[p.referRowId.length - 1], 'd').format('dddd')}</strong>`,

			'assignment-new': p => `Menambahkan tugas <strong>&quot;${app.escapeHTML(p.newData['subject'])}&quot;</strong>`,
			'assignment-edit': p => `Mengubah tugas <strong>&quot;${app.escapeHTML(p.oldData['subject'])}&quot;</strong>`,
			'assignment-delete': p => `Menghapus tugas <strong>&quot;${app.escapeHTML(p.oldData['subject'])}&quot;</strong>`,

			'exam-new': p => `Menambahkan ujian <strong>&quot;${app.escapeHTML(p.newData['subject'])}&quot;</strong>`,
			'exam-edit': p => `Mengubah ujian <strong>&quot;${app.escapeHTML(p.oldData['subject'])}&quot;</strong>`,
			'exam-delete': p => `Menghapus ujian <strong>&quot;${app.escapeHTML(p.oldData['subject'])}&quot;</strong>`,
		},
	},
};