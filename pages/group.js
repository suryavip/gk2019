vipPaging.pageTemplate['group'] = {
	import: [
		'pages/embeddedHome.js',
		'pages/group/home.js',
		'pages/group/announcement.js',
		'pages/group/schedule.js',
		'pages/group/assignment.js',
		'pages/group/exam.js',
		'scripts/ProfileResolver.js',
	],
	class: ['vipPaging-hasLeftMenu'],
	opening: () => {
		embeddedHome.opening();

		vipGesture.tabAIO();
		
		/*var subPages = pg.thisPage.querySelectorAll('.vipPaging-subPage');
		for (var i = 0; i < subPages.length; i++) subPages[i].addEventListener('vipPagingTabNavigatorChanged', pg.autoTabBarScroll);
		pg.autoTabBarScroll();*/

		dat.attachListener(pg.masterLoad);
	},
	innerHTML: () => `
<div class="vipPaging-menu">

	<div class="strongShadow">
		${embeddedHome.head()}
	</div>
	<div class="aPadding-20" style="text-align:center">
		${embeddedHome.body()}
	</div>

</div>

<div class="vipPaging-vLayout">
	<div class="head"><div>
		<div class="actionBar">
			<div class="button vipPaging-leftMenuBtn-display" onclick="window.history.go(-1)"><i class="fas fa-arrow-left"></i></div>
			<div class="title" id="title"></div>
			<div class="button" title="${gl('activity')}" onclick="go('activities')"><i class="fas fa-newspaper"></i></div>
			<div class="button" title="${gl('members')}" onclick="go('members')"><i class="fas fa-users"></i></div>
		</div>
		<div class="scrollableTab">
			<div class="vipPaging-subNavigator" onclick="vipPaging.subPage.change(this)" data-active="true">
				<i class="fas fa-home"></i>
				<h3>${gl('home')}</h3>
			</div>
			<div class="vipPaging-subNavigator" id="announcementTabBtn" onclick="vipPaging.subPage.change(this)">
				<i class="fas fa-bullhorn"></i>
				<h3>${gl('announcement')}</h3>
			</div>
			<div class="vipPaging-subNavigator" id="scheduleTabBtn" onclick="vipPaging.subPage.change(this)">
				<i class="fas fa-clock"></i>
				<h3>${gl('schedule')}</h3>
			</div>
			<div class="vipPaging-subNavigator" id="assignmentTabBtn" onclick="vipPaging.subPage.change(this)">
				<i class="fas fa-tasks"></i>
				<h3>${gl('assignment')}</h3>
			</div>
			<div class="vipPaging-subNavigator" id="examTabBtn" onclick="vipPaging.subPage.change(this)">
				<i class="fas fa-flag-checkered"></i>
				<h3>${gl('exam')}</h3>
			</div>
		</div>
	</div></div>
	<div class="body"></div>
</div>

<div class="vipPaging-subPage" data-active="true">
	<div class="vipPaging-vLayout">
		<div class="topSpacer"></div>
		<div class="body"><div>
			<div class="maxWidthWrap-640" id="home"></div>
		</div></div>
	</div>
</div>

<div class="vipPaging-subPage">
	<div class="vipPaging-vLayout">
		<div class="topSpacer"></div>
		<div class="body">
			<div>
				<div class="maxWidthWrap-640" id="announcement"></div>
				<div class="vipPaging-floatingButtonSpace"></div>
			</div>
			<div class="vipPaging-floatingButton"><div onclick="go('announcementForm')" title="${gl('addAnnouncement')}"><i class="fas fa-plus"></i></div></div>
		</div>
	</div>
</div>

<div class="vipPaging-subPage">
	<div class="vipPaging-vLayout">
		<div class="topSpacer"></div>
		<div class="body"><div>
			<div class="maxWidthWrap-640" id="schedule"></div>
		</div></div>
	</div>
</div>

<div class="vipPaging-subPage">
	<div class="vipPaging-vLayout">
		<div class="topSpacer"></div>
		<div class="body">
			<div>
				<div class="maxWidthWrap-640" id="assignment"></div>
				<div class="vipPaging-floatingButtonSpace"></div>
			</div>
			<div class="vipPaging-floatingButton"><div onclick="go('assignmentForm')" title="${gl('addAssignment')}"><i class="fas fa-plus"></i></div></div>
		</div>
	</div>
</div>

<div class="vipPaging-subPage">
	<div class="vipPaging-vLayout">
		<div class="topSpacer"></div>
		<div class="body">
			<div>
				<div class="maxWidthWrap-640" id="exam"></div>
				<div class="vipPaging-floatingButtonSpace"></div>
			</div>
			<div class="vipPaging-floatingButton"><div onclick="go('examForm')" title="${gl('addExam')}"><i class="fas fa-plus"></i></div></div>
		</div>
	</div>
</div>
`,
	functions: {
		dummy: () => {
			var out = '';
			for (var i = 0; i < 10; i++) out += '<div class="profilePhoto"><i class="fas fa-user"></i></div>';
			pg.getEl('pendingsContent').innerHTML = out;
			pg.getEl('membersContent').innerHTML = out;
		},
		/*autoTabBarScroll: () => {
			var v = pg.thisPage.querySelector('.scrollableTab');
			var t = v.querySelector('.vipPaging-subNavigator[data-active=true]');
			var tl = t.offsetLeft;
			var tr = tl + t.offsetWidth;
			var vl = v.scrollLeft;
			var vr = vl + v.offsetWidth;
			vr -= v.offsetWidth / 4;
			vl += v.offsetWidth / 4;
			if (tr > vr) v.scrollLeft += tr - vr;
			else if (tl < vl) v.scrollLeft -= vl - tl;
		},*/
		limitToToday: (input) => {
			var today = app.comparableDate();
			var out = [];
			for (i in input) {
				var d = input[i];
				if (app.comparableDate(d.data.date) >= today) out.push(d);
			}
			return out;
		},
		masterLoad: async () => {
			pg.groupId = app.activeGroup.get();
			if (pg.groupId === 'empty') return;

			var currentPage = `${pg.thisPage.id}`;
			var data = {};
			data['group'] = await dat.db.saved.where({ rowId: pg.groupId }).first();
			data['members'] = await dat.db.saved.where({ tableName: 'member', owner: pg.groupId }).toArray();
			data['announcements'] = await dat.db.saved.where({ tableName: 'announcement', owner: pg.groupId }).toArray();
			data['schedules'] = await dat.db.saved.where({ tableName: 'schedule', owner: pg.groupId }).toArray();
			data['assignments'] = await dat.db.saved.where({ tableName: 'assignment', owner: pg.groupId }).toArray();
			data['exams'] = await dat.db.saved.where({ tableName: 'exam', owner: pg.groupId }).toArray();
			if (pg.thisPage.id !== currentPage) return;

			//limit older date is today
			data['announcements'] = pg.limitToToday(data['announcements']);
			data['assignments'] = pg.limitToToday(data['assignments']);
			data['exams'] = pg.limitToToday(data['exams']);

			//sort
			data['announcements'].sort((a, b) => {
				var aTime = moment(`${a.data.date}${a.data.time != null ? ` ${a.data.time}` : ''}`);
				var bTime = moment(`${b.data.date}${b.data.time != null ? ` ${b.data.time}` : ''}`);

				if (aTime.valueOf() < bTime.valueOf()) return -1;
				if (aTime.valueOf() > bTime.valueOf()) return 1;
				return 0;
			});
			data['assignments'].sort((a, b) => {
				var aTime = moment(a.data.date);
				var bTime = moment(b.data.date);

				if (aTime.valueOf() < bTime.valueOf()) return -1;
				if (aTime.valueOf() > bTime.valueOf()) return 1;
				return 0;
			});
			data['exams'].sort((a, b) => {
				var aTime = moment(a.data.date);
				var bTime = moment(b.data.date);

				if (aTime.valueOf() < bTime.valueOf()) return -1;
				if (aTime.valueOf() > bTime.valueOf()) return 1;
				return 0;
			});

			pg.home.load(data);

			pg.announcement.load(data);

			pg.schedule.load(data);

			pg.assignment.load(data);

			pg.exam.load(data);

			vipGesture.prevent();

			if (app.state.highlightFromActivity != null) {
				var a = app.state.highlightFromActivity;
				delete app.state.highlightFromActivity;
				pg.highlight(a[0], a[1]);
			}
		},
		highlight: (tab, id) => {
			var clicker = pg.thisPage.querySelectorAll('.vipPaging-subNavigator')[tab];
			var body = pg.thisPage.querySelectorAll('.vipPaging-subPage .body > div:first-child')[tab];

			vipPaging.subPage.change(clicker);

			var target = pg.getEl(id);
			var top = target.offsetTop;
			body.scrollTop = top - 20;

			target.classList.add('highlight');
			setTimeout(() => {
				target.classList.remove('highlight');
			}, 800)
		},
	},
	lang: {
		en: {
			members: 'Members',

			home: 'Home',
			activity: 'Activities',
			announcement: 'Announcement',
			schedule: 'Schedule',
			assignment: 'Assignment',
			exam: 'Exam',

			addAnnouncement: 'Create announcement',
			addAssignment: 'Add assignment',
			addExam: 'Add exam',
		},
		id: {
			members: 'Daftar anggota',

			home: 'Beranda',
			activity: 'Aktivitas',
			announcement: 'Pengumuman',
			schedule: 'Jadwal',
			assignment: 'Tugas',
			exam: 'Ujian',

			addAnnouncement: 'Buat pengumuman',
			addAssignment: 'Tambah tugas',
			addExam: 'Tambah ujian',
		},
	},
};