vipPaging.pageTemplate['signup-password'] = {
	import: [
		'scripts/profilePhotoUploader.js',
	],
	preopening: () => firebaseAuth.authCheck(false),
	opening: () => {
		ui.btnLoading.install();

		app.listenForChange(['password', 'repassword'], () => {
			pg.getEl('btn').disabled = pg.getEl('password').value === '' ||
				pg.getEl('repassword').value === '';
		});
		app.listenForEnterKey(['password', 'repassword'], () => {
			if (pg.getEl('btn').disabled) return;
			pg.done();
		});

		pg.getEl('password').focus();
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
		<div class="inputLabel">${gl('password')}</div>
		<div class="inputWithButton">
			<div><input id="password" maxlength="32" type="password" placeholder="${gl('passwordPlaceholder')}" /></div>
			<div onclick="app.passwordShowHideToggle(this)"><i class="fas fa-eye"></i></div>
		</div>

		<div class="inputLabel">${gl('repassword')}</div>
		<div class="inputWithButton">
			<div><input id="repassword" maxlength="32" type="password" placeholder="${gl('repasswordPlaceholder')}" /></div>
			<div onclick="app.passwordShowHideToggle(this)"><i class="fas fa-eye"></i></div>
		</div>
		<div class="vSpace-30"></div>
		<button id="btn" class="primary" onclick="pg.done()">${gl('done')}</button>

	</div></div></div>
</div>
`,
	functions: {
		done: async () => {
			var photo = localJSON.get('signupPhoto');
			var name = pg.parameter[1];
			var password = pg.getEl('password');
			var repassword = pg.getEl('repassword');
			if (password.value !== repassword.value) {
				ui.popUp.alert(gl('inconsistentPassword'), () => {
					password.value = '';
					repassword.value = '';
					password.focus();
				});
				return;
			}
			if (password.value.length < 6) {
				ui.popUp.alert(gl('weakPassword'), () => {
					password.focus();
				});
				return;
			}
			var email = pg.parameter[0];

			ui.btnLoading.on(pg.getEl('btn'));

			await firebaseAuth.waitStated();

			var f = await jsonFetch.do(`${app.baseAPIAddress}/user`, {
				method: 'POST',
				body: JSON.stringify({
					name: name,
					password: password.value,
					email: email,
				}),
			});
			if (f.status === 201) {
				//save user data handled by signin
				//sign in
				try {
					var userCredential = await firebase.auth().signInWithEmailAndPassword(email, password.value);
				}
				catch (error) {
					ui.btnLoading.off(pg.getEl('btn'));
					firebaseCommonError(error);
					return;
				}
				try {
					if (typeof photo.small === 'string' && typeof photo.big === 'string') {
						await profilePhotoUploader(userCredential.user.uid, photo.small, photo.big);
					}
					firebase.database().ref(`user/${userCredential.user.uid}/lastChange`).set(firebase.database.ServerValue.TIMESTAMP);
					userCredential.user.sendEmailVerification();
				}
				catch { }
			}
			else {
				ui.btnLoading.off(pg.getEl('btn'));
				if (f.status === 'connectionError') {
					ui.float.error(gl('connectionError', null, 'app'));
				}
				else {
					ui.float.error(gl('unexpectedError', `${f.status}: ${f.b.code}`, 'app'));
				}
			}
		},
	},
	lang: {
		en: {
			title: 'Create your password',
			password: 'Password:',
			passwordPlaceholder: '6 to 32 characters',
			repassword: 'Confirm your password:',
			repasswordPlaceholder: 'To make sure',
			done: 'Finish',
			inconsistentPassword: 'Inconsistent password',
			weakPassword: 'Password is too weak',
		},
		id: {
			title: 'Buat password-mu',
			password: 'Password:',
			passwordPlaceholder: '6 sampai 32 karakter',
			repassword: 'Ulangi password:',
			repasswordPlaceholder: 'Untuk memastikan',
			done: 'Selesai',
			inconsistentPassword: 'Password tidak konsisten',
			weakPassword: 'Password terlalu mudah',
		},
	},
};