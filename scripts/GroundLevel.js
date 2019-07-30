var GroundLevel = {

	init: function () {
		enableAllTippy();
		photoLoader.load(pg.getEl('groundLevelProfilePhoto'), `profile_pic/${firebaseAuth.userId}_small.jpg`, `profile_pic/${firebaseAuth.userId}.jpg`);
	},

	head: function (pageId) {
		return `<div class="actionBar aPadding-10">
			<div class="button" onclick="go('groups')" title="Grup-grup"><i class="fas fa-users"></i></div>
			<div class="title center">${gl(pageId, null, 'GroundLevel')}</div>
			<div class="profilePhoto" id="groundLevelProfilePhoto" onclick="groundLevel.profilePopUp()" title="Profil"><i class="fas fa-user"></i></div>
		</div>`;
	},

	foot: function (pageId) {
		return `<div class="tabBar five">
			<div data-active="${pageId === 'home'}" onclick="" title="Beranda"><i class="fas fa-home"></i></div>
			<div data-active="${pageId === 'notifications'}" onclick="" title="Notifikasi"><i class="fas fa-bell"></i></div>
			<div onclick="" class="theme-primary"><i class="fas fa-plus"></i></div>
			<div data-active="${pageId === 'schedules'}" onclick="" title="Jadwal"><i class="fas fa-clock"></i></div>
			<div data-active="${pageId === 'assignmnetsAndExams'}" onclick="" title="Tugas dan ujian"><i class="fas fa-tasks"></i></div>
		</div>`;
	},

};

vipLanguage.lang['GroundLevel'] = {
	en: {
		home: 'Home',
		notifications: 'Notification',
		schedules: 'Schedule',
		assignmnetsAndExams: 'Assignment &amp; Exam',
	},
	id: {
		home: 'Beranda',
		notifications: 'Notifikasi',
		schedules: 'Jadwal',
		assignmnetsAndExams: 'Tugas &amp; Ujian',
	},
};