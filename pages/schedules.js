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

			if (pg.lastListener != null) pg.thisPage.removeEventListener('dat-change', pg.lastListener);

			if (pg.selectedGroup === firebaseAuth.userId) {
				pg.getEl('selectedGroupName').textContent = gl('private');
			}
			else if (pg.groups[pg.selectedGroup] == null) {
				//group not found, revert to private
				pg.selectedGroup = firebaseAuth.userId;
				pg.getEl('selectedGroupName').textContent = gl('private');
			}
			else {
				pg.getEl('selectedGroupName').textContent = pg.groups[pg.selectedGroup].name;
			}
			pg.lastListener = dat.attachListener(pg.load, [`schedule/${pg.selectedGroup}`]);
		},
		chooseGroup: async () => {
			var options = [{
				callBackParam: firebaseAuth.userId,
				title: gl('private'),
				icon: 'fas fa-user',
			}];
			for (gid in pg.groups) options.push({
				callBackParam: gid,
				title: app.escapeHTML(pg.groups[gid].name),
				icon: 'fas fa-users',
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
			var schedule = await dat.db.saved.where({channel: `schedule/${pg.selectedGroup}`}).first();
			if (pg.thisPage.id !== currentPage) return;

			if (schedule == null) var sch = [];
			else var sch = schedule['data'];

			sch.sort((a, b) => {
				if (a.time < b.time) return 1;
				if (a.time > b.time) return -1;
				return 0;
			});

			pg.getEl('empty').setAttribute('data-active', notif.length === 0);
			pg.getEl('content').setAttribute('data-active', notif.length > 0);
		},
	},
	lang: {
		en: {
			private: 'Private',
			empty: `You're all caught up!`,
		},
		id: {
			private: 'Pribadi',
			empty: 'Tidak ada notifikasi',
		},
	},
};