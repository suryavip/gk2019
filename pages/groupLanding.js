vipPaging.pageTemplate['groupLanding'] = {
	import: [
		'scripts/MembersOfGroup.js',
	],
	opening: () => {
		vipPaging.bodyState('loading');
		dat.attachListener(pg.loadData);
	},
	innerHTML: () => `
<div class="vipPaging-vLayout">
	<div class="head"><div>
		<div class="actionBar">
			${app.dynamicBackButton()}
			<div class="title" id="title"></div>
		</div>
	</div></div>
	<div class="body body-center"><div>
		<div class="maxWidthWrap-640 aPadding-30" style="text-align:center">

			<h1 id="groupName"></h1>
			<h5>SMA Pax Patriae, Bekasi</h5>
		
			<div class="vSpace-30 activable" id="stranger">
				<img src="illustrations/undraw_having_fun_iais.svg" width="200px" />
				<div class="vSpace-30"></div>
				<button class="primary" onclick="pg.ask()">${gl('pending-new')}</button>
			</div>
		
			<div class="vSpace-30 activable" id="pending">
				<img src="illustrations/undraw_queue_qt30.svg" width="200px" />
				<div class="vSpace-30"></div>
				<h4>${gl('pending')}</h4>
				<div class="vSpace-30"></div>
				<button onclick="pg.cancel()">${gl('pending-delete')}</button>
			</div>
			
		</div>
	</div></div>
</div>
`,
	functions: {
		loadData: async () => {
			//load data using jsonFetch
			var fetchMode = firebaseAuth.isSignedIn() ? 'doWithIdToken' : 'do';
			var currentPage = `${pg.thisPage.id}`;
			var f = await jsonFetch[fetchMode](`${app.baseAPIAddress}/group/${pg.parameter}`);
			if (pg.thisPage.id !== currentPage) return;

			if (f.status === 200) {
				if (f.b['level'] === 'admin' || f.b['level'] === 'member') {
					go('home', null, true);
				}

				pg.getEl('title').textContent = f.b.name;
				pg.getEl('groupName').textContent = f.b.name;
				pg.getEl('stranger').setAttribute('data-active', f.b['level'] == null);
				pg.getEl('pending').setAttribute('data-active', f.b['level'] === 'pending');

				vipPaging.bodyState();
			}
			else if (f.status === 404) {
				ui.popUp.alert(gl('groupNotFound'), () => {
					go('home', null, true);
				});
			}
			else {
				vipPaging.bodyState('retryable', `vipPaging.bodyState('loading'); pg.loadData()`);
				if (f.status === 'connectionError') {
					ui.float.error(gl('connectionError', null, 'app'));
				}
				else {
					ui.float.error(gl('unexpectedError', `${f.status}: ${f.b.code}`, 'app'));
				}
			}
		},
		ask: () => {
			if (firebaseAuth.isSignedIn()) {
				MembersOfGroup.manage({
					type: 'pending-new',
					groupId: pg.parameter,
					callBack: () => { pg.loadData(); },
				});
			}
			else {
				//remember where to go after signed in
				sessionStorage.setItem('dynamicLinkPageId', pg.thisPage.id);
				go('index');
			}
			
		},
		cancel: () => {
			MembersOfGroup.manage({
				type: 'pending-delete',
				groupId: pg.parameter,
				userId: firebaseAuth.userId,
				callBack: () => { pg.loadData(); },
			});
		},
	},
	lang: {
		en: {
			pending: 'Waiting for approval...',
			'pending-new': 'Ask to join',
			'pending-delete': 'Cancel join request',
			groupNotFound: 'Group not found',
		},
		id: {
			pending: 'Sedang menunggu persetujuan...',
			'pending-new': 'Minta bergabung',
			'pending-delete': 'Batalkan',
			groupNotFound: 'Grup tidak ditemukan',
		},
	},
};