vipPaging.pageTemplate['assignmentForm'] = {
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

		if (typeof pg.parameter === 'string') {
			//load data
			pg.loadData();
		}
		else {
			//new
			pg.loadSubjectAutoFill();
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
			var assignments = await dat.db.saved.where('channel').startsWith('assignment/').toArray();
			if (pg.thisPage.id !== currentPage) return;

			pg.assignment = null;
			for (i in assignments) pg.assignment = assignments[i].data[pg.parameter];

			if (pg.assignment == null) {
				window.history.go(-1);
				return;
			}

			pg.getEl('subject').value = assignment.data.subject;
			pg.getEl('note').value = assignment.data.note;
			pg.getEl('date').setAttribute('data-date', assignment.data.date);
			pg.getEl('date').value = app.displayDate(assignment.data.date);
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

			ui.btnLoading.on(pg.getEl('btn'));

			var data = {
				groupId: pg.groupId,
				type: 'assignment-new',
				subject: subject.value,
				note: note.value,
				date: date,
			};
			var success = gl('created');

			if (typeof pg.parameter === 'string') {
				data['assignmentId'] = pg.parameter;
				data['type'] = 'assignment-edit';
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
	},
	lang: {
		en: {
			createTitle: 'Add Assignment',
			editTitle: 'Edit Assignment',

			subject: 'Subject:',
			subjectPlaceholder: 'Subject...',

			note: 'Notes:',
			notePlaceholder: 'You can write up to 500 character...',

			date: 'Date:',

			done: 'Save',
			created: 'New assignment created',
			saved: 'Changes are saved',
		},
		id: {
			createTitle: 'Tambah Tugas',
			editTitle: 'Ubah Tugas',

			subject: 'Mata pelajaran:',
			subjectPlaceholder: 'Mata pelajaran...',

			note: 'Catatan:',
			notePlaceholder: 'Bisa sampai 500 karakter...',

			date: 'Tanggal dikumpul:',

			done: 'Simpan',
			created: 'Tugas berhasil ditambah',
			saved: 'Perubahan tersimpan',
		},
	},
};