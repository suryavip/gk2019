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
		<div class="activable" id="content"></div>

	</div></div></div>
	<div class="foot"><div>${GroundLevel.foot(d.pageId)}</div></div>
</div>
`,
	functions: {
		load: async () => {
			var currentPage = `${pg.thisPage.id}`;
			var notification = await dat.db.saved.where({ channel: 'notification' }).first();
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
			empty: `You're all caught up!`,
		},
		id: {
			empty: 'Tidak ada notifikasi',
		},
	},
};