window.addEventListener('vipPagingPGInit', ev => {
	if (ev.detail.pageId !== 'group') return;

	pg['exam'] = {
		gl: (a, b) => gl(a, b, 'group-exam'),
		empty: () => `<div class="aPadding-30" style="text-align:center">
			<h2>${pg.exam.gl('empty')}</h2>
			<div class="vSpace-30"></div>
			<img src="illustrations/undraw_relaxation_1_wbr7.svg" width="200px" />
			<div class="vSpace-30"></div>
			<p>${pg.exam.gl('emptyHint')}</p>
		</div>`,
		load: (data) => {
			var exams = data['exams'];

			var out = '';
			for (i in exams) {
				var a = exams[i];

				var attachment = [];
				for (at in a.data.attachment) {
					attachment.push(`<div class="attachment">
						<i class="fas fa-image"></i>
					</div>`);
				}
				if (a.data.attachment.length > 0) attachment = `<div class="aPadding-20-tandem">
					<div class="horizontalOverflow vipGesture-prevent">${attachment.join('')}</div>
				</div>`;
				else attachment = '';

				if (a.data.creator === firebaseAuth.userId) var deleteBtn = `<div onclick="pg.exam.delete('${a.rowId}')"><i class="fas fa-trash"></i><p>${pg.exam.gl('deleteBtn')}</p></div>`;
				else var deleteBtn = '';

				var note = ''
				if (a.data.note !== '') note = `<div class="aPadding-20-tandem">
					<p>${app.escapeHTML(a.data.note)}</p>
				</div>`;

				var aTime = moment(`${a.data.date}${a.data.time != null ? ` ${a.data.time}` : ''}`);
				out += `<div class="container highlightable" id="a${a.rowId}">
					<div class="list">
						<div class="iconCircle"><div><i class="fas fa-minus"></i></div></div>
						<!--div class="iconCircle"><div class="theme-positive"><i class="fas fa-check"></i></div></div-->
						<div class="content">
							<h3>${app.escapeHTML(a.data.subject)}</h3>
							<h5>${app.displayDate(aTime, false, a.data.time != null)}</h5>
						</div>
					</div>
					${note}
					${attachment}
					<div class="bottomAction aPadding-20-tandem">
						<div class="space"></div>
						${deleteBtn}
						<div onclick="go('examForm', '${a.rowId}')"><i class="fas fa-pen"></i><p>${pg.exam.gl('editBtn')}</p></div>
					</div>
				</div>`;
			}

			if (exams.length === 0) pg.getEl('exam').innerHTML = pg.exam.empty();
			else pg.getEl('exam').innerHTML = out;
			photoLoader.autoLoad(pg.getEl('exam'));
			ProfileResolver.fillData(pg.getEl('exam'));
		},
		delete: (examId) => {
			ui.popUp.confirm(pg.exam.gl('deleteConfirm'), a => {
				if (!a) return;
				var success = pg.exam.gl('deleteSuccess'); // store because notif will be showed after this page is closed
				dat.sync.groupRequest({
					type: 'exam-delete',
					examId: examId,
					groupId: pg.groupId,
				}, () => {
					ui.float.success(success);
				}, (connectionError) => {
					if (connectionError) ui.float.error(gl('connectionError', null, 'app'));
					else ui.float.error(gl('unexpectedError', 'exam-delete', 'app'));
				});
			});
		},
	};

	vipLanguage.lang['group-exam'] = {
		en: {
			empty: 'There is no exam',
			emptyHint: 'Create new with + button',

			showMore: 'Show more...',
			showLess: 'Show less...',

			editBtn: 'Edit',
			deleteBtn: 'Delete',

			deleteConfirm: 'Delete this exam?',
			deleteSuccess: 'exam deleted',
		},
		id: {
			empty: 'Tidak ada ujian',
			emptyHint: 'Buat menggunakan tombol +',

			showMore: 'Selengkapnya...',
			showLess: 'Ringkas...',

			editBtn: 'Ubah',
			deleteBtn: 'Hapus',

			deleteConfirm: 'Hapus ujian ini?',
			deleteSuccess: 'Ujian berhasil dihapus',
		},
	};

});