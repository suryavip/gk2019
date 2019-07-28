window.addEventListener('vipPagingPGInit', ev => {
	if (ev.detail.pageId !== 'group') return;

	pg['assignment'] = {
		gl: (a, b) => gl(a, b, 'group-assignment'),
		empty: () => `<div class="aPadding-30" style="text-align:center">
			<h2>${pg.assignment.gl('empty')}</h2>
			<div class="vSpace-30"></div>
			<img src="illustrations/undraw_relaxation_1_wbr7.svg" width="200px" />
			<div class="vSpace-30"></div>
			<p>${pg.assignment.gl('emptyHint')}</p>
		</div>`,
		load: (data) => {
			var assignments = data['assignments'];

			var out = '';
			for (i in assignments) {
				var a = assignments[i];

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

				if (a.data.creator === firebaseAuth.userId) var deleteBtn = `<div onclick="pg.assignment.delete('${a.rowId}')"><i class="fas fa-trash"></i><p>${pg.assignment.gl('deleteBtn')}</p></div>`;
				else var deleteBtn = '';

				var note = ''
				if (a.data.note !== '') note = `<div class="aPadding-20-tandem">
					<p>${app.escapeHTML(a.data.note)}</p>
				</div>`;

				out += `<div class="container highlightable" id="a${a.rowId}">
					<div class="list">
						<div class="iconCircle"><div><i class="fas fa-minus"></i></div></div>
						<div class="content">
							<h3>${app.escapeHTML(a.data.subject)}</h3>
							<h5>${app.displayDate(a.data.date)}</h5>
						</div>
					</div>
					${note}
					${attachment}
					<div class="bottomAction aPadding-20-tandem">
						<div class="space"></div>
						${deleteBtn}
						<div onclick="go('assignmentForm', '${a.rowId}')"><i class="fas fa-pen"></i><p>${pg.assignment.gl('editBtn')}</p></div>
					</div>
				</div>`;
			}

			if (assignments.length === 0) pg.getEl('assignment').innerHTML = pg.assignment.empty();
			else pg.getEl('assignment').innerHTML = out;
			photoLoader.autoLoad(pg.getEl('assignment'));
			ProfileResolver.fillData(pg.getEl('assignment'));
		},
		delete: (assignmentId) => {
			ui.popUp.confirm(pg.assignment.gl('deleteConfirm'), a => {
				if (!a) return;
				var success = pg.assignment.gl('deleteSuccess'); // store because notif will be showed after this page is closed
				dat.sync.groupRequest({
					type: 'assignment-delete',
					assignmentId: assignmentId,
					groupId: pg.groupId,
				}, () => {
					ui.float.success(success);
				}, (connectionError) => {
					if (connectionError) ui.float.error(gl('connectionError', null, 'app'));
					else ui.float.error(gl('unexpectedError', 'assignment-delete', 'app'));
				});
			});
		},
	};

	vipLanguage.lang['group-assignment'] = {
		en: {
			empty: 'There is no assignment',
			emptyHint: 'Create new with + button',

			showMore: 'Show more...',
			showLess: 'Show less...',

			editBtn: 'Edit',
			deleteBtn: 'Delete',

			deleteConfirm: 'Delete this assignment?',
			deleteSuccess: 'Assignment deleted',
		},
		id: {
			empty: 'Tidak ada tugas',
			emptyHint: 'Buat menggunakan tombol +',

			showMore: 'Selengkapnya...',
			showLess: 'Ringkas...',

			editBtn: 'Ubah',
			deleteBtn: 'Hapus',

			deleteConfirm: 'Hapus tugas ini?',
			deleteSuccess: 'Tugas berhasil dihapus',
		},
	};

});