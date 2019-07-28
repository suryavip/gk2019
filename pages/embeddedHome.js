var embeddedHome = {
	opening: () => {
		enableAllTippy();
		photoLoader.load(pg.getEl('embeddedHomePhoto'), `profile_pic/${firebaseAuth.userId}_small.jpg`, `profile_pic/${firebaseAuth.userId}.jpg`);
		dat.attachListener(embeddedHome.loadGroups);
	},
	loadGroups: async () => {
		var currentPage = `${pg.thisPage.id}`;
		var groups = await dat.db.saved.where({ tableName: 'group' }).toArray();
		var members = await dat.db.saved.where({ tableName: 'member' }).toArray();
		if (pg.thisPage.id !== currentPage) return;
		groups.sort((a, b) => {
			if (a.data.name < b.data.name) return -1;
			if (a.data.name > b.data.name) return 1;
			return 0;
		});
		var statusByGroupId = {};
		for (i in members) {
			var m = members[i];
			if (m.rowId === firebaseAuth.userId) statusByGroupId[m.owner] = m.index1;
		}
		var activeGroup = currentPage === 'group' ? app.activeGroup.get() : '';
		var out = [
			`<div class="list feedback" onclick="go('groupForm')">
				<div class="iconCircle"><div><i class="fas fa-plus"></i></div></div>
				<div class="content"><h3>Buat Ruang Kelas baru</h3></div>
			</div>`
		];
		for (i in groups) {
			var t = groups[i];
			var cls = t.rowId === activeGroup ? 'active' : 'feedback';
			if (statusByGroupId[t.rowId] === 'admin' || statusByGroupId[t.rowId] === 'member') var onclick = `embeddedHome.chooseGroup('${t.rowId}')`;
			else var onclick = `go('groupLanding', '${t.rowId}')`;
			out.push(
				`<div class="list ${cls}" onclick="${onclick}">
					<div class="iconCircle"><div class="theme-positive"><h3>5</h3></div></div>
					<div class="content">
						<h3>${app.escapeHTML(t.data.name)}</h3>
						<h5>2 aktivitas baru</h5>
					</div>
				</div>`
			);
		}
		pg.getEl('embeddedHomeNoGroup').setAttribute('data-active', groups.length === 0);
		pg.getEl('embeddedHomeGroups').setAttribute('data-active', groups.length > 0);
		pg.getEl('embeddedHomeGroups').innerHTML = out.join('');
	},
	head: () => `<div class="actionBar theme-1 aPadding-10">
			<div class="profilePhoto" id="embeddedHomePhoto" onclick="embeddedHome.profilePopUp()" title="Profil"><i class="fas fa-user"></i></div>
			<div class="title"></div>
			<div class="button" onclick="go('settings')" title="Pengaturan"><i class="fas fa-cog"></i></div>
		</div>`,
	body: () => `<div class="activable" id="embeddedHomeNoGroup">
			<div class="vSpace-10"></div>
			<h2>Mari kita mulai...</h2>
			<div class="vSpace-30"></div>
			<img src="illustrations/undraw_welcome_3gvl.svg" width="200px" />
			<div class="vSpace-30"></div>
			<button class="primary" onclick="go('groupForm')">Buat Ruang Kelas baru</button>
		</div>

		<div class="activable" id="embeddedHomeGroups"></div>`,
	profilePopUp: () => {
		//show popup of own profile, with 2 button: one for edit, one for signout
		var popUpBuild = (id) => `<div>
				<div class="vSpace-10"></div>
				<div class="profilePhoto circleCenter-120"><i class="fas fa-user"></i></div>
				<div class="vSpace-20"></div>
				<h1>${app.escapeHTML(firebase.auth().currentUser.displayName)}</h1>
				<h5>SMA Pax Patriae, Bekasi</h5>
				<div class="table dual-10 vSpace-30">
					<div><button class="primary" onclick="go('editProfile')">${gl('editProfile', null, 'embeddedHome')}</button></div>
					<div><button class="negative" onclick="embeddedHome.signOut()">${gl('signOut', null, 'embeddedHome')}</button></div>
				</div>
				<div class="vSpace-20"></div>
				<button onclick="window.history.go(-1)">${gl('close', null, 'embeddedHome')}</button>
			</div>`;
		var id = vipPaging.popUp.show('profile', popUpBuild);
		photoLoader.load(document.querySelector(`#vipPaging-popUp-${id} .profilePhoto`), `profile_pic/${firebaseAuth.userId}_small.jpg`, `profile_pic/${firebaseAuth.userId}.jpg`);
	},
	signOut: () => {
		ui.popUp.confirm(gl('signOutConfirm', null, 'embeddedHome'), a => {
			if (a) firebase.auth().signOut();
		});
	},
	chooseGroup: (groupId) => {
		app.activeGroup.set(groupId);
		if (pg.thisPage.id !== 'group') go('group');
	},
};

vipLanguage.lang['embeddedHome'] = {
	en: {
		editProfile: 'Edit profile',
		signOut: 'Sign out',
		signOutConfirm: 'Sign out from this device?',
		close: 'Close',
	},
	id: {
		editProfile: 'Ubah profil',
		signOut: 'Keluar',
		signOutConfirm: 'Keluar dari perangkat ini?',
		close: 'Tutup',
	},
};