window.addEventListener('vipPagingPGInit', ev => {
	if (ev.detail.pageId !== 'group') return;

	pg['schedule'] = {
		gl: (a, b) => gl(a, b, 'group-schedule'),
		load: (data) => {
			var schedules = data['schedules'];

			var byDay = {};
			for (i in schedules) {
				var s = schedules[i];
				byDay[s.rowId[s.rowId.length - 1]] = s;
			}

			var day = moment();
			var out = [];
			while (out.length < 7) {
				var schedule = byDay[day.format('d')];
				
				if (schedule == null || schedule.data.length < 1) {
					out.push(`<div class="container-20 highlightable" id="a${pg.groupId}schedule${day.format('d')}">
						<h1>${day.format('dddd')}</h1>
						<div class="vSpace-20"></div>
						<p>${pg.schedule.gl('empty')}</p>
						<div class="vSpace-20"></div>
						<div class="bottomAction">
							<div class="space"></div>
							<div onclick="go('scheduleForm', '${pg.groupId}schedule${day.format('d')}')"><i class="fas fa-pen"></i><p>${pg.schedule.gl('edit')}</p></div>
						</div>
					</div>`);
					day.add(1, 'days');
					continue;
				}

				var subjects = [];
				var times = [];
				for (i in schedule.data) {
					var d = schedule.data[i];
					subjects.push(`<h4>${app.escapeHTML(d.subject)}</h4>`);
					var endTime = moment(d.time, 'HH:mm').add(d.length, 'minutes');
					times.push(`<p>${d.time} - ${endTime.format('HH:mm')}</p>`);
				}

				out.push(`<div class="container-20 highlightable" id="a${schedule.rowId}">
					<h1>${day.format('dddd')}</h1>
					<div class="vSpace-20"></div>
					<div class="table">
						<div>${subjects.join('')}</div>
						<div style="width: 80px; text-align: right">${times.join('')}</div>
					</div>
					<div class="vSpace-20"></div>
					<div class="bottomAction">
						<div class="space"></div>
						<div onclick="go('scheduleForm', '${pg.groupId}schedule${day.format('d')}')"><i class="fas fa-pen"></i><p>${pg.schedule.gl('edit')}</p></div>
					</div>
				</div>`);
				day.add(1, 'days');
			}
			pg.getEl('schedule').innerHTML = out.join('');
		},
	};

	vipLanguage.lang['group-schedule'] = {
		en: {
			empty: 'No schedule',
			edit: 'Edit',
		},
		id: {
			empty: 'Tidak ada jadwal',
			edit: 'Ubah',
		},
	};

});