vipPaging.pageTemplate['home'] = {
	import: [
		'scripts/GroundLevel.js',
		'scripts/ProfileResolver.js',
		isCordova ? 'scripts/FeedbackPopUp.js' : null,
	],
	preopening: () => firebaseAuth.authCheck(true),
	opening: () => {
		GroundLevel.init();
		dat.attachListener(pg.load, ['group', 'schedule', 'assignment', 'exam', 'opinion']);

		var dynamicLinkPageId = sessionStorage.getItem('dynamicLinkPageId');
		if (typeof dynamicLinkPageId === 'string') {
			sessionStorage.removeItem('dynamicLinkPageId');
			var sourceAndParameter = vipPaging.getSourceAndParameter(dynamicLinkPageId);
			go(sourceAndParameter.source, sourceAndParameter.parameter);
			return;
		}

		if (isCordova) FeedbackPopUp.init();
	},
	innerHTML: d => `
<div class="vipPaging-vLayout">
	<div class="head"><div>${GroundLevel.head(d.pageId)}</div></div>
	<div class="body"><div><div class="maxWidthWrap-640">
		
		<div class="aPadding-30 activable" style="text-align:center" id="freshStart">
			<h2>${gl('welcome')}</h2>
			<div class="vSpace-30"></div>
			<img src="illustrations/undraw_welcome_3gvl.svg" width="200px" />
			<div class="vSpace-30"></div>
			<button class="primary" onclick="go('groupForm')">${gl('createGroup')}</button>
			<div class="vSpace-30"></div>
			<h3>${gl('joinTips')}</h3>
		</div>

		<div class="aPadding-30 activable" style="text-align:center" id="empty">
			<h2>${gl('emptyTips')}</h2>
			<div class="vSpace-30"></div>
			<img src="illustrations/undraw_product_teardown_elol.svg" width="200px" />
			<div class="vSpace-30"></div>
			<button onclick="GroundLevel.go('schedules')">${gl('manageSchedule')}</button>
			<div class="vSpace-20"></div>
			<button onclick="go('assignmentForm')">${gl('addAssignment')}</button>
			<div class="vSpace-20"></div>
			<button onclick="go('examForm')">${gl('addExam')}</button>
		</div>

		<div class="container aPadding-30 activable" style="text-align:center" id="free">
			<h2 id="freeTitle"></h2>
			<div class="vSpace-30"></div>
			<img src="illustrations/undraw_relaxation_1_wbr7.svg" width="200px" />
			<div class="vSpace-30"></div>
			<button onclick="GroundLevel.go('schedules')">${gl('seeSchedule')}</button>
			<div class="vSpace-20"></div>
			<button onclick="GroundLevel.go('assignmentsAndExams')">${gl('seeAssignmentAndExam')}</button>
		</div>

		<div class="container-20 activable" id="quickSchedule">
			<div class="table">
				<div style="width:100%"><h3 id="quickScheduleTitle"></h3></div>
				<div>
					<div class="circleButton" onclick="GroundLevel.go('schedules')"><i class="fas fa-ellipsis-h"></i></div>
				</div>
			</div>
			<div class="vSpace-10"></div>
			<div class="card aPadding-20 feedback" onclick="GroundLevel.highlight('schedules', pg.selectedDay.format('d'))">
				<div class="table">
					<div class="childSingleLine" id="quickScheduleSubjects"></div>
					<div class="childSingleLine" style="width: 80px; text-align: right" id="quickScheduleHours"></div>
				</div>
			</div>
		</div>

		<div class="container aPadding-30 activable" style="text-align:center" id="noAssignmentOrExam">
			<h2 id="noAssignmentOrExamTitle"></h2>
			<div class="vSpace-30"></div>
			<img src="illustrations/undraw_relaxation_1_wbr7.svg" width="200px" />
			<div class="vSpace-30"></div>
			<button onclick="GroundLevel.go('assignmentsAndExams')">${gl('seeAssignmentAndExam')}</button>
		</div>

		<div class="container-20 activable" id="quickAssignment">
			<div class="table">
				<div style="width:100%"><h3 id="quickAssignmentTitle"></h3></div>
				<div>
					<div class="circleButton" onclick="GroundLevel.go('assignmentsAndExams')"><i class="fas fa-ellipsis-h"></i></div>
				</div>
			</div>
			<div class="vSpace-10"></div>
			<div id="quickAssignmentContent"></div>
		</div>

		<div class="container-20 activable" id="quickExam">
			<div class="table">
				<div style="width:100%"><h3 id="quickExamTitle"></h3></div>
				<div>
					<div class="circleButton" onclick="GroundLevel.go('assignmentsAndExams')"><i class="fas fa-ellipsis-h"></i></div>
				</div>
			</div>
			<div class="vSpace-10"></div>
			<div id="quickExamContent"></div>
		</div>

		<div class="container aPadding-30 activable" id="toggleDayContainer">
			<button onclick="pg.toggleDay()" id="toggleDay"></button>
		</div>

	</div></div></div>
	<div class="foot"><div>${GroundLevel.foot(d.pageId)}</div></div>
</div>
`,
	functions: {
		selectedDay: moment().add(1, 'day'),
		toggleDay: () => {
			var isToday = pg.selectedDay.format('d') === moment().format('d');
			if (isToday) pg.selectedDay = moment().add(1, 'day');
			else pg.selectedDay = moment();
			pg.thisPage.querySelector('.body > div:first-child').scrollTop = 0;
			pg.load();
		},
		load: async () => {
			//set language
			var isToday = pg.selectedDay.format('d') === moment().format('d');
			pg.getEl('freeTitle').textContent = isToday ? gl('freeToday') : gl('freeTomorrow');
			pg.getEl('quickScheduleTitle').textContent = isToday ? gl('todaysSchedule') : gl('tomorrowsSchedule');
			pg.getEl('noAssignmentOrExamTitle').textContent = isToday ? gl('noAssignmentOrExamToday') : gl('noAssignmentOrExamTomorrow');
			pg.getEl('quickAssignmentTitle').textContent = isToday ? gl('todaysAssignment') : gl('tomorrowsAssignment');
			pg.getEl('quickExamTitle').textContent = isToday ? gl('todaysExam') : gl('tomorrowsExam');
			pg.getEl('toggleDay').textContent = isToday ? gl('seeTomorrow') : gl('seeToday');

			var currentPage = `${pg.thisPage.id}`;

			var todayLimit = app.comparableDate();
			var gEmpty = await dat.db.group.count() === 0;
			var sFresh = await dat.db.schedule.filter(s => s.data.length > 0).count() === 0;
			var aFresh = await dat.db.assignment.filter(a => app.comparableDate(a.dueDate) >= todayLimit).count() === 0;
			var eFresh = await dat.db.exam.filter(e => app.comparableDate(e.examDate) >= todayLimit).count() === 0;

			var opinions = await dat.db.opinion.toArray();

			var s = await dat.db.schedule.filter(s => s.scheduleId[s.scheduleId.length - 1] === pg.selectedDay.format('d') && s.data.length > 0).toArray();
			var a = await dat.db.assignment.where({ dueDate: pg.selectedDay.format('YYYY-MM-DD') }).toArray();
			var e = await dat.db.exam.where({ examDate: pg.selectedDay.format('YYYY-MM-DD') }).sortBy('examTime');

			if (pg.thisPage.id !== currentPage) return;

			var sEmpty = s.length === 0;
			var aEmpty = a.length === 0;
			var eEmpty = e.length === 0;

			var isChecked = {};
			for (i in opinions) isChecked[opinions[i].parentId] = opinions[i].checked;

			await pg.loadQuickSchedule(s);
			await pg.loadQuickAssignment(a, isChecked);
			await pg.loadQuickExam(e, isChecked);

			//freshStart means no group, schedule, assignment or exam at all
			//empty means there is group, but no schedule, assignment or exam at all
			//free means there is no schedule, assignment or exam for tomorrow
			//noAssignmentOrExam means there is schedule for tomorrow, but no assignment or exam for tomorrow

			var isFresh = sFresh && aFresh && eFresh;

			pg.getEl('freshStart').setAttribute('data-active', gEmpty && isFresh);
			pg.getEl('empty').setAttribute('data-active', !gEmpty && isFresh);
			pg.getEl('free').setAttribute('data-active', !isFresh && sEmpty && aEmpty && eEmpty);
			pg.getEl('noAssignmentOrExam').setAttribute('data-active', !sEmpty && aEmpty && eEmpty);
			pg.getEl('toggleDayContainer').setAttribute('data-active', !isFresh);
		},
		loadQuickSchedule: async (s) => {
			var schedules = [];
			for (i in s) schedules = schedules.concat(s[i].data);
			schedules.sort((a, b) => {
				if (a.time < b.time) return -1;
				if (a.time > b.time) return 1;
				return 0;
			});

			//build schedule
			var subjects = [];
			var times = [];
			for (i in schedules) {
				var d = schedules[i];
				subjects.push(`<h4>${app.escapeHTML(d.subject)}</h4>`);
				var endTime = moment(d.time, 'HH:mm').add(d.length, 'minutes');
				times.push(`<p>${d.time} - ${endTime.format('HH:mm')}</p>`);
			}
			pg.getEl('quickScheduleSubjects').innerHTML = subjects.join('');
			pg.getEl('quickScheduleHours').innerHTML = times.join('');
			pg.getEl('quickSchedule').setAttribute('data-active', schedules.length > 0);

			return schedules.length === 0; //is empty
		},
		loadQuickAssignment: async (assignment, isChecked) => {
			//filter to only tomorrow's schedule
			var out = [];
			for (i in assignment) {
				var a = assignment[i];
				
				if (isChecked[a.assignmentId]) var checkBtn = `<div onclick="GroundLevel.changeChecked(this, 'assignment', '${a.assignmentId}')" class="theme-positive"><i class="fas fa-check"></i></div>`;
				else var checkBtn = `<div onclick="GroundLevel.changeChecked(this, 'assignment', '${a.assignmentId}')"><i class="fas fa-minus"></i></div>`;

				var note = ''
				if (a.note !== '') note = `<h5>${app.escapeHTML(app.multiToSingleLine(a.note))}</h5>`;

				var attachment = '';
				if (a.attachment.length > 0) attachment = `<h6><i>${gl('attachmentCount', a.attachment.length)}</i></h6>`;

				out.push(`<div class="card list feedback">
					<div class="iconCircle">${checkBtn}</div>
					<div class="content childSingleLine" onclick="GroundLevel.highlight('assignmentsAndExams', '${a.assignmentId}')">
						<h4>${app.escapeHTML(a.subject)}</h4>
						${note}
						${attachment}
					</div>
				</div>`);
			}
			pg.getEl('quickAssignmentContent').innerHTML = out.join('<div class="vSpace-10"></div>');
			pg.getEl('quickAssignment').setAttribute('data-active', out.length > 0);

			return out.length === 0; //is empty
		},
		loadQuickExam: async (exam, isChecked) => {
			//filter to only tomorrow's schedule
			var out = [];
			for (i in exam) {
				var e = exam[i];

				if (isChecked[e.examId]) var checkBtn = `<div onclick="GroundLevel.changeChecked(this, 'exam', '${e.examId}')" class="theme-positive"><i class="fas fa-check"></i></div>`;
				else var checkBtn = `<div onclick="GroundLevel.changeChecked(this, 'exam', '${e.examId}')"><i class="fas fa-minus"></i></div>`;

				var time = '';
				if (e.examTime != null) time = `<h5>${e.examTime}</h5>`;

				var note = ''
				if (e.note !== '') note = `<h5>${app.escapeHTML(app.multiToSingleLine(e.note))}</h5>`;

				var attachment = '';
				if (e.attachment.length > 0) attachment = `<h6><i>${gl('attachmentCount', e.attachment.length)}</i></h6>`;

				out.push(`<div class="card list feedback">
					<div class="iconCircle">${checkBtn}</div>
					<div class="content childSingleLine" onclick="GroundLevel.highlight('assignmentsAndExams', '${e.examId}')">
						<h4>${app.escapeHTML(e.subject)}</h4>
						${time}
						${note}
						${attachment}
					</div>
				</div>`);
			}
			pg.getEl('quickExamContent').innerHTML = out.join('<div class="vSpace-10"></div>');
			pg.getEl('quickExam').setAttribute('data-active', out.length > 0);

			return out.length === 0; //is empty
		},
	},
	lang: {
		en: {
			welcome: 'Welcome...',
			createGroup: `Create new Class's Group`,
			joinTips: 'or join with existing group using link',

			emptyTips: 'Start filling data...',
			manageSchedule: 'Manage Schedule',
			addAssignment: 'Add Assignment',
			addExam: 'Add Exam',

			freeToday: `Nothing for today`,
			freeTomorrow: `Nothing for tomorrow`,
			seeSchedule: 'See Schedules',
			seeAssignmentAndExam: 'See Assignments and Exams',

			noAssignmentOrExamToday: 'There is no assignment or exam today',
			noAssignmentOrExamTomorrow: 'There is no assignment or exam tomorrow',

			todaysSchedule: `Today's schedule:`,
			todaysAssignment: `Today's assignment:`,
			todaysExam: `Today's exam:`,

			tomorrowsSchedule: `Tomorrow's schedule:`,
			tomorrowsAssignment: `Tomorrow's assignment:`,
			tomorrowsExam: `Tomorrow's exam:`,

			seeToday: `See what's for today`,
			seeTomorrow: `See what's for tomorrow`,

			attachmentCount: p => `(${p} attachment${p > 1 ? 's' : ''})`,
		},
		id: {
			welcome: 'Selamat datang...',
			createGroup: 'Buat Grup Kelas',
			joinTips: 'atau gunakan link untuk bergabung ke grup yang sudah ada',

			emptyTips: 'Mulai isi data...',
			manageSchedule: 'Atur Jadwal',
			addAssignment: 'Tambah Tugas',
			addExam: 'Tambah Ujian',

			freeToday: `Tidak ada apa-apa hari ini`,
			freeTomorrow: `Tidak ada apa-apa besok`,
			seeSchedule: 'Lihat Jadwal',
			seeAssignmentAndExam: 'Lihat Tugas dan Ujian',

			noAssignmentOrExamToday: 'Tidak ada tugas atau ujian hari ini',
			noAssignmentOrExamTomorrow: 'Tidak ada tugas atau ujian besok',

			todaysSchedule: `Jadwal hari ini:`,
			todaysAssignment: `Tugas hari ini:`,
			todaysExam: `Ujian hari ini:`,

			tomorrowsSchedule: `Jadwal besok:`,
			tomorrowsAssignment: `Tugas besok:`,
			tomorrowsExam: `Ujian besok:`,

			seeToday: `Lihat untuk hari ini`,
			seeTomorrow: `Lihat untuk besok`,

			attachmentCount: p => `(${p} lampiran)`,
		},
	},
};