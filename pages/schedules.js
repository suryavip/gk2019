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
			<div class="card list feedback">
				<div class="content"><h2 id="selectedGroup">Group Name</h2></div>
				<div class="icon"><i class="fas fa-sort-down"></i></div>
			</div>
		</div>
		<div id="content"></div>

	</div></div></div>
	<div class="foot"><div>${GroundLevel.foot(d.pageId)}</div></div>
</div>
`,
	functions: {
		/*loadGroup: async () => {
			var currentPage = `${pg.thisPage.id}`;
			var group = await dat.db.saved.where({ channel: 'group' }).first();
			if (pg.thisPage.id !== currentPage) return;

			var gr = [{
				groupId: firebaseAuth.userId,
				name: gl('private'),
			}];
			for (g in group) gr.push({
				groupId: g,
				name: group[g].name,
			});

			gr.sort((a, b) => {
				if (a.name < b.name) return -1;
				if (a.name > b.name) return 1;
				return 0;
			});
		},*/
		load: async () => {
			var currentPage = `${pg.thisPage.id}`;
			var schedule = await dat.db.saved.where(channel).first();
			if (pg.thisPage.id !== currentPage) return;

			if (notification == null) var notif = [];
			else var notif = notification['data'];

			notif.sort((a, b) => {
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