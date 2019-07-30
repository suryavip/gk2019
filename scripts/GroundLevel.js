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