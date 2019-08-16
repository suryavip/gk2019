vipPaging.pageTemplate['assignmentsAndExams'] = {
	import: [
		'scripts/GroundLevel.js',
		'scripts/ProfileResolver.js',
	],
	preopening: () => firebaseAuth.authCheck(true),
	opening: () => {
		GroundLevel.init();
		dat.attachListener(pg.load, ['group', 'assignment', 'exam', 'opinion']);
	},
	innerHTML: d => `
<div class="vipPaging-vLayout">
	<div class="head"><div>${GroundLevel.head(d.pageId)}</div></div>
	<div class="body"><div><div class="maxWidthWrap-640">
		
		<div class="aPadding-30 activable" style="text-align:center" id="empty">
			<h2>${gl('empty')}</h2>
			<div class="vSpace-30"></div>
			<img src="illustrations/undraw_relaxation_1_wbr7.svg" width="200px" />
			<div class="vSpace-30"></div>
			<button onclick="go('assignmentForm')">${gl('addAssignment')}</button>
			<div class="vSpace-20"></div>
			<button onclick="go('examForm')">${gl('addExam')}</button>
		</div>
		<div id="content"></div>

	</div></div></div>
	<div class="foot"><div>${GroundLevel.foot(d.pageId)}</div></div>
</div>
`,
	functions: {
		load: async () => {
			var todayLimit = app.comparableDate();
			var currentPage = `${pg.thisPage.id}`;
			var groups = await dat.db.group.toArray();
			var assignments = await dat.db.assignment.orderBy('dueDate').filter(a => app.comparableDate(a.dueDate) >= todayLimit).toArray();
			var exams = await dat.db.exam.orderBy('examDate').filter(e => app.comparableDate(e.examDate) >= todayLimit).toArray();
			var opinions = await dat.db.opinion.toArray();
			if (pg.thisPage.id !== currentPage) return;

			//creating owner's name dictionary by groupId
			var ownerName = {};
			ownerName[firebaseAuth.userId] = gl('private');
			for (i in groups) ownerName[groups[i].groupId] = groups[i].name;

			//creating isChecked dictionary by parentId
			var isChecked = {};
			for (i in opinions) isChecked[opinions[i].parentId] = opinions[i].checked;

			//merge assignments and exams
			var byDate = {};
			for (i in exams) {
				var e = exams[i];
				var dt = e.examTime;
				e['type'] = 'exam';
				if (byDate[dt] == null) byDate[dt] = [];
				byDate[dt].push(e);
			}
			for (i in assignments) {
				var a = assignments[i];
				var dt = a.dueDate;
				a['type'] = 'assignment';
				if (byDate[dt] == null) byDate[dt] = [];
				byDate[dt].push(a);
			}

			//print
			var out = '';
			for (i in byDate) {
				var a = byDate[i];
				var rowId = a[`${a.type}Id`];

				if (isChecked[rowId] === true) var checkBtn = `<div onclick="GroundLevel.changeChecked(this, '${a.type}', '${rowId}')" class="theme-positive"><i class="fas fa-check"></i></div>`;
				else var checkBtn = `<div onclick="GroundLevel.changeChecked(this, '${a.type}', '${rowId}')"><i class="fas fa-minus"></i></div>`;

				var attachment = [];
				for (at in a.attachment) {
					attachment.push(`<div class="attachment">
						<i class="fas fa-image"></i>
					</div>`);
				}
				if (a.attachment.length > 0) attachment = `<div class="aPadding-20-tandem">
					<div class="horizontalOverflow vipGesture-prevent">${attachment.join('')}</div>
				</div>`;
				else attachment = '';

				if (a.note !== '') var note = `<div class="aPadding-20-tandem"><p>${app.escapeHTML(a.note)}</p></div>`;
				else var note = '';

				var aTime = moment(`${a.date}${a.examTime != null ? ` ${a.examTime}` : ''}`);

				out += `<div class="container highlightable" id="a${rowId}">
					<div class="list">
						<div class="iconCircle">${checkBtn}</div>
						<div class="content">
							<h4>${gl(a.type)}: ${app.escapeHTML(a.subject)}</h4>
							<h5>${app.displayDate(aTime, false, a.examTime != null)}</h5>
						</div>
					</div>
					${note}
					${attachment}
					<div class="bottomAction aPadding-20-tandem">
						<div onclick="${a.groupId === firebaseAuth.userId ? '' : `go('group', '${a.owner}')`}"><i class="${a.owner === firebaseAuth.userId ? 'fas fa-user' : 'fas fa-users'}"></i><p>${app.escapeHTML(ownerName[a.owner])}</p></div>
						<div class="space"></div>
						<div title="${gl('delete')}" onclick="pg.delete('${a.type}', '${a.owner}', '${rowId}')"><i class="fas fa-trash"></i></div>
						<div title="${gl('edit')}" onclick="go('${a.type}Form', '${rowId}')"><i class="fas fa-pen"></i></div>
					</div>
				</div>`;
			}
			pg.getEl('content').innerHTML = out;
			enableAllTippy();

			pg.getEl('empty').setAttribute('data-active', out === '');

			GroundLevel.doHighlight();
		},
		delete: async (type, owner, id) => {
			ui.popUp.confirm(gl('deleteConfirm', type), a => {
				if (!a) return;
				var data = {};
				data[`${type}Id`] = id;
				dat.server.request('DELETE', `${type}/${owner}`, data, () => {
					ui.float.success(gl('deleteSuccess', type));
				}, (connectionError) => {
					if (connectionError) ui.float.error(gl('connectionError', null, 'app'));
					else ui.float.error(gl('unexpectedError', `DELETE: ${type}`, 'app'));
				});
			});
		},
	},
	lang: {
		en: {
			private: 'Private',
			empty: `There is no assignment or exam`,
			edit: 'Edit',
			delete: 'Delete',
			addAssignment: 'Add Assignment',
			addExam: 'Add Exam',

			assignment: 'Assignment',
			exam: 'Exam',

			deleteConfirm: t => t === 'assignment' ? 'Delete this assignment?' : 'Delete this exam?',
			deleteSuccess: t => t === 'assignment' ? 'Assignment deleted' : 'Exam deleted',
		},
		id: {
			private: 'Pribadi',
			empty: 'Tidak ada tugas ataupun ujian',
			edit: 'Ubah',
			delete: 'Hapus',
			addAssignment: 'Tambah Tugas',
			addExam: 'Tambah Ujian',

			assignment: 'Tugas',
			exam: 'Ujian',

			deleteConfirm: t => t === 'assignment' ? 'Hapus tugas ini?' : 'Hapus ujian ini?',
			deleteSuccess: t => t === 'assignment' ? 'Tugas berhasil dihapus' : 'Ujian berhasil dihapus',
		},
	},
};