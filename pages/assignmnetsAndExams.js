vipPaging.pageTemplate['assignmnetsAndExams'] = {
	import: [
		'scripts/GroundLevel.js',
		'scripts/ProfileResolver.js',
	],
	preopening: () => firebaseAuth.authCheck(true),
	opening: () => {
		GroundLevel.init();
		dat.attachListener(pg.loadGroup, ['group']);
	},
	innerHTML: d => `
<div class="vipPaging-vLayout">
	<div class="head"><div>${GroundLevel.head(d.pageId)}</div></div>
	<div class="body"><div><div class="maxWidthWrap-640">
		
		<div class="aPadding-30 activable" style="text-align:center" id="empty">
			<h2>${gl('empty')}</h2>
			<div class="vSpace-30"></div>
			<img src="illustrations/undraw_relaxation_1_wbr7.svg" width="200px" />
		</div>
		<div id="content"></div>

	</div></div></div>
	<div class="foot"><div>${GroundLevel.foot(d.pageId)}</div></div>
</div>
`,
	functions: {
		loadGroup: async () => {
			//getting what assignment and exam to listen to
			var currentPage = `${pg.thisPage.id}`;
			var groups = await dat.db.saved.where({ channel: 'group' }).first();
			if (pg.thisPage.id !== currentPage) return;

			var endpoints = [];
			for (gid in groups) {
				endpoints.push(`assignment/${gid}`);
				endpoints.push(`exam/${gid}`);
			}

			if (pg.lastListener != null) pg.thisPage.removeEventListener('dat-change', pg.lastListener);
			pg.lastListener = dat.attachListener(pg.load, endpoints);
		},
		load: async () => {
			var currentPage = `${pg.thisPage.id}`;
			var assignments = await dat.db.saved.where('channel').startsWith('assignment/').toArray();
			var exams = await dat.db.saved.where('channel').startsWith('exam/').toArray();
			if (pg.thisPage.id !== currentPage) return;

			var all = [];
			var group = function (source, type, dateColName) {
				for (i in source) {
					var groupId = source[i].channel.replace(`${type}/`, '');
					for (id in source[i].data) {
						var t = source[i].data[id];
						t['date'] = t[dateColName];
						t[`rowId`] = id;
						t['groupId'] = groupId;
						t['type'] = type;
						all.push(t);
					}
				}
			};
			group(assignments, 'assignment', 'dueDate');
			group(exams, 'exam', 'examDate');

			//sort by type then by date
			all.sort((a, b) => {
				if (a.type === b.type) return 0;
				if (a.type === 'exam') return -1;
				return 1;
			});
			all.sort((a, b) => {
				if (a.date < b.date) return -1;
				if (a.date > b.date) return 1;
				return 0;
			});

			//print
			var out = '';
			for (i in all) {
				var a = all[i];

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

				var note = ''
				if (a.note !== '') note = `<div class="aPadding-20-tandem">
					<p>${app.escapeHTML(a.note)}</p>
				</div>`;

				var aTime = moment(`${a.date}${a.examTime != null ? ` ${a.examTime}` : ''}`);
				out += `<div class="container highlightable" id="${a.type}-${a.rowId}">
					<div class="list">
						<div class="iconCircle"><div><i class="fas fa-minus"></i></div></div>
						<!--div class="iconCircle"><div class="theme-positive"><i class="fas fa-check"></i></div></div-->
						<div class="content">
							<h3>${app.escapeHTML(a.subject)}</h3>
							<h5>${app.displayDate(aTime, false, a.data.time != null)}</h5>
						</div>
					</div>
					${note}
					${attachment}
					<div class="bottomAction aPadding-20-tandem">
						<div class="space"></div>
						<div onclick="pg.exam.delete('${a.rowId}')"><i class="fas fa-trash"></i><p>${pg.exam.gl('deleteBtn')}</p></div>
						<div onclick="go('examForm', '${a.rowId}')"><i class="fas fa-pen"></i><p>${pg.exam.gl('editBtn')}</p></div>
					</div>
				</div>`;
			}
			pg.getEl('content').innerHTML = out;

			pg.getEl('empty').setAttribute('data-active', all.length === 0);
		},
	},
	lang: {
		en: {
			private: 'Private',
			empty: `There is no assignment or exam`,
			edit: 'Edit',
		},
		id: {
			private: 'Pribadi',
			empty: 'Tidak ada tugas ataupun ujian',
			edit: 'Ubah',
		},
	},
};