vipPaging.pageTemplate['scheduleForm'] = {
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
	<div class="body"><div><div class="maxWidthWrap-480">
		<div class="container-20">
			<h1>${moment(d.parameter[d.parameter.length - 1], 'd').format('dddd')}</h1>
		</div>
		<div id="schedules"></div>
		<div class="aPadding-20">
			<button id="btn" class="primary" onclick="pg.done()">${gl('save')}</button>
		</div>
	</div></div></div>
</div>
`,
	functions: {
		template: (subject, startAt, endAt) => {
			var untouched = subject === '' ? ' data-untouched="true"' : '';
			return `<div class="container-20">
				<input type="text" maxlength="100" placeholder="${gl('subjectPlaceholder')}" value="${app.escapeHTML(subject)}"/>
				<div class="vSpace-10"></div>
				<div class="table startToEnd">
					<div><input${untouched} type="text" readonly onclick="pg.timePicker(this)" value="${startAt}"/></div>
					<div><p>-</p></div>
					<div><input${untouched} type="text" readonly onclick="pg.timePicker(this)" value="${endAt}"/></div>
				</div>
			</div>`;
		},
		timePicker: (i) => {
			ui.popUp.timePicker(i.value, t => {
				//apply selected time to form
				if (t == null) return;
				i.value = t;
				i.removeAttribute('data-untouched');
			});
		},
		mantainSlots: () => {
			var nowPage = `${pg.thisPage.id}`;
			setInterval(() => {
				if (nowPage !== pg.thisPage.id) return;
				var schedules = pg.getEl('schedules').querySelectorAll('.container-20');
				var filled = [];
				var lastStartAt = '06:00';
				var lastEndAt = '07:00';
				for (var i = 0; i < schedules.length; i++) {
					var subjectInput = schedules[i].firstElementChild;
					filled.push(typeof subjectInput.value === 'string' && subjectInput.value !== '');
					var tb = schedules[i].lastElementChild;
					var startAt = tb.firstElementChild.firstElementChild;
					var endAt = tb.lastElementChild.firstElementChild;
	
					if (startAt.getAttribute('data-untouched') === 'true') {
						//adjust to lastStartAt
						startAt.value = lastEndAt;
					}
					if (endAt.getAttribute('data-untouched') === 'true') {
						//adjust to startAt + (lastEndAt - lastStartAt)
						var timeLength = moment(lastEndAt, 'HH:mm') - moment(lastStartAt, 'HH:mm');
						var newEndAt = moment(startAt.value, 'HH:mm').add(timeLength, 'milliseconds');
						endAt.value = moment(newEndAt).format('HH:mm');
					}
	
					lastStartAt = startAt.value;
					lastEndAt = endAt.value;
				}
	
				var lastIndex = filled.length - 1;
				if (filled.length === 0 || filled[lastIndex] === true) {
					//add last slot
					var newSlot = document.createElement('div');
					var timeLength = moment(lastEndAt, 'HH:mm') - moment(lastStartAt, 'HH:mm');
					var newEndAt = moment(lastEndAt, 'HH:mm').add(timeLength, 'milliseconds');
					newSlot.innerHTML = pg.template('', lastEndAt, newEndAt.format('HH:mm'));
					pg.getEl('schedules').appendChild(newSlot.firstElementChild);
				}
				if (filled.length >= 2 && filled[lastIndex] === false && filled[lastIndex - 1] === false) {
					//remove last slot
					var lastSlot = pg.getEl('schedules').lastElementChild;
					pg.getEl('schedules').removeChild(lastSlot);
				}
			}, 100);
		},

		
		loadData: async () => {
			var currentPage = `${pg.thisPage.id}`;
			var schedule = await dat.db.saved.where({ rowId: pg.parameter }).first();
			if (pg.thisPage.id !== currentPage) return;
			if (schedule != null) {
				//load schedule
				var out = [];
				for (i in schedule.data) {
					var d = schedule.data[i];
					var endAt = moment(d.time, 'HH:mm').add(d.length, 'minutes');
					out.push(pg.template(d.subject, d.time, endAt.format('HH:mm')));
				}
				pg.getEl('schedules').innerHTML = out.join('');
			}

			pg.mantainSlots();
		},

		done: async () => {
			ui.btnLoading.on(pg.getEl('btn'));

			var data = {
				groupId: pg.groupId,
				type: 'schedule-edit',
				scheduleId: pg.parameter,
				scheduleData: [],
			};

			var schedules = pg.getEl('schedules').querySelectorAll('.container-20');
			for (var i = 0; i < schedules.length; i++) {
				var subjectInput = schedules[i].firstElementChild;
				if (subjectInput.value === '') continue;
				var tb = schedules[i].lastElementChild;
				var startAt = tb.firstElementChild.firstElementChild;
				var endAt = tb.lastElementChild.firstElementChild;
				data.scheduleData.push({
					subject: subjectInput.value,
					time: startAt.value,
					length: (moment(endAt.value, 'HH:mm') - moment(startAt.value, 'HH:mm')) / (60 * 1000), //in minutes
				});
			}

			dat.sync.groupRequest(data, () => {
				ui.float.success(gl('saved'));
				window.history.go(-1);
			}, (connectionError) => {
				ui.btnLoading.off(pg.getEl('btn'));
				if (connectionError) ui.float.error(gl('connectionError', null, 'app'));
				else ui.float.error(gl('unexpectedError', data['type'], 'app'));
			});
		},
	},
	lang: {
		en: {
			title: 'Edit Schedule',
			save: 'Save',
			subjectPlaceholder: 'Subject',
			saved: 'Changes are saved',
		},
		id: {
			title: 'Ubah Jadwal',
			save: 'Simpan',
			subjectPlaceholder: 'Mata Pelajaran',
			saved: 'Perubahan tersimpan',
		},
	},
};