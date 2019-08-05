vipPaging.pageTemplate['groupForm'] = {
	import: [
		'scripts/ProfileResolver.js',
	],
	preopening: () => firebaseAuth.authCheck(true),
	opening: () => {
		ui.btnLoading.install();

		app.listenForChange(['name'], () => {
			pg.getEl('btn').disabled = pg.getEl('name').value === '';
		});

		if (typeof pg.parameter === 'string') {
			//load data
			pg.loadGroup();
		}
		else {//new
			ProfileResolver.resolve([firebaseAuth.userId], pg.autoFillSchool);
			pg.getEl('name').focus();
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
	<div class="body"><div><div class="maxWidthWrap-480 aPadding-30">

		<div class="inputLabel">${gl('name')}</div>
		<input id="name" maxlength="20" type="text" placeholder="${gl('namePlaceholder')}" />
		<div class="inputLabel">${gl('schoolName')}</div>
		<input id="school" maxlength="50" type="text" placeholder="${gl('schoolNamePlaceholder')}" />
		<div class="vSpace-30"></div>
		<button id="btn" class="primary" onclick="pg.done()">${gl('done')}</button>

	</div></div></div>
</div>
`,
	functions: {
		autoFillSchool: (u) => {
			if (u[firebaseAuth.userId].isEmpty) return;
			
			var school = u[firebaseAuth.userId].school;
			if (school == null) school = '';
			pg.getEl('school').value = school;
		},
		loadGroup: async () => {
			var currentPage = `${pg.thisPage.id}`;
			var group = await dat.db.saved.where({ channel: 'group' }).first();
			if (pg.thisPage.id !== currentPage) return;

			if (group == null) {
				window.history.go(-1);
				return;
			}

			group = group.data[pg.parameter];
			if (group == null) {
				window.history.go(-1);
				return;
			}

			pg.getEl('name').value = group.name;
			pg.getEl('name').setAttribute('data-original', group.name);
			pg.getEl('school').value = group.school;
			pg.getEl('school').setAttribute('data-original', group.school);
		},
		done: async () => {
			var name = pg.getEl('name');
			var school = pg.getEl('school');

			if (name.value === name.getAttribute('data-original') && school.value === school.getAttribute('data-original')) {
				ui.float.success(gl('nothingChanged'));
				window.history.go(-1);
				return;
			}

			ui.btnLoading.on(pg.getEl('btn'));

			var method = 'POST';
			var data = {
				name: name.value,
				school: school.value,
			};
			var success = gl('groupCreated');

			if (typeof pg.parameter === 'string') {
				method = 'PUT';
				data['groupId'] = pg.parameter;
				success = gl('saved');
			}

			dat.request(method, 'group', data, () => {
				ui.float.success(success);
				window.history.go(-1);
			}, (connectionError) => {
				ui.btnLoading.off(pg.getEl('btn'));
				if (connectionError) ui.float.error(gl('connectionError', null, 'app'));
				else ui.float.error(gl('unexpectedError', `${method}: group`, 'app'));
			});
		},
	},
	lang: {
		en: {
			createTitle: 'Create Group',
			editTitle: 'Edit Group',
			name: 'Class or group name:',
			namePlaceholder: 'example: XII IPA, Chess Club',
			schoolName: 'School name:',
			schoolNamePlaceholder: 'example: SMAN 5 Bekasi',
			done: 'Save',
			groupCreated: 'New group created',
			saved: 'Changes are saved',
			nothingChanged: 'Nothing changed',
		},
		id: {
			createTitle: 'Buat Grup',
			editTitle: 'Ubah Grup',
			name: 'Nama grup/kelas:',
			namePlaceholder: 'contoh: XII IPA, Klub Catur',
			schoolName: 'Nama sekolah:',
			schoolNamePlaceholder: 'contoh: SMAN 5 Bekasi',
			done: 'Simpan',
			nothingChanged: 'Tidak ada perubahan',
			saved: 'Berhasil disimpan',
			groupCreated: 'Grup Kelas berhasil dibuat',
			saved: 'Perubahan tersimpan',
			nothingChanged: 'Tidak ada perubahan',
		},
	},
};