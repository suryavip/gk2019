vipPaging.pageTemplate['group'] = {
	import: [
		'scripts/ProfileResolver.js',
	],
	opening: () => {
		enableAllTippy();
		dat.attachListener(pg.load, ['group', `member/${pg.parameter}`]);
	},
	innerHTML: d => `
<div class="vipPaging-vLayout">
	<div class="head"><div>
		<div class="actionBar">
			${app.dynamicBackButton()}
			<div class="title">${gl('title')}</div>
		</div>
	</div></div>
	<div class="body"><div>
		<div class="maxWidthWrap-640">

			<div class="aPadding-30 activable" id="stranger" style="text-align:center">
				<h1 class="groupName">...</h1>
				<h5 class="groupSchool">...</h5>
				<div class="vSpace-30"></div>
				<img src="illustrations/undraw_having_fun_iais.svg" width="200px" />
				<div class="vSpace-30"></div>
				<button class="primary" onclick="pg.ask()">${gl('askToJoin')}</button>
			</div>
		
			<div class="aPadding-30 activable" id="pending" style="text-align:center">
				<h1 class="groupName">...</h1>
				<h5 class="groupSchool">...</h5>
				<div class="vSpace-30"></div>
				<img src="illustrations/undraw_queue_qt30.svg" width="200px" />
				<div class="vSpace-30"></div>
				<h4>${gl('pending')}</h4>
				<div class="vSpace-30"></div>
				<button onclick="pg.cancel()">${gl('cancelRequest')}</button>
			</div>

			<div class="container-20 activable" id="head">
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
				<button class="primary">${gl('inviteFriend')}</button>
			</div>

			<div class="activable" id="members"></div>
			
		</div>
	</div></div>
</div>
`,
	functions: {
		load: async () => {
			var currentPage = `${pg.thisPage.id}`;
			var g = await dat.db.saved.where({ channel: 'group' }).first();
			if (pg.thisPage.id !== currentPage) return;

			if (g == null || g.data[pg.parameter] == null) pg.loadAnonymous();
			else pg.loadFromDB(g.data[pg.parameter]);
		},
		loadAnonymous: async () => {
			vipPaging.bodyState('loading');

			pg.thisPage.querySelector('.body').classList.add('body-center');

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
		loadFromDB: async (group) => {
			vipPaging.bodyState();

			pg.thisPage.querySelector('.body').classList.remove('body-center');

			var groupNames = pg.thisPage.querySelectorAll('.groupName');
			for (i in groupNames) groupNames[i].textContent = group.name;
			var groupSchools = pg.thisPage.querySelectorAll('.groupSchool');
			for (i in groupSchools) groupSchools[i].textContent = group.school;

			pg.rLevel = group.level;

			pg.getEl('stranger').setAttribute('data-active', 'false');
			pg.getEl('pending').setAttribute('data-active', group.level === 'pending');
			pg.getEl('head').setAttribute('data-active', group.level !== 'pending');
			pg.getEl('members').setAttribute('data-active', group.level !== 'pending');

			if (group.level !== 'pending') pg.loadMembers();
		},
		loadMembers: async () => {
			var currentPage = `${pg.thisPage.id}`;
			var m = await dat.db.saved.where({ channel: `member/${pg.parameter}` }).first();
			if (pg.thisPage.id !== currentPage) return;

			if (m == null) {
				window.history.go(-1);
				return;
			}

			var levels = m.data;
			ProfileResolver.resolve(Object.keys(m.data), users => {
				var members = [];
				pg.byUserId = {};
				pg.adminCount = 0;
				for (userId in levels) {
					var thisUser = {
						userId: userId,
						name: users[userId].name,
						school: users[userId].school,
						level: levels[userId],
					};
					members.push(thisUser);
					pg.byUserId[userId] = thisUser;
					if (levels[userId] === 'admin') pg.adminCount++;
				}

				//sort by name then by level
				members.sort((a, b) => {
					if (a.name < b.name) return -1;
					if (a.name > b.name) return 1;
					return 0;
				});
				members.sort((a, b) => {
					var l = ['pending', 'admin', 'member'];
					var ia = l.indexOf(a.level);
					var ib = l.indexOf(b.level);
					if (ia < ib) return -1;
					if (ia > ib) return 1;
					return 0;
				});

				//outputing
				var out = '';
				var lastLevel = '';
				for (i in members) {
					var m = members[i];
					if (pg.rLevel !== 'admin' && m.level === 'pending') {
						//only admin can see pendings list
						continue;
					}
					if (lastLevel !== m.level) {
						if (out !== '') out += `</div>`;
						out += `<div class="container">`;
						lastLevel = m.level;
					}

					out += `<div class="list feedback" onclick="pg.showProfile('${m.userId}')">
						<div class="photo"><div data-photoRefPath="profile_pic/${m.userId}_small.jpg" data-fullPhotoRefPath="profile_pic/${m.userId}.jpg"><i class="fas fa-user"></i></div></div>
						<div class="content">
							<h4>${app.escapeHTML(m.name)}</h4>
							<h5>${gl(m.level)}</h5>
						</div>`;
				}
				if (out !== '') out += `</div>`;

				pg.getEl('members').innerHTML = out;
				photoLoader.autoLoad(pg.getEl('members'));
			});
		},

		showProfile: (uid) => {
			//show popUp
			var u = pg.byUserId[uid];
			var popUpBuild = (id, u) => {
				var level = u.level;
				var out = `<div>
					<div class="vSpace-10"></div>
					<div class="profilePhoto circleCenter-120"><i class="fas fa-user"></i></div>
					<div class="vSpace-20"></div>
					<h1>${app.escapeHTML(u.name)}</h1>
					<h5>${app.escapeHTML(u.school)}</h5>
					<div class="vSpace-30"></div>`;

				if (pg.rLevel === 'admin') {
					if (uid === firebaseAuth.userId && pg.adminCount > 1) out += `<button onclick="vipPaging.popUp.close('admin-stop')" class="negative">${gl('admin-stop')}</button>
					<div class="vSpace-20"></div>`;

					if (level === 'member') out += `<button onclick="vipPaging.popUp.close('admin-new')" class="primary">${gl('admin-new')}</button>
					<div class="vSpace-20"></div>
					<button onclick="vipPaging.popUp.close('member-delete')" class="negative">${gl('member-delete')}</button>
					<div class="vSpace-20"></div>`;

					if (level === 'pending') out += `<button onclick="vipPaging.popUp.close('member-new')" class="primary">${gl('member-new')}</button>
					<div class="vSpace-20"></div>
					<button onclick="vipPaging.popUp.close('pending-delete')" class="negative">${gl('pending-delete')}</button>
					<div class="vSpace-20"></div>`;
				}

				out += `<button onclick="window.history.go(-1)">${gl('close')}</button></div>`;
				return out;
			};
			var popUpCallBack = type => {
				if (type == null) return;
				//
			};
			var id = vipPaging.popUp.show('profile', popUpBuild, u, popUpCallBack);
			photoLoader.load(document.querySelector(`#vipPaging-popUp-${id} .profilePhoto`), `profile_pic/${uid}_small.jpg`, `profile_pic/${uid}.jpg`);
		},
	},
	lang: {
		en: {
			title: 'Group',
			pending: 'Waiting for approval...',
			askToJoin: 'Ask to join',
			cancelRequest: 'Cancel join request',
			edit: 'Edit',
			inviteFriend: 'Invite Friends',
			groupNotFound: 'Group not found',
			admin: 'Administrator',
			member: 'Member',

			//action on profile popup
			'admin-stop': 'Stop being admin',
			'member-delete': 'Remove from this group',
			'member-new': 'Accept',
			'pending-delete': 'Deny',
			'admin-new': 'Set as admin',
			close: 'Close',
		},
		id: {
			title: 'Grup',
			pending: 'Sedang menunggu persetujuan...',
			askToJoin: 'Minta Bergabung',
			cancelRequest: 'Batalkan',
			edit: 'Ubah',
			inviteFriend: 'Ajak Teman Bergabung',
			groupNotFound: 'Grup tidak ditemukan',
			admin: 'Admin',
			member: 'Anggota',

			//action on profile popup
			'admin-stop': 'Berhenti menjadi admin',
			'member-delete': 'Keluarkan dari grup',
			'member-new': 'Terima',
			'pending-delete': 'Tolak',
			'admin-new': 'Jadikan admin',
			close: 'Tutup',
		},
	},
};