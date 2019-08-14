vipPaging.pageTemplate['home'] = {
	import: [
		'scripts/GroundLevel.js',
		'scripts/ProfileResolver.js',
	],
	preopening: () => firebaseAuth.authCheck(true),
	opening: () => {
		GroundLevel.init();
		dat.attachListener(pg.load, ['group', 'schedule', 'assignment', 'exam']);
	},
	innerHTML: d => `
<div class="vipPaging-vLayout">
	<div class="head"><div>${GroundLevel.head(d.pageId)}</div></div>
	<div class="body"><div><div class="maxWidthWrap-640">
		
		<div class="container aPadding-30 activable" style="text-align:center" id="freshStart">
			<h2>${gl('welcome')}</h2>
			<div class="vSpace-30"></div>
			<img src="illustrations/undraw_welcome_3gvl.svg" width="200px" />
			<div class="vSpace-30"></div>
			<button class="primary" onclick="go('groupForm')">${gl('createGroup')}</button>
			<div class="vSpace-30"></div>
			<h3>${gl('joinTips')}</h3>
		</div>

		<div class="container aPadding-30 activable" style="text-align:center" id="empty">
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
			<div class="card aPadding-20 feedback" onclick="GroundLevel.highlight('schedules', 'a${pg.groupId}schedule${moment().add(1, 'days').format('d')}')">
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
			var g = await dat.db.saved.where({ channel: 'group' }).first();
			var o = await dat.db.saved.where({ channel: 'opinion' }).first();
			var s = await dat.db.saved.where('channel').startsWith('schedule/').toArray();
			var a = await dat.db.saved.where('channel').startsWith('assignment/').toArray();
			var e = await dat.db.saved.where('channel').startsWith('exam/').toArray();
			if (pg.thisPage.id !== currentPage) return;

			if (o == null) var opinions = {};
			else var opinions = o.data;

			//go into data col
			var mergeData = function (fromArray) {
				var r = {};
				for (i in fromArray) {
					for (ii in fromArray[i].data) r[ii] = fromArray[i].data[ii];
				}
				return r;
			};
			var s = mergeData(s);
			var a = mergeData(a);
			var e = mergeData(e);

			var gEmpty = g == null || Object.keys(g.data).length === 0;
			var sCount = 0;
			for (i in s) sCount += s[i].length;
			var sFresh = sCount === 0;
			var aFresh = Object.keys(a).length === 0;
			var eFresh = Object.keys(e).length === 0;
			var sEmpty = await pg.loadQuickSchedule(s);
			var aEmpty = await pg.loadQuickAssignment(a, opinions);
			var eEmpty = await pg.loadQuickExam(e, opinions);

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
			//filter to only tomorrow's schedule
			var schedules = [];
			for (scheduleId in s) {
				if (scheduleId[scheduleId.length - 1] !== pg.selectedDay.format('d')) continue;
				schedules = schedules.concat(s[scheduleId]);
			}
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
		loadQuickAssignment: async (assignment, opinions) => {
			//filter to only tomorrow's schedule
			var out = [];
			for (assignmentId in assignment) {
				if (assignment[assignmentId].dueDate !== pg.selectedDay.format('YYYY-MM-DD')) continue;

				var a = assignment[assignmentId];
				var opinion = opinions[assignmentId];
				if (opinion == null) var checked = false;
				else var checked = opinion.checked;

				var checkBtn = `<div onclick="GroundLevel.changeChecked(this, 'assignment', '${assignmentId}')"><i class="fas fa-minus"></i></div>`;
				if (checked) checkBtn = `<div onclick="GroundLevel.changeChecked(this, 'assignment', '${assignmentId}')" class="theme-positive"><i class="fas fa-check"></i></div>`;

				var note = ''
				if (a.note !== '') note = `<h5>${app.escapeHTML(app.multiToSingleLine(a.note))}</h5>`;

				out.push(`<div class="card list feedback">
					<div class="iconCircle">${checkBtn}</div>
					<div class="content childSingleLine" onclick="GroundLevel.highlight('assignmentsAndExams', '${assignmentId}')">
						<h4>${app.escapeHTML(a.subject)}</h4>
						${note}
					</div>
				</div>`);
			}
			pg.getEl('quickAssignmentContent').innerHTML = out.join('<div class="vSpace-10"></div>');
			pg.getEl('quickAssignment').setAttribute('data-active', out.length > 0);

			return out.length === 0; //is empty
		},
		loadQuickExam: async (exam, opinions) => {
			//filter to only tomorrow's schedule
			var e = [];
			for (examId in exam) {
				if (exam[examId].examDate !== pg.selectedDay.format('YYYY-MM-DD')) continue;
				exam[examId]['examId'] = examId;
				e.push(exam[examId]);
			}
			exam = e;
			exam.sort((a, b) => {
				if (a.time < b.time) return -1;
				if (a.time > b.time) return 1;
				return 0;
			});

			var out = [];
			for (i in exam) {
				var e = exam[i];
				var opinion = opinions[e.examId];
				if (opinion == null) var checked = false;
				else var checked = opinion.checked;

				var checkBtn = `<div onclick="GroundLevel.changeChecked(this, 'exam', '${e.examId}')"><i class="fas fa-minus"></i></div>`;
				if (checked) checkBtn = `<div onclick="GroundLevel.changeChecked(this, 'exam', '${e.examId}')" class="theme-positive"><i class="fas fa-check"></i></div>`;

				var time = '';
				if (e.examTime != null) time = `<h5>${e.examTime}</h5>`;

				var note = ''
				if (e.note !== '' && time == '') note = `<h5>${app.escapeHTML(app.multiToSingleLine(e.note))}</h5>`;

				out.push(`<div class="card list feedback">
					<div class="iconCircle">${checkBtn}</div>
					<div class="content childSingleLine" onclick="GroundLevel.highlight('assignmentsAndExams', '${e.examId}')">
						<h4>${app.escapeHTML(e.subject)}</h4>
						${time}
						${note}
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
		},
	},
};