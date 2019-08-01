vipPaging.pageTemplate['groups'] = {
	preopening: () => firebaseAuth.authCheck(true),
	opening: () => {
		enableAllTippy();
		dat.attachListener(pg.load, ['group']);
	},
	innerHTML: (d) => `
<div class="vipPaging-vLayout">
	<div class="head"><div>
		<div class="actionBar">
			<div class="button" onclick="window.history.go(-1)"><i class="fas fa-arrow-left"></i></div>
			<div class="title">${gl('title')}</div>
		</div>
	</div></div>
	<div class="body">
		<div>
			<div class="maxWidthWrap-640">

				<div class="aPadding-30 activable" style="text-align:center" id="empty">
					<h2>${gl('emptyText')}</h2>
					<div class="vSpace-30"></div>
					<img src="illustrations/undraw_welcome_3gvl.svg" width="200px" />
					<div class="vSpace-30"></div>
					<button class="primary" onclick="go('groupForm')">${gl('createGroup')}</button>
					<div class="vSpace-30"></div>
					<h3>${gl('joinTips')}</h3>
				</div>

				<div class="activable" id="content"></div>

			</div>
			<div class="vipPaging-floatingButtonSpace"></div>
		</div>
		<div class="vipPaging-floatingButton"><div onclick="go('groupForm')" title="${gl('createGroup')}"><i class="fas fa-plus"></i></div></div>
	</div>
</div>
`,
	functions: {
		load: async () => {
			var currentPage = `${pg.thisPage.id}`;
			var group = await dat.db.saved.where({ channel: 'group' }).first();
			if (pg.thisPage.id !== currentPage) return;

			if (group == null) group = [];
			else group = group.data;

			pg.getEl('empty').setAttribute('data-active', group.length === 0);
			pg.getEl('content').setAttribute('data-active', group.length > 0);
		},
	},
	lang: {
		en: {
			title: 'Groups',
			createGroup: 'Create new Group',
			emptyText: 'No group yet',
			joinTips: 'or join with existing group using link',
		},
		id: {
			title: 'Grup Kelas',
			createGroup: 'Buat Grup Kelas',
			emptyText: 'Belum ada grup',
			joinTips: 'atau gunakan link untuk bergabung ke grup yang sudah ada',
		},
	},
};