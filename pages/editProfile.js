vipPaging.pageTemplate['editProfile'] = {
	import: [
		'scripts/reauth.js',
		'scripts/imagePicker.js',
		'scripts/profilePhotoUploader.js',
		'scripts/ProfileResolver.js',
	],
	preopening: () => firebaseAuth.authCheck(true),
	opening: () => {
		enableAllTippy();
		if (app.state.cropPhoto == null) app.state.cropPhoto = {};
		ui.btnLoading.install();

		app.listenForChange(['name', 'email'], () => {
			pg.getEl('btn').disabled = pg.getEl('name').value === '' ||
				pg.getEl('email').value === '';
		});
		
		vipPaging.bodyState('loading');
		ProfileResolver.resolve([firebaseAuth.userId], pg.loadData);

		if (app.state.cropPhoto.justFinish) {
			photoLoader.set(pg.getEl('photo'), app.state.cropPhoto.small, true);
			delete app.state.cropPhoto.justFinish;
		}
		else {
			//just load normal photo
			photoLoader.load(pg.getEl('photo'), `profile_pic/${firebaseAuth.userId}_small.jpg`, `profile_pic/${firebaseAuth.userId}.jpg`);
		}
	},
	innerHTML: () => `
<div class="vipPaging-vLayout">
	<div class="head"><div>
		<div class="actionBar">
			<div class="button" onclick="window.history.go(-1)"><i class="fas fa-arrow-left"></i></div>
			<div class="title">${gl('title')}</div>
		</div>
	</div></div>
	<div class="body"><div><div class="maxWidthWrap-480 aPadding-30">

		<div style="text-align: center">
			<div class="profilePhoto circleCenter-120" id="photo" onclick="pg.changePhoto()">
				<i class="fas fa-camera"></i>
			</div><div title="${gl('clear')}" class="clearPhotoButton" onclick="imagePicker.clear(pg.getEl('photo'))">
				<i class="fas fa-times"></i>
			</div>
		</div>
		<div class="vSpace-30"></div>
		<div class="inputLabel">${gl('name')}</div>
		<input id="name" type="text" placeholder="${gl('namePlaceholder')}" />
		<div class="inputLabel">${gl('schoolName')}</div>
		<input id="school" type="text" placeholder="${gl('schoolNamePlaceholder')}" />
		<div class="inputLabel">${gl('email')}</div>
		<input id="email" type="email" placeholder="${gl('emailPlaceholder')}" />
		<div class="vSpace-30"></div>
		<button id="btn" class="primary" onclick="pg.done()">${gl('done')}</button>

	</div></div></div>
</div>
`,
	functions: {
		changePhoto: async () => {
			var image64 = await imagePicker.pick();
			app.state.cropPhoto.input = image64;
			go('cropPhoto');
		},
		loadData: (u) => {
			if (u[firebaseAuth.userId].isEmpty) return;
			vipPaging.bodyState();

			var currentUser = localJSON.get('userdata');
			pg.getEl('email').value = currentUser.email;
			pg.getEl('email').setAttribute('data-original', currentUser.email);

			pg.getEl('name').value = u[firebaseAuth.userId].name;
			pg.getEl('name').setAttribute('data-original', u[firebaseAuth.userId].name);

			var school = u[firebaseAuth.userId].school;
			if (school == null) school = '';
			pg.getEl('school').value = school;
			pg.getEl('school').setAttribute('data-original', school);
		},
		done: async () => {
			var name = pg.getEl('name');
			var school = pg.getEl('school');
			var email = pg.getEl('email');
			var photo = pg.getEl('photo');

			var changes = 0;
			var nameAndSchool = false;
			if (photo.getAttribute('data-imageChanged') === 'true') changes++;
			if (name.value !== name.getAttribute('data-original')) {
				changes++;
				nameAndSchool = true;
			}
			if (school.value !== school.getAttribute('data-original')) {
				changes++;
				nameAndSchool = true;
			}
			if (email.value !== email.getAttribute('data-original')) {
				changes++;
				try { await reauth.prompt(); } catch { }
			}

			if (changes === 0) {
				ui.float.normal(gl('nothingChanged'));
				window.history.go(-1);
				return;
			}
			
			ui.btnLoading.on(pg.getEl('btn'));
			await firebaseAuth.waitStated();

			try {
				if (photo.getAttribute('data-imageChanged') === 'true') {
					if (photo.getAttribute('data-hideIcon') === 'true') {
						await profilePhotoUploader(firebaseAuth.userId, app.state.cropPhoto.small, app.state.cropPhoto.big);
					}
					else {
						//delete
						await firebase.storage().ref(`profile_pic/${firebaseAuth.userId}_small.jpg`).delete();
						await firebase.storage().ref(`profile_pic/${firebaseAuth.userId}.jpg`).delete();
					}
					//delete fss for full photo
					fss.delete(`profile_pic/${firebaseAuth.userId}.jpg`);
				}
				if (nameAndSchool) {
					var f = await jsonFetch.doWithIdToken(`${app.baseAPIAddress}/user`, {
						method: 'PUT',
						body: JSON.stringify({
							name: name.value,
							school: school.value,
						}),
					});
					if (f.status !== 200) {
						ui.btnLoading.off(pg.getEl('btn'));
						if (f.status === 'connectionError') {
							ui.float.error(gl('connectionError', null, 'app'));
						}
						else {
							ui.float.error(gl('unexpectedError', `${f.status}: ${f.b.code}`, 'app'));
						}
						return;
					}
					ProfileResolver.resolve([firebaseAuth.userId], () => {}); //make cache updated
				}
				if (email.value !== email.getAttribute('data-original')) {
					await firebase.auth().currentUser.updateEmail(email.value);
					localJSON.put('userdata', 'email', email.value);
				}
			}
			catch (error) {
				ui.btnLoading.off(pg.getEl('btn'));
				if (error.code === 'auth/invalid-email') {
					ui.popUp.alert(gl('invalidEmailAddress'), () => {
						email.focus();
					});
				}
				else firebaseCommonError(error);
				return;
			}

			await firebase.auth().currentUser.getIdToken(true);

			ui.float.success(gl('saved'));
			window.history.go(-1);
		},
	},
	lang: {
		en: {
			title: 'Edit Profile',
			clear: 'Clear',
			name: 'Name:',
			namePlaceholder: 'Your name...',
			schoolName: 'School name:',
			schoolNamePlaceholder: 'example: SMAN 5 Bekasi',
			email: 'Email:',
			emailPlaceholder: 'example@email.com',
			done: 'Save',
			nothingChanged: 'Nothing changed',
			saved: 'Changes are saved',
			invalidEmailAddress: 'Invalid email address',
		},
		id: {
			title: 'Ubah Profil',
			clear: 'Hapus foto',
			name: 'Nama:',
			namePlaceholder: 'Nama mu...',
			schoolName: 'Sekolah:',
			schoolNamePlaceholder: 'contoh: SMAN 5 Bekasi',
			email: 'Email:',
			emailPlaceholder: 'contoh@email.com',
			done: 'Simpan',
			nothingChanged: 'Tidak ada perubahan',
			saved: 'Perubahan tersimpan',
			invalidEmailAddress: 'Alamat email tidak valid',
		},
	},
};