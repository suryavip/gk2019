vipPaging.pageTemplate['groups'] = {
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
	<div class="body">
		<div>
			<div class="maxWidthWrap-640" id="announcement"></div>
			<div class="vipPaging-floatingButtonSpace"></div>
		</div>
		<div class="vipPaging-floatingButton"><div onclick="go('groupForm')" title="${gl('createGroup')}"><i class="fas fa-plus"></i></div></div>
	</div>
</div>
`,
	functions: {
		loadData: async () => {
			pg.groupId = app.activeGroup.get();
			if (pg.groupId === 'empty') return;

			var currentPage = `${pg.thisPage.id}`;
			pg.members = await dat.db.saved.where({ tableName: 'member', owner: pg.groupId }).toArray();
			if (pg.thisPage.id !== currentPage) return;

			// get profile
			var userIds = [];
			for (i in pg.members) userIds.push(pg.members[i].rowId);
			ProfileResolver.resolve(userIds, users => {

				// merge into pg.members
				for (i in pg.members) {
					var userId = pg.members[i].rowId;
					var user = users[userId];
					pg.members[i].data.name = user.name;
				}

				//sort by name
				pg.members.sort((a, b) => {
					if (a.data.name < b.data.name) return 1;
					if (a.data.name > b.data.name) return -1;
					return 0;
				});

				//grouping and rLevel
				pg.byUserId = {};
				pg.byLevel = {
					'admin': [],
					'member': [],
					'pending': [],
				};
				pg.rLevel = '';
				for (i in pg.members) {
					var userId = pg.members[i].rowId;
					var level = pg.members[i].index1;

					pg.byLevel[level].push(pg.members[i]);
					pg.byUserId[userId] = pg.members[i];
					if (userId === firebaseAuth.userId) pg.rLevel = level;
				}

				//manage self btn
				var leaveBtnType = pg.rLevel === 'admin' ? 'admin-delete' : 'member-delete';
				pg.getEl('leaveBtn').setAttribute('onclick', `pg.leave('${leaveBtnType}')`);

				pg.loadMembers();
			});
		},

		buildPhoto: userId => `<div class="photo"><div data-photoRefPath="profile_pic/${userId}_small.jpg" data-fullPhotoRefPath="profile_pic/${userId}.jpg"><i class="fas fa-user"></i></div></div>`,

		buildUser: (t, level) => `<div class="list feedback">
			${pg.buildPhoto(t.rowId)}
			<div class="content" onclick="pg.showProfile('${t.rowId}')">
				<h4>${app.escapeHTML(t.data.name)}</h4>
				${typeof level === 'string' ? `<h5>${gl(level)}</h5>` : ''}
			</div>
		</div>`,

		loadMembers: () => {
			var out = [];

			if (pg.rLevel === 'admin') {
				var pending = [];
				for (i in pg.byLevel['pending']) {
					pending.push(pg.buildUser(pg.byLevel['pending'][i], 'pending'));
				}
				if (pending.length > 0) out.push(`<div class="container">${pending.join('')}</div>`);
			}

			var admin = [];
			for (i in pg.byLevel['admin']) {
				admin.push(pg.buildUser(pg.byLevel['admin'][i], 'admin'));
			}
			if (admin.length > 0) out.push(`<div class="container">${admin.join('')}</div>`);

			var member = [];
			for (i in pg.byLevel['member']) {
				member.push(pg.buildUser(pg.byLevel['member'][i]));
			}
			if (member.length > 0) out.push(`<div class="container">${member.join('')}</div>`);

			pg.getEl('list').innerHTML = out.join('');

			photoLoader.autoLoad(pg.getEl('list'));
		},
		showProfile: (uid) => {
			//show popUp
			var u = pg.byUserId[uid];
			var popUpBuild = (id, u) => {
				var level = u.index1;
				var out = `<div>
					<div class="vSpace-10"></div>
					<div class="profilePhoto circleCenter-120"><i class="fas fa-user"></i></div>
					<div class="vSpace-20"></div>
					<h1>${app.escapeHTML(u.data.name)}</h1>
					<h5 data-profileData="school">SMA Pax Patriae, Bekasi</h5>
					<div class="vSpace-30"></div>`;

				if (pg.rLevel === 'admin') {
					if (uid === firebaseAuth.userId && pg.byLevel['admin'].length > 1) out += `<button onclick="vipPaging.popUp.close('admin-stop')" class="negative">${gl('admin-stop')}</button>
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
				MembersOfGroup.manage({
					type: type,
					groupId: pg.groupId,
					userId: uid,
					byLevel: pg.byLevel,
				});
			};
			var id = vipPaging.popUp.show('profile', popUpBuild, u, popUpCallBack);
			photoLoader.load(document.querySelector(`#vipPaging-popUp-${id} .profilePhoto`), `profile_pic/${uid}_small.jpg`, `profile_pic/${uid}.jpg`);
		},
		leave: (type) => {
			MembersOfGroup.manage({
				type: type,
				groupId: pg.groupId,
				userId: firebaseAuth.userId,
				byLevel: pg.byLevel,
				callBack: () => { go('home', null, true); },
			});
		},
	},
	lang: {
		en: {
			title: 'Members',
			leaveBtn: 'Leave from this group',

			//status
			admin: 'Admin',
			pending: 'Waiting for approval...',

			//action on profile popup
			'admin-stop': 'Stop being admin',
			'member-delete': 'Remove from this group',
			'member-new': 'Accept',
			'pending-delete': 'Deny',
			'admin-new': 'Set as admin',
			close: 'Close',
		},
		id: {
			title: 'Anggota',
			leaveBtn: 'Keluar dari grup',

			//status
			admin: 'Admin',
			pending: 'Menunggu persetujuan...',

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