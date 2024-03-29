vipPaging.pageTemplate['group'] = {
	import: [
		'scripts/ProfileResolver.js',
		'scripts/MembersOfGroup.js',
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
			<div class="button activable" id="leaveBtn" title="${gl('leaveBtn')}"><i class="fas fa-sign-out-alt"></i></div>
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
				<button class="primary" onclick="pg.share()">${gl('inviteFriend')}</button>
			</div>

			<div class="activable" id="members"></div>
			
		</div>
	</div></div>
</div>
`,
	functions: {
		previouslyAnonymous: false,
		load: async () => {
			var currentPage = `${pg.thisPage.id}`;
			var g = await dat.db.group.where({ groupId: pg.parameter }).first();
			if (pg.thisPage.id !== currentPage) return;

			if (g == null) pg.loadAnonymous();
			else {
				pg.loadFromDB(g);
				pg.previouslyAnonymous = false;
			}
		},
		loadAnonymous: async () => {
			if (pg.previouslyAnonymous) return;
			pg.previouslyAnonymous = true;

			vipPaging.bodyState('loading');

			pg.thisPage.querySelector('.body').classList.add('body-center');

			var stranger = pg.getEl('stranger');
			stranger.setAttribute('data-active', 'true');
			pg.getEl('pending').setAttribute('data-active', 'false');
			pg.getEl('head').setAttribute('data-active', 'false');
			pg.getEl('members').setAttribute('data-active', 'false');
			pg.getEl('leaveBtn').setAttribute('data-active', 'false');

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

			var groupNames = pg.thisPage.querySelectorAll('.groupName');
			for (i in groupNames) groupNames[i].textContent = group.name;
			var groupSchools = pg.thisPage.querySelectorAll('.groupSchool');
			for (i in groupSchools) groupSchools[i].textContent = group.school;

			pg.rLevel = group.level;
			//manage self btn
			var leaveBtnType = pg.rLevel === 'admin' ? 'admin-delete' : 'member-delete';
			pg.getEl('leaveBtn').setAttribute('onclick', `pg.leave('${leaveBtnType}')`);

			pg.getEl('stranger').setAttribute('data-active', 'false');
			pg.getEl('pending').setAttribute('data-active', group.level === 'pending');
			pg.getEl('head').setAttribute('data-active', group.level !== 'pending');
			pg.getEl('members').setAttribute('data-active', group.level !== 'pending');
			pg.getEl('leaveBtn').setAttribute('data-active', group.level !== 'pending');

			if (group.level !== 'pending') {
				pg.thisPage.querySelector('.body').classList.remove('body-center');
				pg.loadMembers();
			}
			else pg.thisPage.querySelector('.body').classList.add('body-center');
		},
		loadMembers: async () => {
			var currentPage = `${pg.thisPage.id}`;
			var m = await dat.db.member.where({ groupId: pg.parameter }).toArray();
			if (pg.thisPage.id !== currentPage) return;

			var levels = {};
			for (i in m) levels[m[i].userId] = m[i].level;

			ProfileResolver.resolve(Object.keys(levels), users => {
				var members = [];
				pg.byUserId = {};
				pg.adminCount = 0;
				pg.memberCount = 0;
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
					else if (levels[userId] === 'member') pg.memberCount++;
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

					out += `<div class="list feedback">
						<div class="photo"><div data-photoRefPath="profile_pic/${m.userId}_thumb" data-fullPhotoRefPath="profile_pic/${m.userId}"><i class="fas fa-user"></i></div></div>
						<div class="content" onclick="pg.showProfile('${m.userId}')">
							<h4>${app.escapeHTML(m.name)}</h4>
							<h5>${gl(m.level)}</h5>
						</div>
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
				MembersOfGroup.manage({
					type: type,
					groupId: pg.parameter,
					userId: uid,
					adminCount: pg.adminCount,
					memberCount: pg.memberCount,
					name: u.name,
				});
			};
			var id = vipPaging.popUp.show('profile', popUpBuild, u, popUpCallBack);
			photoLoader.load(document.querySelector(`#vipPaging-popUp-${id} .profilePhoto`), `profile_pic/${uid}_thumb`, `profile_pic/${uid}`);
		},

		ask: () => {
			if (!firebaseAuth.isSignedIn()) {
				//remember where to go after signed in
				sessionStorage.setItem('dynamicLinkPageId', pg.thisPage.id);
				go('index');
				return;
			}
			MembersOfGroup.manage({
				type: 'pending-new',
				groupId: pg.parameter,
			});
		},
		cancel: () => {
			MembersOfGroup.manage({
				type: 'pending-delete',
				groupId: pg.parameter,
			});
		},
		leave: (type) => {
			MembersOfGroup.manage({
				type: type,
				groupId: pg.parameter,
				adminCount: pg.adminCount,
				memberCount: pg.memberCount,
				callBack: () => {
					window.history.go(-1);
				},
			});
		},

		share: async () => {
			vipLoading.add('share');

			//building long link
			var targetLink = encodeURIComponent(`${app.baseAPPAddress}/?group=${pg.parameter}`);
			var link = `https://grupkelas.page.link/?link=${targetLink}&apn=com.boostedcode.gk2019`;

			var options = {
				method: 'POST',
				body: JSON.stringify({
					longDynamicLink: link,
					suffix: { option: 'SHORT', },
				}),
			}
			var f = await jsonFetch.do(`https://firebasedynamiclinks.googleapis.com/v1/shortLinks?key=${firebase.app().options.apiKey}`, options);
			vipLoading.remove('share');
			if (f.status === 200) link = f.b.shortLink;
			pg.share2(link);
		},
		share2: link => {
			if (isCordova) {
				var options = { url: link, };
				window.plugins.socialsharing.shareWithOptions(options, () => { }, (msg) => {
					console.error(`failed to share: ${msg}`);
				});
			}
			else {
				//show popUp
				var id = vipPaging.popUp.show('share', (id, b) => {
					return `<div style="padding: 20px;">
					<div class="vSpace-10"></div>
					<h4 style="text-align:center">${gl('shareLinkTips')}</h4>
					<div class="vSpace-10"></div>
					<input type="text" value="${app.escapeHTML(b)}" readonly onclick="pg.copyLinkToClipboard('${id}')">
					<div class="vSpace-20"></div>
					<div class="table dual-10">
						<div><button onclick="window.history.go(-1)">${gl('close')}</button></div>
						<div><button onclick="pg.copyLinkToClipboard('${id}')" class="primary">${gl('copyToClipboard')}</button></div>
					</div>
				</div>`;
				}, link, val => {
					//
				});
				pg.copyLinkToClipboard(id); //copy to clipboard automatically
			}
		},
		copyLinkToClipboard: id => {
			var el = document.querySelector(`#vipPaging-popUp-${id} input`);
			el.select();
			document.execCommand("copy");
			ui.float.success(gl('copiedToClipboard'));
		},
	},
	lang: {
		en: {
			title: 'Group',
			leaveBtn: 'Leave from this group',
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

			shareLinkTips: 'Use this link to invite your friends to this group',
			copyToClipboard: 'Copy',
			copiedToClipboard: 'Copied to clipboard',
		},
		id: {
			title: 'Grup',
			leaveBtn: 'Keluar dari grup',
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

			shareLinkTips: 'Gunakan link ini untuk mengajak teman kamu bergabung',
			copyToClipboard: 'Salin',
			copiedToClipboard: 'Link sudah disalin',
		},
	},
};