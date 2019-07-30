vipPaging.pageTemplate['signup-name'] = {
	preopening: () => firebaseAuth.authCheck(false),
	opening: () => {
		app.listenForChange(['name'], () => {
			pg.getEl('btn').disabled = pg.getEl('name').value === '';
		});
		app.listenForEnterKey(['name'], () => {
			if (pg.getEl('btn').disabled) return;
			pg.done();
		});

		pg.getEl('name').focus();
	},
	innerHTML: () => `
<div class="vipPaging-vLayout">
	<div class="head"><div>
		<div class="actionBar">
			<div class="button" onclick="window.history.go(-1)"><i class="fas fa-arrow-left"></i></div>
			<div class="title"></div>
		</div>
	</div></div>
	<div class="body body-center"><div><div class="maxWidthWrap-480 aPadding-30" style="text-align: center">

		<h2>${gl('title')}</h2>
		<div class="vSpace-20"></div>
		<div class="inputLabel">${gl('name')}</div>
		<input id="name" maxlength="50" type="text" placeholder="${gl('namePlaceholder')}" />
		<div class="inputLabel">${gl('school')}</div>
		<input id="school" maxlength="50" type="text" placeholder="${gl('schoolPlaceholder')}" />
		<div class="vSpace-20"></div>
		<button id="btn" class="primary" onclick="pg.done()">${gl('continue')}</button>

	</div></div></div>
</div>
`,
	functions: {
		done: () => {
			var name = pg.getEl('name');
			go(`signup-photo`, [pg.parameter, name.value, school.value]);
		},
	},
	lang: {
		en: {
			title: `Let's create your account`,
			name: 'Name:',
			namePlaceholder: 'Your name...',
			school: 'School name:',
			schoolPlaceholder: 'ex: SMAN 5 Bekasi',
			continue: 'Continue',
		},
		id: {
			title: 'Mari kita buat akun-mu',
			name: 'Nama:',
			namePlaceholder: 'Nama mu...',
			school: 'Sekolah:',
			schoolPlaceholder: 'Misal: SMAN 5 Bekasi',
			continue: 'Lanjutkan',
		},
	},
};