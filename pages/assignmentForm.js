vipPaging.pageTemplate['assignmentForm'] = {
	import: [
		'scripts/AttachmentForm.js',
		'scripts/imagePicker.js',
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
			pg.loadData(); //the rest will be called here
		}
		else {
			//new
			app.listenForChange(['subject'], () => {
				pg.getEl('btn').disabled = pg.getEl('subject').value === '';
			});

			AttachmentForm.init(pg.getEl('attachments'), pg.getEl('attachmentAddBtn'), null, []);

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
	<div class="body"><div><div class="maxWidthWrap-480">

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

			<div class="inputLabel">${gl('note')}</div>
			<textarea id="note" maxlength="500" placeholder="${gl('notePlaceholder')}" rows="4"></textarea>

			<div class="horizontalOverflow vSpace-10" id="attachments">
				<div id="attachmentAddBtn" class="smallAttachment" onclick="AttachmentForm.add()">
					<i class="fas fa-plus"></i>
					<p>${gl('addAttachment')}</p>
				</div>
			</div>

			<div class="vSpace-30"></div>
			<button id="btn" class="primary" onclick="pg.done()">${gl('done')}</button>
		</div>

	</div></div></div>
</div>
`,
	functions: {
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
			pg.loadSubjectAutoFill();
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
				pg.loadOwner();
			});
		},
		loadSubjectAutoFill: async () => {
			var currentPage = `${pg.thisPage.id}`;
			var schedules = await dat.db.schedule.where({ owner: pg.selectedOwner }).toArray();
			if (pg.thisPage.id !== currentPage) return;

			var subjects = [];
			for (i in schedules) {
				for (ii in schedules[i].data) {
					var subject = schedules[i].data[ii].subject;
					if (subjects.indexOf(subject) < 0) subjects.push(subject);
				}
			}

			subjects.sort();
			var out = '';
			for (i in subjects) out += `<option value="${app.escapeHTML(subjects[i])}">`;
			pg.getEl('subjects').innerHTML = out;
		},

		loadData: async () => {
			var currentPage = `${pg.thisPage.id}`;
			pg.assignment = await dat.db.assignment.where({ assignmentId: pg.parameter }).first();
			if (pg.thisPage.id !== currentPage) return;
			if (pg.assignment == null) { //not found
				window.history.go(-1);
				return;
			}

			pg.selectedOwner = pg.assignment.owner;
			pg.loadOwner();

			pg.getEl('subject').value = pg.assignment.subject;
			pg.getEl('note').value = pg.assignment.note;
			pg.getEl('date').setAttribute('data-date', pg.assignment.dueDate);
			pg.getEl('date').value = app.displayDate(pg.assignment.dueDate);

			AttachmentForm.init(pg.getEl('attachments'), pg.getEl('attachmentAddBtn'), pg.assignment.owner, pg.assignment.attachment);
		},

		done: async () => {
			if (AttachmentForm.status !== 0) {
				ui.popUp.alert(gl('uploadInProgress'));
				return;
			}

			var subject = pg.getEl('subject');
			var note = pg.getEl('note');
			var date = pg.getEl('date').getAttribute('data-date');

			if (typeof pg.parameter === 'string' && note.value === pg.assignment.note && date === pg.assignment.dueDate) {
				ui.float.success(gl('nothingChanged'));
				window.history.go(-1);
				return;
			}

			ui.btnLoading.on(pg.getEl('btn'));

			var uploadDate = AttachmentForm.uploadDate.format('YYYY-MM-DD');

			if (pg.selectedOwner === firebaseAuth.userId) {
				//do local first because private assignment
				if (typeof pg.parameter === 'string') {
					await dat.local.private.assignment.put(pg.parameter, date, note.value, AttachmentForm.attachments, uploadDate);
					ui.float.success(gl('saved'));
					window.history.go(-1);
				}
				else {
					await dat.local.private.assignment.post(subject.value, date, note.value, AttachmentForm.attachments, uploadDate);
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
				dueDate: date,
				attachment: AttachmentForm.attachments,
				attachmentUploadDate: uploadDate,
			};
			var success = gl('created');

			if (typeof pg.parameter === 'string') {
				method = 'PUT';
				data['assignmentId'] = pg.parameter;
				success = gl('saved');
			}

			dat.server.request(method, `assignment/${pg.selectedOwner}`, data, () => {
				ui.float.success(success);
				window.history.go(-1);
			}, (connectionError) => {
				ui.btnLoading.off(pg.getEl('btn'));
				if (connectionError) ui.float.error(gl('connectionError', null, 'app'));
				else ui.float.error(gl('unexpectedError', `${method}: assignment`, 'app'));
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

			private: 'Private',

			subject: 'Subject:',
			subjectPlaceholder: 'Subject...',

			date: 'Date:',

			note: 'Notes:',
			notePlaceholder: 'You can write up to 500 character...',

			addAttachment: 'Add attachment',

			uploadInProgress: `Upload are in progress. Please wait until it's finish.`,

			done: 'Save',
			created: 'New assignment added',
			saved: 'Changes are saved',
			nothingChanged: 'Nothing changed',
		},
		id: {
			createTitle: 'Tambah Tugas',
			editTitle: 'Ubah Tugas',

			private: 'Pribadi',

			subject: 'Mata pelajaran:',
			subjectPlaceholder: 'Mata pelajaran...',

			date: 'Tanggal dikumpul:',

			note: 'Catatan:',
			notePlaceholder: 'Bisa sampai 500 karakter...',

			addAttachment: 'Tambah sisipan',

			uploadInProgress: 'Upload sedang dalam proses. Harap tunggu sampai proses selesai.',

			done: 'Simpan',
			created: 'Tugas berhasil ditambah',
			saved: 'Perubahan tersimpan',
			nothingChanged: 'Tidak ada perubahan',
		},
	},
};