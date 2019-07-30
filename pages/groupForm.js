vipPaging.pageTemplate['groupForm'] = {
	preopening: () => firebaseAuth.authCheck(true),
	opening: () => {
		ui.btnLoading.install();

		app.listenForChange(['name'], () => {
			pg.getEl('btn').disabled = pg.getEl('name').value === '';
		});

		if (pg.parameter === 'edit') {
			//load data
			pg.loadGroup();
		}
		else {
			//new
			pg.getEl('name').focus();
		}
	},
	innerHTML: d => `
<div class="vipPaging-vLayout">
	<div class="head"><div>
		<div class="actionBar">
			<div class="button" onclick="window.history.go(-1)"><i class="fas fa-arrow-left"></i></div>
			<div class="title">${gl(d.parameter === 'edit' ? 'editTitle' : 'createTitle')}</div>
		</div>
	</div></div>
	<div class="body"><div><div class="maxWidthWrap-480 aPadding-30">

		<div class="inputLabel">${gl('name')}</div>
		<input id="name" type="text" placeholder="${gl('namePlaceholder')}" />
		<div class="inputLabel">${gl('schoolName')}</div>
		<input id="school" type="text" placeholder="${gl('schoolNamePlaceholder')}" />
		<div class="vSpace-30"></div>
		<button id="btn" class="primary" onclick="pg.done()">${gl('done')}</button>

	</div></div></div>
</div>
`,
	functions: {
		loadGroup: async () => {
			pg.groupId = app.activeGroup.get();
			if (pg.groupId === 'empty') {
				window.history.go(-1);
				return;
			}

			var currentPage = `${pg.thisPage.id}`;
			var group = await dat.db.saved.where({ rowId: pg.groupId }).first();
			if (pg.thisPage.id !== currentPage) return;

			pg.getEl('name').value = group.data.name;
		},
		done: async () => {
			var name = pg.getEl('name');

			ui.btnLoading.on(pg.getEl('btn'));

			var data = {
				type: 'group-new',
				name: name.value,
			};
			var success = gl('groupCreated');

			if (pg.parameter === 'edit') {
				data['groupId'] = pg.groupId;
				data['type'] = 'group-edit';
				success = gl('saved');
			}

			dat.sync.groupRequest(data, () => {
				ui.float.success(success);
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
			createTitle: 'Create Classroom',
			editTitle: 'Edit Classroom',
			name: 'Class name:',
			namePlaceholder: 'Class name...',
			schoolName: 'School name:',
			schoolNamePlaceholder: 'example: Hogwarts',
			done: 'Save',
			groupCreated: 'New classrom created',
			saved: 'Changes are saved',
		},
		id: {
			createTitle: 'Buat Grup Kelas',
			editTitle: 'Ubah Grup Kelas',
			name: 'Nama kelas:',
			namePlaceholder: 'Nama kelas...',
			schoolName: 'Nama sekolah:',
			schoolNamePlaceholder: 'contoh: SMAN 5',
			done: 'Simpan',
			nothingChanged: 'Tidak ada perubahan',
			saved: 'Berhasil disimpan',
			groupCreated: 'Grup Kelas berhasil dibuat',
			saved: 'Perubahan tersimpan',
		},
	},
};