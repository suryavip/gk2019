vipPaging.pageTemplate['assignmentsAndExams'] = {
	import: [
		'scripts/GroundLevel.js',
		'scripts/ProfileResolver.js',

		`lib/photoSwipe-4.1.2/photoswipe.css`,
		`lib/photoSwipe-4.1.2/default-skin/default-skin.css`,
		`lib/photoSwipe-4.1.2/photoswipe.min.js`,
		`lib/photoSwipe-4.1.2/photoswipe-ui-default.js`,
		`scripts/photoswipeController.js`,
	],
	preopening: () => firebaseAuth.authCheck(true),
	opening: async () => {
		GroundLevel.init();
		dat.attachListener(pg.load, ['assignment', 'exam', 'opinion']);
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
				var dt = e.examDate;
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

			pg.build(byDate, ownerName, isChecked);
		},
		downloadFileAttachment: async (refPath) => {
			vipLoading.add('downloadFileAttachment');
			try {
				var ref = firebase.storage().ref(refPath);
				var url = await ref.getDownloadURL();
				//TODO
				vipLoading.remove('downloadFileAttachment');
			}
			catch (err) {
				vipLoading.remove('downloadFileAttachment');
			}
		},
		attachmentRefPaths: {}, //group by assignment / exam id
		attachmentProcessor: (parentId, owner, attachment) => {
			pg.attachmentRefPaths[parentId] = [];
			for (i in attachment) {
				if (typeof attachment[i].originalFilename !== 'string') {
					attachment[i]['imageIndex'] = pg.attachmentRefPaths[parentId].length;
					pg.attachmentRefPaths[parentId].push(`attachment/${owner}/${attachment[i].attachmentId}`);
				}
			}
			var out = [];
			for (i in attachment) {
				var at = attachment[i];
				var refPath = `attachment/${owner}/${at.attachmentId}`;
				if (typeof at.originalFilename === 'string') {
					out.push(`<div class="attachment" onclick="pg.downloadFileAttachment('${refPath}')">
						<i class="fas fa-file"></i>
						<p>${app.escapeHTML(at.originalFilename)}</p>
					</div>`)
				}
				else {
					var photoRefPath = `attachment/${owner}/${at.attachmentId}_thumb`;
					out.push(`<div class="attachment" data-photoRefPath="${photoRefPath}" onclick="photoswipeController.showFirebase(pg.attachmentRefPaths['${parentId}'], ${at.imageIndex}, true)">
						<i class="fas fa-image"></i>
					</div>`);
				}
			}
			if (out.length > 0) return `<div class="aPadding-20-tandem">
				<div class="horizontalOverflow vipGesture-prevent">${out.join('')}</div>
			</div>`;
			return '';
		},
		build: (byDate, ownerName, isChecked) => {
			var out = '';
			
			//sorting dates
			var dates = Object.keys(byDate).sort();

			for (d in dates) {
				for (i in byDate[dates[d]]) {
					var a = byDate[dates[d]][i];
					var rowId = a[`${a.type}Id`];

					if (isChecked[rowId]) var checkBtn = `<div onclick="GroundLevel.changeChecked(this, '${a.type}', '${rowId}')" class="theme-positive"><i class="fas fa-check"></i></div>`;
					else var checkBtn = `<div onclick="GroundLevel.changeChecked(this, '${a.type}', '${rowId}')"><i class="fas fa-minus"></i></div>`;

					var attachment = pg.attachmentProcessor(rowId, a.owner, a.attachment);

					if (a.note !== '') var note = `<div class="aPadding-20-tandem"><p>${app.escapeHTML(a.note)}</p></div>`;
					else var note = '';

					var aDate = a.type === 'assignment' ? a.dueDate : a.examDate;
					var aTime = moment(`${aDate}${a.examTime != null ? ` ${a.examTime}` : ''}`);

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
			}

			pg.getEl('content').innerHTML = out;
			enableAllTippy();

			pg.getEl('empty').setAttribute('data-active', out === '');

			photoLoader.autoLoad(pg.getEl('content'));

			GroundLevel.doHighlight();
		},
		delete: async (type, owner, id) => {
			ui.popUp.confirm(gl('deleteConfirm', type), async a => {
				if (!a) return;
				if (owner === firebaseAuth.userId) {
					//do local first because private assignment/exam
					await dat.local.private[type].delete(id);
					ui.float.success(gl('deleteSuccess', type));
					return;
				}

				//do to server directly
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