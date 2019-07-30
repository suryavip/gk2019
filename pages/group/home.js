/*`
<div class="vSpace-20 activables" id="pendings">
	<div class="table">
		<div style="width:100%"><h3>Permintaan Bergabung:</h3></div>
		<div>
			<div class="circleButton"><i class="fas fa-ellipsis-h"></i></div>
		</div>
	</div>
	<div class="vSpace-10"></div>
	<div class="horizontalOverflow vipGesture-prevent" id="pendingsContent"></div>
	<div class="vSpace-10"></div>
</div>

<div class="vSpace-20 activables" id="members">
	<div class="table">
		<div style="width:100%"><h3>Anggota:</h3></div>
		<div>
			<div class="circleButton"><i class="fas fa-ellipsis-h"></i></div>
		</div>
	</div>
	<div class="vSpace-10"></div>
	<div class="horizontalOverflow vipGesture-prevent" id="membersContent"></div>
	<div class="vSpace-10"></div>
</div>`;*/

window.addEventListener('vipPagingPGInit', ev => {
	if (ev.detail.pageId !== 'group') return;

	pg['home'] = {
		gl: (a, b) => gl(a, b, 'group-home'),
		init: () => {
			pg.getEl('home').innerHTML = `<div class="container-20">
				<div class="table">
					<div style="width:100%">
						<h1 id="groupName"></h1>
						<h5>SMA Pax Patriae, Bekasi</h5>
					</div>
					<div>
						<div class="circleButton" onclick="go('groupForm', 'edit')" title="${pg.home.gl('edit')}"><i class="fas fa-pen"></i></div>
					</div>
				</div>
				<div class="vSpace-30 activable" style="text-align:center" id="noMember">
					<img src="illustrations/undraw_true_friends_c94g.svg" width="200px" />
					<div class="vSpace-10"></div>
				</div>
				<div class="vSpace-20"></div>
				<button class="primary">${pg.home.gl('inviteFriend')}</button>
			</div>

			<div class="container-20 activable" style="text-align:center" id="freshStart">
				<h2>${pg.home.gl('freshStart')}</h2>
				<div class="vSpace-30"></div>
				<img src="illustrations/undraw_product_teardown_elol.svg" width="200px" />
				<div class="vSpace-30"></div>
				<button onclick="vipPaging.subPage.change('scheduleTabBtn')">${pg.home.gl('manageSchedule')}</button>
				<div class="vSpace-20"></div>
				<button onclick="go('assignmentForm')">${pg.home.gl('addAssignment')}</button>
				<div class="vSpace-20"></div>
				<button onclick="go('examForm')">${pg.home.gl('addExam')}</button>
			</div>

			<div class="container-20 activable" style="text-align:center" id="freeTomorrow">
				<h2>${pg.home.gl('freeTomorrow')}</h2>
				<div class="vSpace-30"></div>
				<img src="illustrations/undraw_relaxation_1_wbr7.svg" width="200px" />
				<div class="vSpace-30"></div>
				<button onclick="vipPaging.subPage.change('scheduleTabBtn')">${pg.home.gl('checkSchedule')}</button>
				<div class="vSpace-20"></div>
				<button onclick="vipPaging.subPage.change('assignmentTabBtn')">${pg.home.gl('checkAssignment')}</button>
				<div class="vSpace-20"></div>
				<button onclick="vipPaging.subPage.change('examTabBtn')">${pg.home.gl('checkExam')}</button>
			</div>

			<div class="container-20 activable" id="quickAnnouncement">
				<div class="table">
					<div style="width:100%"><h3>${pg.home.gl('tomorrowAnnouncement')}</h3></div>
					<div>
						<div class="circleButton" onclick="vipPaging.subPage.change('announcementTabBtn')"><i class="fas fa-ellipsis-h"></i></div>
					</div>
				</div>
				<div class="vSpace-10"></div>
				<div class="horizontalOverflow vipGesture-prevent" id="quickAnnouncementContent"></div>
			</div>

			<div class="container-20 activable" id="quickSchedule">
				<div class="table">
					<div style="width:100%"><h3>${pg.home.gl('tomorrowSchedule')}</h3></div>
					<div>
						<div class="circleButton" onclick="vipPaging.subPage.change('scheduleTabBtn')"><i class="fas fa-ellipsis-h"></i></div>
					</div>
				</div>
				<div class="vSpace-10"></div>
				<div class="card aPadding-20 feedback" onclick="pg.highlight(2, 'a${pg.groupId}schedule${moment().add(1, 'days').format('d')}')">
					<div class="table">
						<div id="quickScheduleSubjects"></div>
						<div style="width: 80px; text-align: right" id="quickScheduleHours"></div>
					</div>
				</div>
			</div>

			<div class="container-20 activable" id="quickAssignment">
				<div class="table">
					<div style="width:100%"><h3>${pg.home.gl('tomorrowAssignment')}</h3></div>
					<div>
						<div class="circleButton" onclick="vipPaging.subPage.change('assignmentTabBtn')"><i class="fas fa-ellipsis-h"></i></div>
					</div>
				</div>
				<div class="vSpace-10"></div>
				<div class="horizontalOverflow vipGesture-prevent" id="quickAssignmentContent"></div>
			</div>

			<div class="container-20 activable" id="quickExam">
				<div class="table">
					<div style="width:100%"><h3>${pg.home.gl('tomorrowExam')}</h3></div>
					<div>
						<div class="circleButton" onclick="vipPaging.subPage.change('examTabBtn')"><i class="fas fa-ellipsis-h"></i></div>
					</div>
				</div>
				<div class="vSpace-10"></div>
				<div class="horizontalOverflow vipGesture-prevent" id="quickExamContent"></div>
			</div>
			`;
			enableAllTippy();
		},
		load: (data) => {
			pg.home.init();

			var group = data['group'];
			var members = data['members'];
			var announcements = data['announcements'];
			var schedules = data['schedules'];
			var assignments = data['assignments'];
			var exams = data['exams'];

			pg.getEl('title').textContent = group.data.name;
			pg.getEl('groupName').textContent = group.data.name;
			pg.getEl('noMember').setAttribute('data-active', members.length === 1);
			pg.getEl('freshStart').setAttribute('data-active', schedules.length === 0 && assignments.length === 0 && exams.length === 0);

			var quickAnnouncement = pg.home.quickAnnouncement(announcements);
			var quickSchedule = pg.home.quickSchedule(schedules);
			var quickAssignment = pg.home.quickAssignment(assignments);
			var quickExam = pg.home.quickExam(exams);

			var empty = quickAnnouncement && quickSchedule && quickAssignment && quickExam;

			pg.getEl('freeTomorrow').setAttribute('data-active', empty);
		},
		quickAnnouncement: (announcements) => {
			var tomorrow = moment().add(1, 'days').format('YYYY-MM-DD');
			var out = [];
			for (i in announcements) {
				var a = announcements[i];
				if (a.data.date !== tomorrow) continue;
				var at = '';
				if (a.data.attachment.length > 0) at = `<h5 class="singleLine">(${pg.home.gl('attachmentCount', a.data.attachment.length)})</h5>`;
				out.push(`<div class="card aPadding-20 feedback" onclick="pg.highlight(1, 'a${a.rowId}')">
					<h4 class="singleLine">${app.escapeHTML(a.data.title)}</h4>
					<p class="singleLine">${app.escapeHTML(app.multiToSingleLine(a.data.text))}</p>
					${at}
				</div>`);
			}
			pg.getEl('quickAnnouncementContent').innerHTML = out.join('');

			if (out.length < 2) pg.getEl('quickAnnouncementContent').classList.remove('horizontalOverflow');
			else pg.getEl('quickAnnouncementContent').classList.add('horizontalOverflow');

			pg.getEl('quickAnnouncement').setAttribute('data-active', out.length > 0);
			return out.length === 0;
		},
		quickSchedule: (schedules) => {
			var tomorrow = moment().add(1, 'days').format('d');
			var schedule = [];
			for (i in schedules) {
				var a = schedules[i];
				if (a.rowId[a.rowId.length - 1] === tomorrow) schedule = a.data;
			}
			var subjects = [];
			var times = [];
			for (i in schedule) {
				var d = schedule[i];
				subjects.push(`<h4>${app.escapeHTML(d.subject)}</h4>`);
				var endTime = moment(d.time, 'HH:mm').add(d.length, 'minutes');
				times.push(`<p>${d.time} - ${endTime.format('HH:mm')}</p>`);
			}
			pg.getEl('quickScheduleSubjects').innerHTML = subjects.join('');
			pg.getEl('quickScheduleHours').innerHTML = times.join('');

			pg.getEl('quickSchedule').setAttribute('data-active', schedule.length > 0);
			return schedule.length === 0;
		},
		quickAssignment: (assignments) => {
			var tomorrow = moment().add(1, 'days').format('YYYY-MM-DD');
			var out = [];
			for (i in assignments) {
				var a = assignments[i];
				if (a.data.date !== tomorrow) continue;
				out.push(`<div class="card feedback"><div class="list">
					<div class="iconCircle"><div><i class="fas fa-minus"></i></div></div>
					<div class="content" onclick="pg.highlight(3, 'a${a.rowId}')">
						<h4 class="singleLine">${app.escapeHTML(a.data.subject)}</h4>
						<p class="singleLine">${app.escapeHTML(app.multiToSingleLine(a.data.note))}</p>
					</div>
				</div></div>`);
			}
			pg.getEl('quickAssignmentContent').innerHTML = out.join('');

			if (out.length < 2) pg.getEl('quickAssignmentContent').classList.remove('horizontalOverflow');
			else pg.getEl('quickAssignmentContent').classList.add('horizontalOverflow');

			pg.getEl('quickAssignment').setAttribute('data-active', out.length > 0);
			return out.length === 0;
		},
		quickExam: (exams) => {
			var tomorrow = moment().add(1, 'days').format('YYYY-MM-DD');
			var out = [];
			for (i in exams) {
				var a = exams[i];
				if (a.data.date !== tomorrow) continue;
				var time = '';
				if (a.data.time != null) time = `<h5>${a.data.time}</h5>`;
				out.push(`<div class="card feedback"><div class="list">
					<div class="iconCircle"><div><i class="fas fa-minus"></i></div></div>
					<div class="content" onclick="pg.highlight(4, 'a${a.rowId}')">
						<h4 class="singleLine">${app.escapeHTML(a.data.subject)}</h4>
						<p class="singleLine">${app.escapeHTML(app.multiToSingleLine(a.data.note))}</p>
						${time}
					</div>
				</div></div>`);
			}
			pg.getEl('quickExamContent').innerHTML = out.join('');

			if (out.length < 2) pg.getEl('quickExamContent').classList.remove('horizontalOverflow');
			else pg.getEl('quickExamContent').classList.add('horizontalOverflow');

			pg.getEl('quickExam').setAttribute('data-active', out.length > 0);
			return out.length === 0;
		},
	};

	vipLanguage.lang['group-home'] = {
		en: {
			edit: 'Edit info',
			inviteFriend: 'Invite Friends',
			freshStart: 'Complete your classroom',
			manageSchedule: 'Manage Schedule',
			addAssignment: 'Add Assignment',
			addExam: 'Add Exam',
			freeTomorrow: 'You are free tomorrow',
			checkSchedule: 'Check Schedule',
			checkAssignment: 'Check Assignment',
			checkExam: 'Check Exam',
			tomorrowAnnouncement: `Tomorrow's announcement:`,
			tomorrowSchedule: `Tomorrow's schedule:`,
			tomorrowAssignment: `Tomorrow's assignment:`,
			tomorrowExam: `Tomorrow's exam:`,
			attachmentCount: p => `${p} attachments`,
		},
		id: {
			edit: 'Ubah info',
			inviteFriend: 'Ajak Teman Bergabung',
			freshStart: 'Lengkapi Grup Kelas mu',
			manageSchedule: 'Atur Jadwal',
			addAssignment: 'Tambah Tugas',
			addExam: 'Tambah Ujian',
			freeTomorrow: 'Tidak ada apa-apa besok',
			checkSchedule: 'Cek Jadwal',
			checkAssignment: 'Cek Tugas',
			checkExam: 'Cek Ujian',
			tomorrowAnnouncement: 'Pengumuman untuk besok:',
			tomorrowSchedule: `Jadwal besok:`,
			tomorrowAssignment: `Tugas besok:`,
			tomorrowExam: `Ujian besok:`,
			attachmentCount: p => `${p} sisipan`,
		},
	};

});