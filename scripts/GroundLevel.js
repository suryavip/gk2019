var GroundLevel = {

	init: function () {
		enableAllTippy();
		photoLoader.load(pg.getEl('groundLevelProfilePhoto'), `profile_pic/${firebaseAuth.userId}_small.jpg`, `profile_pic/${firebaseAuth.userId}.jpg`);
	},

	gl: (l, p) => gl(l, p, 'GroundLevel'),

	head: function (pageId) {
		return `<div class="actionBar aPadding-10">
			<div class="button" onclick="go('groups')" title="${this.gl('groups')}"><i class="fas fa-users"></i></div>
			<div class="title center">${this.gl(pageId)}</div>
			<div class="profilePhoto" id="groundLevelProfilePhoto" onclick="groundLevel.profilePopUp()" title="${this.gl('profile')}"><i class="fas fa-user"></i></div>
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

};

vipLanguage.lang['GroundLevel'] = {
	en: {
		home: 'Home',
		notifications: 'Notification',
		schedules: 'Schedule',
		assignmnetsAndExams: 'Assignment &amp; Exam',
		groups: 'Groups',
		profile: 'Profile',
	},
	id: {
		home: 'Beranda',
		notifications: 'Notifikasi',
		schedules: 'Jadwal',
		assignmnetsAndExams: 'Tugas &amp; Ujian',
		groups: 'Grup-grup',
		profile: 'Profil',
	},
};