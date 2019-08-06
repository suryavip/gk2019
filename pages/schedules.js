vipPaging.pageTemplate['schedules'] = {
	import: [
		'scripts/GroundLevel.js',
		'scripts/ProfileResolver.js',
	],
	preopening: () => firebaseAuth.authCheck(true),
	opening: () => {
		GroundLevel.init();
		dat.attachListener(pg.loadGroup, ['group']);
	},
	innerHTML: d => `
<div class="vipPaging-vLayout">
	<div class="head"><div>${GroundLevel.head(d.pageId)}</div></div>
	<div class="body"><div><div class="maxWidthWrap-640">
		
		<div class="container-20">
			<div class="card list feedback" onclick="pg.chooseGroup()">
				<div class="content"><h2 id="selectedGroupName">${gl('private')}</h2></div>
				<div class="icon"><i class="fas fa-sort-down"></i></div>
			</div>
		</div>
		<div id="content"></div>

	</div></div></div>
	<div class="foot"><div>${GroundLevel.foot(d.pageId)}</div></div>
</div>
`,
	functions: {
		selectedGroup: firebaseAuth.userId,
		loadGroup: async () => {
			var currentPage = `${pg.thisPage.id}`;
			pg.groups = await dat.db.saved.where({ channel: 'group' }).first();
			if (pg.thisPage.id !== currentPage) return;

			if (pg.groups == null) pg.groups = {};
			else pg.groups = pg.groups.data;

			pg.groups[firebaseAuth.userId] = { name: gl('private') };

			if (pg.lastListener != null) pg.thisPage.removeEventListener('dat-change', pg.lastListener);

			if (pg.groups[pg.selectedGroup] == null) {
				//group not found, revert to private
				pg.selectedGroup = firebaseAuth.userId;
			}
			pg.getEl('selectedGroupName').textContent = pg.groups[pg.selectedGroup].name;
			pg.lastListener = dat.attachListener(pg.load, [`schedule/${pg.selectedGroup}`]);
		},
		chooseGroup: async () => {
			var options = [];
			for (gid in pg.groups) options.push({
				callBackParam: gid,
				title: app.escapeHTML(pg.groups[gid].name),
				icon: gid === firebaseAuth.userId ? 'fas fa-user' : 'fas fa-users',
			});
			options.sort((a, b) => {
				if (a.callBackParam === firebaseAuth.userId) return -1;
				if (b.callBackParam === firebaseAuth.userId) return 1;
				if (a.title < b.title) return -1;
				if (a.title > b.title) return 1;
				return 0;
			});
			ui.popUp.option(options, groupId => {
				if (groupId == null) return;
				if (groupId === pg.selectedGroup) return;
				pg.selectedGroup = groupId;
				pg.loadGroup();
			});
		},
		load: async () => {
			var currentPage = `${pg.thisPage.id}`;
			var schedules = await dat.db.saved.where({channel: `schedule/${pg.selectedGroup}`}).first();
			if (pg.thisPage.id !== currentPage) return;

			if (schedules == null) schedules = [];
			else schedules = schedules.data;

			var byDay = {};
			for (sid in schedules) {
				var s = schedules[sid];
				byDay[sid[sid.length - 1]] = s;
			}

			var day = moment();
			var out = [];
			while (out.length < 7) {
				var schedule = byDay[day.format('d')];
				var sid = `${pg.selectedGroup}schedule${day.format('d')}`;
				
				if (schedule == null || schedule.length < 1) {
					out.push(`<div class="container-20 highlightable" id="a${sid}">
						<h1>${day.format('dddd')}</h1>
						<div class="vSpace-20"></div>
						<p>${gl('empty')}</p>
						<div class="vSpace-20"></div>
						<div class="bottomAction">
							<div class="space"></div>
							<div onclick="go('scheduleForm', '${sid}')"><i class="fas fa-pen"></i><p>${gl('edit')}</p></div>
						</div>
					</div>`);
					day.add(1, 'days');
					continue;
				}

				var subjects = [];
				var times = [];
				for (i in schedule) {
					var d = schedule[i];
					subjects.push(`<h4>${app.escapeHTML(d.subject)}</h4>`);
					var endTime = moment(d.time, 'HH:mm').add(d.length, 'minutes');
					times.push(`<p>${d.time} - ${endTime.format('HH:mm')}</p>`);
				}

				out.push(`<div class="container-20 highlightable" id="a${sid}">
					<h1>${day.format('dddd')}</h1>
					<div class="vSpace-20"></div>
					<div class="table">
						<div>${subjects.join('')}</div>
						<div style="width: 80px; text-align: right">${times.join('')}</div>
					</div>
					<div class="vSpace-20"></div>
					<div class="bottomAction">
						<div class="space"></div>
						<div onclick="go('scheduleForm', '${sid}')"><i class="fas fa-pen"></i><p>${gl('edit')}</p></div>
					</div>
				</div>`);
				day.add(1, 'days');
			}
			pg.getEl('content').innerHTML = out.join('');
		},
	},
	lang: {
		en: {
			private: 'Private',
			empty: `You're all caught up!`,
			edit: 'Edit',
		},
		id: {
			private: 'Pribadi',
			empty: 'Tidak ada notifikasi',
			edit: 'Ubah',
		},
	},
};