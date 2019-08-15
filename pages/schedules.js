vipPaging.pageTemplate['schedules'] = {
	import: [
		'scripts/GroundLevel.js',
		'scripts/ProfileResolver.js',
	],
	preopening: () => firebaseAuth.authCheck(true),
	opening: () => {
		GroundLevel.init();
		if (typeof GroundLevel.pendingHighlight === 'string') {
			var sid = GroundLevel.pendingHighlight;
			pg.selectedDay = sid[sid.length - 1];
		}
		dat.attachListener(pg.load, ['group', 'schedule']);
	},
	innerHTML: d => `
<div class="vipPaging-vLayout">
	<div class="head"><div>${GroundLevel.head(d.pageId)}</div></div>
	<div class="body"><div><div class="maxWidthWrap-640">
		
		<div class="container-20">
			<div class="card list feedback" onclick="pg.chooseDay()">
				<div class="content"><h2 id="selectedDay">${moment().format('dddd')}</h2></div>
				<div class="icon"><i class="fas fa-sort-down"></i></div>
			</div>
		</div>
		<div id="content"></div>

	</div></div></div>
	<div class="foot"><div>${GroundLevel.foot(d.pageId)}</div></div>
</div>
`,
	functions: {
		selectedDay: moment().format('d'),
		chooseDay: () => {
			var options = [];
			for (var i = 0; i < 7; i++) {
				options.push({
					callBackParam: `${i}`,
					title: moment(i, 'd').format('dddd'),
					icon: i == pg.selectedDay ? 'fas fa-check' : '',
				});
			}
			ui.popUp.option(options, day => {
				if (day == null) return;
				if (day === pg.selectedDay) return;
				pg.selectedDay = day;
				pg.load();
			});
		},
		load: async () => {
			pg.getEl('selectedDay').textContent = moment(pg.selectedDay, 'd').format('dddd');

			var currentPage = `${pg.thisPage.id}`;
			var g = await dat.db.group.orderBy('name').toArray();
			var s = await dat.db.schedule.filter(s => s.scheduleId[s.scheduleId.length - 1] === pg.selectedDay).toArray();
			if (pg.thisPage.id !== currentPage) return;

			var groups = [{ name: gl('private'), groupId: firebaseAuth.userId }].concat(g);

			var schedules = {}; //owner as key, array as value containing schedules for selected day
			for (i in s) schedules[s.owner] = s[i];

			pg.build(groups, schedules);
		},
		build: async (groups, schedules) => {
			var out = [];
			for (i in groups) {
				var g = groups[i];
				var s = schedules[g.groupId];
				var sid = `${g.groupId}schedule${pg.selectedDay}`;
				
				if (s == null || s.length < 1) {
					out.push(`<div class="container-20 highlightable" id="a${sid}">
						<h2>${app.escapeHTML(g.name)}</h2>
						<div class="vSpace-20"></div>
						<p>${gl('empty')}</p>
						<div class="vSpace-20"></div>
						<div class="bottomAction">
							<div class="space"></div>
							<div onclick="go('scheduleForm', '${sid}')"><i class="fas fa-pen"></i><p>${gl('edit')}</p></div>
						</div>
					</div>`);
					continue;
				}

				var subjects = [];
				var times = [];
				for (i in s) {
					var d = s[i];
					subjects.push(`<h4>${app.escapeHTML(d.subject)}</h4>`);
					var endTime = moment(d.time, 'HH:mm').add(d.length, 'minutes');
					times.push(`<p>${d.time} - ${endTime.format('HH:mm')}</p>`);
				}

				out.push(`<div class="container-20 highlightable" id="a${sid}">
					<h2>${app.escapeHTML(g.name)}</h2>
					<div class="vSpace-20"></div>
					<div class="table">
						<div class="childSingleLine">${subjects.join('')}</div>
						<div class="childSingleLine" style="width: 80px; text-align: right">${times.join('')}</div>
					</div>
					<div class="vSpace-20"></div>
					<div class="bottomAction">
						<div class="space"></div>
						<div onclick="go('scheduleForm', '${sid}')"><i class="fas fa-pen"></i><p>${gl('edit')}</p></div>
					</div>
				</div>`);
			}
			pg.getEl('content').innerHTML = out.join('');

			GroundLevel.doHighlight();
		},
	},
	lang: {
		en: {
			private: 'Private',
			empty: `No schedule`,
			edit: 'Edit',
		},
		id: {
			private: 'Pribadi',
			empty: 'Tidak ada jadwal',
			edit: 'Ubah',
		},
	},
};