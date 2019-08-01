var GroundLevel = {

	init: function () {
		enableAllTippy();
		photoLoader.load(pg.getEl('groundLevelProfilePhoto'), `profile_pic/${firebaseAuth.userId}_small.jpg`, `profile_pic/${firebaseAuth.userId}.jpg`);
	},

	gl: (l, p) => gl(l, p, 'GroundLevel'),

	head: function (pageId) {
		return `<div class="actionBar aPadding-1">
			<div class="button" onclick="go('groups')" title="${this.gl('groups')}"><i class="fas fa-users"></i></div>
			<div class="title center">${this.gl(pageId)}</div>
			<div class="profilePhoto" id="groundLevelProfilePhoto" onclick="GroundLevel.profilePopUp()" title="${this.gl('profile')}"><i class="fas fa-user"></i></div>
		</div>`;
	},

	foot: function (pageId) {
		return `<div class="tabBar five">
			<div data-active="${pageId === 'home'}" onclick="GroundLevel.go('home')" title="${this.gl('home')}"><i class="fas fa-home"></i></div>
			<div data-active="${pageId === 'notifications'}" onclick="GroundLevel.go('notifications')" title="${this.gl('notifications')}"><i class="fas fa-bell"></i></div>
			<div onclick="" class="theme-primary"><i class="fas fa-plus"></i></div>
			<div data-active="${pageId === 'schedules'}" onclick="GroundLevel.go('schedules')" title="${this.gl('schedules')}"><i class="fas fa-clock"></i></div>
			<div data-active="${pageId === 'assignmnetsAndExams'}" onclick="GroundLevel.go('assignmnetsAndExams')" title="${this.gl('assignmnetsAndExams')}"><i class="fas fa-tasks"></i></div>
		</div>`;
	},

	go: t => {
		if (pg.thisPage.id === t) return;
		go(t);
	},

	profilePopUp: function () {
		//show popup of own profile, with 2 button: one for edit, one for signout
		var popUpBuild = (id) => `<div data-profile="${firebaseAuth.userId}">
				<div class="vSpace-10"></div>
				<div class="profilePhoto circleCenter-120"><i class="fas fa-user"></i></div>
				<div class="vSpace-20"></div>
				<h1 data-profileData="name">...</h1>
				<h5 data-profileData="school"></h5>
				<div class="table dual-10 vSpace-30">
					<div><button class="primary" onclick="go('settings')">${this.gl('settings')}</button></div>
					<div><button class="negative" onclick="GroundLevel.signOut()">${this.gl('signOut')}</button></div>
				</div>
				<div class="vSpace-20"></div>
				<button onclick="window.history.go(-1)">${this.gl('close')}</button>
			</div>`;
		var id = vipPaging.popUp.show('profile', popUpBuild);
		photoLoader.load(document.querySelector(`#vipPaging-popUp-${id} .profilePhoto`), `profile_pic/${firebaseAuth.userId}_small.jpg`, `profile_pic/${firebaseAuth.userId}.jpg`);
		ProfileResolver.fillData(document.querySelector(`#vipPaging-popUp-${id}`));
	},

	signOut: function () {
		ui.popUp.confirm(this.gl('signOutConfirm'), a => {
			if (a) firebase.auth().signOut();
		});
	},

};

vipLanguage.lang['GroundLevel'] = {
	en: {
		home: 'Home',
		notifications: 'Notification',
		schedules: 'Schedule',
		assignmnetsAndExams: 'Assignment &amp; Exam',
		groups: 'Groups',
		profile: 'Profile',

		settings: 'Settings',
		signOut: 'Sign out',
		signOutConfirm: 'Sign out from this device?',
		close: 'Close',
	},
	id: {
		home: 'Beranda',
		notifications: 'Notifikasi',
		schedules: 'Jadwal',
		assignmnetsAndExams: 'Tugas &amp; Ujian',
		groups: 'Grup-grup',
		profile: 'Profil',

		settings: 'Pengaturan',
		signOut: 'Keluar',
		signOutConfirm: 'Keluar dari perangkat ini?',
		close: 'Tutup',
	},
};