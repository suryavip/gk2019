vipPaging.pageTemplate['group'] = {
	opening: () => {
		enableAllTippy();
		dat.attachListener(pg.load, ['group', `member/${pg.parameter}`]);
	},
	innerHTML: d => `
<div class="vipPaging-vLayout">
	<div class="head"><div>
		<div class="actionBar">
			${app.dynamicBackButton()}
			<div class="title" id="title"></div>
		</div>
	</div></div>
	<div class="body"><div>
		<div class="maxWidthWrap-640">

			<div class="aPadding-30 activable" id="stranger">
				<h1 class="groupName">...</h1>
				<h5 class="groupSchool">...</h5>
				<div class="vSpace-30"></div>
				<img src="illustrations/undraw_having_fun_iais.svg" width="200px" />
				<div class="vSpace-30"></div>
				<button class="primary" onclick="pg.ask()">${gl('askToJoin')}</button>
			</div>
		
			<div class="aPadding-30 activable" id="pending">
				<h1 class="groupName">...</h1>
				<h5 class="groupSchool">...</h5>
				<div class="vSpace-30"></div>
				<img src="illustrations/undraw_queue_qt30.svg" width="200px" />
				<div class="vSpace-30"></div>
				<h4>${gl('pending')}</h4>
				<div class="vSpace-30"></div>
				<button onclick="pg.cancel()">${gl('cancelRequest')}</button>
			</div>

			<div class="container-20" id="head">
				<div class="table">
					<div style="width:100%">
						<h1 class="groupName">...</h1>
						<h5 class="groupSchool">...</h5>
					</div>
					<div>
						<div class="circleButton" onclick="go('groupForm', '${d.parameter}')" title="${gl('edit')}"><i class="fas fa-pen"></i></div>
					</div>
				</div>
				<div class="vSpace-30 activable" style="text-align:center" id="alone">
					<img src="illustrations/undraw_true_friends_c94g.svg" width="200px" />
					<div class="vSpace-10"></div>
				</div>
				<div class="vSpace-20"></div>
				<button class="primary">${pg.home.gl('inviteFriend')}</button>
			</div>

			<div id="members"></div>
			
		</div>
	</div></div>
</div>
`,
	functions: {
		load: async () => {
			var currentPage = `${pg.thisPage.id}`;
			var g = await dat.db.saved.where({ channel: 'group' }).first();
			if (pg.thisPage.id !== currentPage) return;

			if (g == null || g[pg.parameter] == null) pg.loadAnonymous();
			else pg.loadFromDB(g[pg.parameter]);
		},
		loadAnonymous: async () => {
			vipPaging.bodyState('loading');

			var stranger = pg.getEl('stranger');
			stranger.setAttribute('data-active', 'true');
			pg.getEl('pending').setAttribute('data-active', 'false');
			pg.getEl('head').setAttribute('data-active', 'false');
			pg.getEl('members').setAttribute('data-active', 'false');

			var currentPage = `${pg.thisPage.id}`;
			var f = await jsonFetch.do(`${app.baseAPIAddress}/groupInfo/${pg.parameter}`);
			if (pg.thisPage.id !== currentPage) return;

			if (f.status === 200) {
				stranger.querySelector('.groupName').textContent = f.b.name;
				stranger.querySelector('.groupSchool').textContent = f.b.school;
				vipPaging.bodyState();
			}
			else if (f.status === 404) {
				ui.popUp.alert(gl('groupNotFound'), () => {
					//go to home or index
					if (vipHistory.isFirstPage.get()) {
						if (firebaseAuth.isSignedIn()) go('home', null, true);
						else go('index', null, true);
					}
					else window.history.go(-1);
				});
			}
			else {
				vipPaging.bodyState('retryable', `vipPaging.bodyState('loading'); pg.load()`);
				if (f.status === 'connectionError') {
					ui.float.error(gl('connectionError', null, 'app'));
				}
				else {
					ui.float.error(gl('unexpectedError', `${f.status}: ${f.b.code}`, 'app'));
				}
			}
		},
		loadFromDB: async () => {
			//
		},


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