vipPaging.pageTemplate['oldVersion'] = {
	preopening: () => firebaseAuth.authCheck(true),
	opening: () => {
		ui.btnLoading.install();

		pg.groupId = app.activeGroup.get();
		if (pg.groupId === 'empty') {
			window.history.go(-1);
			return;
		}

		pg.loadData();
	},
	innerHTML: d => `
<div class="vipPaging-vLayout">
	<div class="head"><div>
		<div class="actionBar">
			<div class="button" onclick="window.history.go(-1)"><i class="fas fa-arrow-left"></i></div>
			<div class="title">${gl('title')}</div>
		</div>
	</div></div>
	<div class="body"><div><div class="maxWidthWrap-640">
		<div class="container-20">
			<h3 id="type"></h3>
			<p id="archiveDate"></p>
		</div>
		<div class="container-20" id="content"></div>
	</div></div></div>
</div>
`,
	functions: {
		loadData: async () => {
			var currentPage = `${pg.thisPage.id}`;
			var a = await dat.db.saved.where({ rowId: pg.parameter[0] }).first();
			if (pg.thisPage.id !== currentPage) return;
			var referTableName = a.data.referTableName;
			
			pg.getEl('type').textContent = gl(referTableName);
			pg.getEl('archiveDate').textContent = gl('archiveDate', a.updateTime * 1000);

			var data = pg.parameter[1] === 'new' ? a.data.newData : a.data.oldData;
			
			if (referTableName === 'announcement') {
				var aTime = moment(`${data.date}${data.time != null ? ` ${data.time}` : ''}`);
				var attachment = [];
				for (at in data.attachment) {
					attachment.push(`<div class="attachment">
						<i class="fas fa-image"></i>
					</div>`);
				}
				if (data.attachment.length > 0) attachment = `<div class="vSpace-20"></div>
				<div class="horizontalOverflow">${attachment.join('')}</div>`;
				else attachment = '';

				pg.getEl('content').innerHTML = `<h1>${app.escapeHTML(data.title)}</h1>
					<h5>${app.displayDate(aTime, false, data.time != null)}</h5>
					<div class="vSpace-20"></div>
					<p>${app.escapeHTML(data.text)}</p>
					${attachment}`;
			}
			else if (referTableName === 'schedule') {
				var subjects = [];
				var times = [];
				for (i in data) {
					var d = data[i];
					subjects.push(`<h4 class="singleLine">${app.escapeHTML(d.subject)}</h4>`);
					var endTime = moment(d.time, 'HH:mm').add(d.length, 'minutes');
					times.push(`<p class="singleLine">${d.time} - ${endTime.format('HH:mm')}</p>`);
				}
				var day = moment(a.data.referRowId[a.data.referRowId.length - 1], 'd');
				pg.getEl('content').innerHTML = `<h1>${day.format('dddd')}</h1>
					<div class="vSpace-20"></div>
					<div class="table">
						<div>${subjects.join('')}</div>
						<div style="width: 80px; text-align: right">${times.join('')}</div>
					</div>`;
			}
			else if (referTableName === 'assignment' || referTableName === 'exam') {
				var aTime = moment(`${data.date}${data.time != null ? ` ${data.time}` : ''}`);
				var attachment = [];
				for (at in data.attachment) {
					attachment.push(`<div class="attachment">
						<i class="fas fa-image"></i>
					</div>`);
				}
				if (data.attachment.length > 0) attachment = `<div class="vSpace-20"></div>
				<div class="horizontalOverflow">${attachment.join('')}</div>`;
				else attachment = '';
				var note = '';
				if (typeof data.note === 'string' && data.note !== '') note = `<div class="vSpace-20"></div>
				<p>${app.escapeHTML(data.note)}</p>`;

				pg.getEl('content').innerHTML = `<h1>${app.escapeHTML(data.subject)}</h1>
					<h5>${app.displayDate(aTime, false, data.time != null)}</h5>
					${note}${attachment}`;
			}
		},
	},
	lang: {
		en: {
			title: 'Archive',
			announcement: 'Announcement',
			schedule: 'Schedule',
			assignment: 'Assignment',
			exam: 'Exam',
			archiveDate: p => `This archive taken on ${app.displayDate(p, false, true)}`,
		},
		id: {
			title: 'Arsip',
			announcement: 'Pengumuman',
			schedule: 'Jadwal',
			assignment: 'Tugas',
			exam: 'Ujian',
			archiveDate: p => `Diarsipkan pada ${app.displayDate(p, false, true)}`,
		},
	},
};