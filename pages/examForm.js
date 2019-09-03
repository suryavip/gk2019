vipPaging.pageTemplate['examForm'] = {
	import: [
		'scripts/subjectAutoFill.js',
		'scripts/AttachmentForm.js',
		'scripts/FilePicker.js',
		'scripts/compressorjsWrapper.js',
		'lib/compressorjs-1.0.5/compressorjs.min.js',
	],
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
				//get recommended date
				var recommendedDate = subjectAutoFill.getRecommendedDate(pg.getEl('subject').value);
				if (recommendedDate != null) {
					pg.getEl('date').value = app.displayDate(recommendedDate);
					pg.getEl('date').setAttribute('data-date', recommendedDate.format('YYYY-MM-DD'));
				}
				//get recommended time
				var recommendedTime = subjectAutoFill.getRecommendedTime(pg.getEl('subject').value);
				if (recommendedTime != null) pg.timePicked(recommendedTime);
				else pg.clearTime();
			});

			AttachmentForm.init(pg.getEl('attachments'), pg.getEl('attachmentAddBtn'), []);

			pg.loadOwner();
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
	<div class="body"><div><div class="maxWidthWrap-640">

		<div class="container-20">
			<div class="card list ${typeof d.parameter === 'string' ? '' : 'feedback'}" onclick="${typeof d.parameter === 'string' ? '' : 'pg.chooseOwner()'}">
				<div class="content"><h2 id="selectedOwnerName">${gl('private')}</h2></div>
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

			<div class="vSpace-20"></div>
			<button id="attachmentAddBtn" onclick="AttachmentForm.add()">${gl('addAttachment')}</button>
			<div class="grid vSpace-10" id="attachments"></div>

			<div class="vSpace-30"></div>
			<button id="btn" class="primary" onclick="pg.done()">${gl('done')}</button>
		</div>

	</div></div></div>
</div>
`,
	functions: {
		exam: {},
		selectedOwner: firebaseAuth.userId,
		loadOwner: async () => {
			var currentPage = `${pg.thisPage.id}`;
			if (pg.selectedOwner === firebaseAuth.userId) var group = { name: gl('private') };
			else var group = await dat.db.group.where({ groupId: pg.selectedOwner }).first();
			if (pg.thisPage.id !== currentPage) return;

			if (group == null) {
				//group not found, revert to private
				pg.selectedOwner = firebaseAuth.userId;
				pg.loadOwner();
				return;
			}

			pg.getEl('selectedOwnerName').textContent = group.name;
			subjectAutoFill.load(pg.selectedOwner, pg.getEl('subjects'));
		},
		chooseOwner: async () => {
			var currentPage = `${pg.thisPage.id}`;
			var groups = await dat.db.group.orderBy('name').toArray();
			if (pg.thisPage.id !== currentPage) return;

			var options = [{
				callBackParam: firebaseAuth.userId,
				title: gl('private'),
				icon: 'fas fa-user',
			}];
			for (i in groups) options.push({
				callBackParam: groups[i].groupId,
				title: app.escapeHTML(groups[i].name),
				icon: 'fas fa-users',
			});
			ui.popUp.option(options, groupId => {
				if (groupId == null) return;
				if (groupId === pg.selectedOwner) return;
				pg.selectedOwner = groupId;
				pg.getEl('subject').value = '';
				pg.loadOwner();
			});
		},

		loadData: async () => {
			var currentPage = `${pg.thisPage.id}`;
			pg.exam = await dat.db.exam.where({ examId: pg.parameter }).first();
			if (pg.thisPage.id !== currentPage) return;
			if (pg.exam == null) { //not found
				window.history.go(-1);
				return;
			}

			pg.selectedOwner = pg.exam.owner;
			pg.loadOwner();

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

			AttachmentForm.init(pg.getEl('attachments'), pg.getEl('attachmentAddBtn'), pg.exam.attachment);
		},

		done: async () => {
			if (Object.keys(AttachmentForm.status.value).length > 0) {
				ui.popUp.alert(gl('uploadInProgress'));
				return;
			}

			var subject = pg.getEl('subject');
			var note = pg.getEl('note');
			var date = pg.getEl('date').getAttribute('data-date');
			if (pg.getEl('time').value === '') var time = null;
			else var time = pg.getEl('time').value;

			var attachmentSame = JSON.stringify(AttachmentForm.attachments) === JSON.stringify(pg.exam.attachment);

			if (typeof pg.parameter === 'string' && note.value === pg.exam.note && date === pg.exam.examDate && time === pg.exam.examTime && attachmentSame) {
				ui.float.success(gl('nothingChanged'));
				window.history.go(-1);
				return;
			}

			ui.btnLoading.on(pg.getEl('btn'));

			if (pg.selectedOwner === firebaseAuth.userId) {
				//do local first because private exam
				if (typeof pg.parameter === 'string') {
					await dat.local.private.exam.put(pg.parameter, date, time, note.value, AttachmentForm.attachments);
					ui.float.success(gl('saved'));
					window.history.go(-1);
				}
				else {
					await dat.local.private.exam.post(subject.value, date, time, note.value, AttachmentForm.attachments);
					ui.float.success(gl('created'));
					window.history.go(-1);
				}
				return;
			}

			//do to server directly

			var method = 'POST';
			var data = {
				subject: subject.value,
				note: note.value,
				examDate: date,
				examTime: time,
				attachment: AttachmentForm.attachments,
			};
			var success = gl('created');

			if (typeof pg.parameter === 'string') {
				method = 'PUT';
				data['examId'] = pg.parameter;
				success = gl('saved');
			}

			dat.server.request(method, `exam/${pg.selectedOwner}`, data, () => {
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

			addAttachment: 'Add attachment',

			uploadInProgress: `Upload are in progress. Please wait until it's finish.`,

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

			addAttachment: 'Tambah lampiran',

			uploadInProgress: 'Upload sedang dalam proses. Harap tunggu sampai proses selesai.',

			done: 'Simpan',
			created: 'Ujian berhasil ditambah',
			saved: 'Perubahan tersimpan',
			nothingChanged: 'Tidak ada perubahan',
		},
	},
};