vipPaging.pageTemplate['examForm'] = {
	preopening: () => firebaseAuth.authCheck(true),
	opening: () => {
		ui.btnLoading.install();

		app.listenForChange(['subject'], () => {
			pg.getEl('btn').disabled = pg.getEl('subject').value === '';
		});

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

		pg.groupId = app.activeGroup.get();
		if (pg.groupId === 'empty') {
			window.history.go(-1);
			return;
		}

		pg.loadSubjectAutoFill();

		if (typeof pg.parameter === 'string') {
			//load data
			pg.loadData();
		}
		else {
			//new
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
	<div class="body"><div><div class="maxWidthWrap-480 aPadding-30">

		<datalist id="subjects"></datalist>

		<div class="inputLabel">${gl('subject')}</div>
		<input id="subject" type="text" maxlength="100" placeholder="${gl('subjectPlaceholder')}" list="subjects" autocomplete="off" />

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

	</div></div></div>
</div>
`,
	functions: {
		loadData: async () => {
			var currentPage = `${pg.thisPage.id}`;
			var exam = await dat.db.saved.where({ rowId: pg.parameter }).first();
			if (pg.thisPage.id !== currentPage) return;
			if (exam == null) {
				window.history.go(-1);
				return;
			}

			pg.getEl('subject').value = exam.data.subject;
			pg.getEl('note').value = exam.data.note;
			pg.getEl('date').setAttribute('data-date', exam.data.date);
			pg.getEl('date').value = app.displayDate(exam.data.date);
			if (exam.data.time == null) {
				pg.getEl('time').value = '';
				pg.getEl('clearTimeBtn').setAttribute('data-active', false);
			}
			else {
				pg.getEl('time').value = exam.data.time;
				pg.getEl('clearTimeBtn').setAttribute('data-active', true);
			}
		},
		loadSubjectAutoFill: async () => {
			var currentPage = `${pg.thisPage.id}`;
			var schedulesPerDay = await dat.db.saved.where({ tableName: 'schedule', owner: pg.groupId }).toArray();
			if (pg.thisPage.id !== currentPage) return;

			var schedules = [];
			for (i in schedulesPerDay) schedules = schedules.concat(schedulesPerDay[i].data);

			var subject = [];
			for (i in schedules) {
				if (subject.indexOf(schedules[i].subject) < 0) {
					subject.push(schedules[i].subject);
				}
			}

			subject.sort();
			var out = '';
			for (i in subject) out += `<option value="${app.escapeHTML(subject[i])}">`;
			pg.getEl('subjects').innerHTML = out;
		},
		done: async () => {
			var subject = pg.getEl('subject');
			var note = pg.getEl('note');
			var date = pg.getEl('date').getAttribute('data-date');
			if (pg.getEl('time').value === '') var time = null;
			else var time = pg.getEl('time').value;

			ui.btnLoading.on(pg.getEl('btn'));

			var data = {
				groupId: pg.groupId,
				type: 'exam-new',
				subject: subject.value,
				note: note.value,
				date: date,
				time: time,
			};
			var success = gl('created');

			if (typeof pg.parameter === 'string') {
				data['examId'] = pg.parameter;
				data['type'] = 'exam-edit';
				success = gl('saved');
			}

			dat.sync.groupRequest(data, () => {
				ui.float.success(success);
				window.history.go(-1);
			}, (connectionError) => {
				ui.btnLoading.off(pg.getEl('btn'));
				if (connectionError) ui.float.error(gl('connectionError', null, 'app'));
				else ui.float.error(gl('unexpectedError', data['type'], 'app'));
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

			subject: 'Subject:',
			subjectPlaceholder: 'Subject...',

			note: 'Notes:',
			notePlaceholder: 'You can write up to 500 character...',

			date: 'Date:',
			timePlaceholder: 'Choose time (optional)',

			done: 'Save',
			created: 'New exam created',
			saved: 'Changes are saved',
		},
		id: {
			createTitle: 'Tambah Ujin',
			editTitle: 'Ubah Ujian',

			subject: 'Mata pelajaran:',
			subjectPlaceholder: 'Mata pelajaran...',

			note: 'Catatan:',
			notePlaceholder: 'Bisa sampai 500 karakter...',

			date: 'Tanggal dikumpul:',
			timePlaceholder: 'Pilih waktu (opsional)',

			done: 'Simpan',
			created: 'Ujian berhasil ditambah',
			saved: 'Perubahan tersimpan',
		},
	},
};