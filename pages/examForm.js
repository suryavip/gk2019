vipPaging.pageTemplate['examForm'] = {
	preopening: () => firebaseAuth.authCheck(true),
	opening: () => {
		ui.btnLoading.install();

		//note auto height
		var note = pg.getEl('note');
		var scrollHeightChanged = 0; //ignore if this 0 and 1
		app.listenForChange(['note'], () => {
			var scrollBody = pg.thisPage.querySelector('.body > div');
			var s = scrollBody.scrollTop;
			var sh = scrollBody.scrollHeight;

			note.style.height = 'auto';
			note.style.height = (note.scrollHeight) + 'px';

			if (scrollHeightChanged > 1) scrollBody.scrollTop = s + (scrollBody.scrollHeight - sh);
			//only change scrollTop if scrollHeightChanged is > 1 (means its not on initial state)
			scrollHeightChanged++;
		});
		note.setAttribute('style', `height: ${note.scrollHeight}px; overflow-y:hidden;`);

		if (typeof pg.parameter === 'string') {
			//load data
			pg.loadData();
		}
		else {
			//new
			app.listenForChange(['subject'], () => {
				pg.getEl('btn').disabled = pg.getEl('subject').value === '';
			});

			pg.loadGroup();
			pg.getEl('subject').focus();
		}
	},
	innerHTML: d => `
<div class="vipPaging-vLayout">
	<div class="head"><div>
		<div class="actionBar">
			<div class="button" onclick="window.history.go(-1)"><i class="fas fa-arrow-left"></i></div>
			<div class="title">${gl(typeof d.parameter === 'string' ? 'editTitle' : 'createTitle')}</div>
		</div>
	</div></div>
	<div class="body"><div><div class="maxWidthWrap-480">

		<div class="container-20">
			<div class="card list ${typeof d.parameter === 'string' ? '' : 'feedback'}" onclick="${typeof d.parameter === 'string' ? '' : 'pg.chooseGroup()'}">
				<div class="content"><h2 id="selectedGroupName">${gl('private')}</h2></div>
				<div class="icon"><i class="fas fa-sort-down"></i></div>
			</div>
		</div>

		<div class="aPadding-30">
			<datalist id="subjects"></datalist>

			<div class="inputLabel">${gl('subject')}</div>
			<input id="subject" type="text" maxlength="100" placeholder="${gl('subjectPlaceholder')}" list="subjects" autocomplete="off" ${typeof d.parameter === 'string' ? 'disabled' : ''}/>

			<div class="inputLabel">${gl('date')}</div>
			<input id="date" type="text" readonly onclick="ui.popUp.date.picker(this.getAttribute('data-date'), pg.datePicked)" data-date="${moment().format('YYYY-MM-DD')}" value="${app.displayDate()}"/>
			<div class="vSpace-10"></div>
			<div class="inputWithButton">
				<div><input id="time" type="text" readonly onclick="ui.popUp.timePicker(this.value, pg.timePicked)" placeholder="${gl('timePlaceholder')}"/></div>
				<div class="activable" id="clearTimeBtn" onclick="pg.clearTime()"><i class="fas fa-times"></i></div>
			</div>

			<div class="inputLabel">${gl('note')}</div>
			<textarea id="note" maxlength="500" placeholder="${gl('notePlaceholder')}" rows="4"></textarea>

			<div class="vSpace-30"></div>
			<button id="btn" class="primary" onclick="pg.done()">${gl('done')}</button>
		</div>

	</div></div></div>
</div>
`,
	functions: {
		selectedGroup: firebaseAuth.userId,
		loadGroup: async () => {
			var currentPage = `${pg.thisPage.id}`;
			pg.groups = await dat.db.saved.where({ channel: 'group' }).first();
			if (pg.thisPage.id !== currentPage) return;

			if (pg.groups == null) pg.groups = {};
			else pg.groups = pg.groups.data;

			pg.groups[firebaseAuth.userId] = { name: gl('private') };

			if (pg.groups[pg.selectedGroup] == null) {
				//group not found, revert to private
				pg.selectedGroup = firebaseAuth.userId;
			}
			pg.getEl('selectedGroupName').textContent = pg.groups[pg.selectedGroup].name;
			pg.loadSubjectAutoFill();
		},
		chooseGroup: async () => {
			var options = [];
			for (gid in pg.groups) options.push({
				callBackParam: gid,
				title: app.escapeHTML(pg.groups[gid].name),
				icon: gid === firebaseAuth.userId ? 'fas fa-user' : 'fas fa-users',
			});
			options.sort((a, b) => {
				if (a.callBackParam === firebaseAuth.userId) return -1;
				if (b.callBackParam === firebaseAuth.userId) return 1;
				if (a.title < b.title) return -1;
				if (a.title > b.title) return 1;
				return 0;
			});
			ui.popUp.option(options, groupId => {
				if (groupId == null) return;
				if (groupId === pg.selectedGroup) return;
				pg.selectedGroup = groupId;
				pg.loadGroup();
			});
		},
		loadSubjectAutoFill: async () => {
			var currentPage = `${pg.thisPage.id}`;
			var schedules = await dat.db.saved.where({channel: `schedule/${pg.selectedGroup}`}).first();
			if (pg.thisPage.id !== currentPage) return;

			if (schedules == null) schedules = {};
			else schedules = schedules.data;

			var subjects = [];
			for (i in schedules) {
				for (ii in schedules[i]) {
					if (subjects.indexOf(schedules[i][ii].subject) < 0) {
						subjects.push(schedules[i][ii].subject);
					}
				}
			}

			subjects.sort();
			var out = '';
			for (i in subjects) out += `<option value="${app.escapeHTML(subjects[i])}">`;
			pg.getEl('subjects').innerHTML = out;
		},

		loadData: async () => {
			var currentPage = `${pg.thisPage.id}`;
			var channel = await dat.db.ownership.where({id: pg.parameter}).first();
			if (pg.thisPage.id !== currentPage) return;
			if (channel == null) {
				window.history.go(-1);
				return;
			}

			var exams = await dat.db.saved.where({channel: channel.channel}).first();
			if (pg.thisPage.id !== currentPage) return;

			if (exams == null) {
				window.history.go(-1);
				return;
			}

			pg.exam = exams.data[pg.parameter];
			if (pg.exam == null) {
				window.history.go(-1);
				return;
			}

			pg.selectedGroup = channel.channel.split('/')[1];
			pg.loadGroup();

			pg.getEl('subject').value = pg.exam.subject;
			pg.getEl('note').value = pg.exam.note;
			pg.getEl('date').setAttribute('data-date', pg.exam.examDate);
			pg.getEl('date').value = app.displayDate(pg.exam.examDate);

			if (pg.exam.examTime == null) {
				pg.getEl('time').value = '';
				pg.getEl('clearTimeBtn').setAttribute('data-active', false);
			}
			else {
				pg.getEl('time').value = pg.exam.examTime;
				pg.getEl('clearTimeBtn').setAttribute('data-active', true);
			}
		},

		done: async () => {
			var subject = pg.getEl('subject');
			var note = pg.getEl('note');
			var date = pg.getEl('date').getAttribute('data-date');
			if (pg.getEl('time').value === '') var time = null;
			else var time = pg.getEl('time').value;

			if (typeof pg.parameter === 'string' && note.value === pg.exam.note && date === pg.exam.examDate && time === pg.exam.examTime) {
				ui.float.success(gl('nothingChanged'));
				window.history.go(-1);
				return;
			}

			ui.btnLoading.on(pg.getEl('btn'));

			var method = 'POST';
			var data = {
				subject: subject.value,
				note: note.value,
				examDate: date,
				examTime: time,
			};
			var success = gl('created');

			if (typeof pg.parameter === 'string') {
				method = 'PUT';
				data['examId'] = pg.parameter;
				success = gl('saved');
			}

			dat.server.request(method, `exam/${pg.selectedGroup}`, data, () => {
				ui.float.success(success);
				window.history.go(-1);
			}, (connectionError) => {
				ui.btnLoading.off(pg.getEl('btn'));
				if (connectionError) ui.float.error(gl('connectionError', null, 'app'));
				else ui.float.error(gl('unexpectedError', `${method}: exam`, 'app'));
			});
		},

		datePicked: d => {
			//apply selected date to form
			if (d == null) return;
			var date = pg.getEl('date');
			date.value = app.displayDate(d);
			date.setAttribute('data-date', d);
		},
		clearTime: () => {
			pg.getEl('time').value = '';
			pg.getEl('clearTimeBtn').setAttribute('data-active', false);
		},
		timePicked: t => {
			//apply selected time to form
			if (t == null) return;
			pg.getEl('time').value = t;
			pg.getEl('clearTimeBtn').setAttribute('data-active', true);
		},
	},
	lang: {
		en: {
			createTitle: 'Add Exam',
			editTitle: 'Edit Exam',

			private: 'Private',

			subject: 'Subject:',
			subjectPlaceholder: 'Subject...',

			note: 'Notes:',
			notePlaceholder: 'You can write up to 500 character...',

			date: 'Date:',
			timePlaceholder: 'Choose time (optional)',

			done: 'Save',
			created: 'New exam added',
			saved: 'Changes are saved',
			nothingChanged: 'Nothing changed',
		},
		id: {
			createTitle: 'Tambah Ujian',
			editTitle: 'Ubah Ujian',

			private: 'Pribadi',

			subject: 'Mata pelajaran:',
			subjectPlaceholder: 'Mata pelajaran...',

			note: 'Catatan:',
			notePlaceholder: 'Bisa sampai 500 karakter...',

			date: 'Tanggal dikumpul:',
			timePlaceholder: 'Pilih waktu (opsional)',

			done: 'Simpan',
			created: 'Ujian berhasil ditambah',
			saved: 'Perubahan tersimpan',
			nothingChanged: 'Tidak ada perubahan',
		},
	},
};