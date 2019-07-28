vipPaging.pageTemplate['signin'] = {
	preopening: () => firebaseAuth.authCheck(false),
	opening: () => {
		ui.btnLoading.install();

		app.listenForChange(['password'], () => {
			pg.getEl('btn').disabled = pg.getEl('password').value === '';
		});
		app.listenForEnterKey(['password'], () => {
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

		<div class="vSpace-20"></div>
		<button id="btn" class="primary" onclick="pg.done()">${gl('done')}</button>
		<div class="vSpace-20"></div>
		<button id="forgotBtn" onclick="pg.forgot()">${gl('forgotPassword')}</button>

	</div></div></div>
</div>
`,
	functions: {
		done: async () => {
			var password = pg.getEl('password');
			var email = pg.parameter;
			ui.btnLoading.on(pg.getEl('btn'));

			await firebaseAuth.waitStated();

			firebase.auth().signInWithEmailAndPassword(email, password.value)
				//firebase state will pull in
				.catch(error => {
					ui.btnLoading.off(pg.getEl('btn'));
					if (error.code === 'auth/wrong-password') {
						ui.popUp.alert(gl('wrongPassword'), () => {
							password.focus();
						});
					}
					else firebaseCommonError(error);
				});
		},
		forgot: async () => {
			var email = pg.parameter;
			ui.btnLoading.on(pg.getEl('forgotBtn'));

			await firebaseAuth.waitStated();
			
			firebase.auth().sendPasswordResetEmail(email)
				.then(() => {
					ui.btnLoading.off(pg.getEl('forgotBtn'));
					ui.popUp.alert(gl('sent'));
				})
				.catch(error => {
					ui.btnLoading.off(pg.getEl('forgotBtn'));
					firebaseCommonError(error);
				});
		},
	},
	lang: {
		en: {
			title: 'Welcome back',
			password: 'Password:',
			passwordPlaceholder: 'Your password...',
			done: 'Get in',
			forgotPassword: 'Forgot password',
			wrongPassword: 'Wrong password',
			sent: 'Check your email and follow the instructions',
		},
		id: {
			title: 'Selamat datang kembali',
			password: 'Password:',
			passwordPlaceholder: 'Password kamu...',
			done: 'Masuk',
			forgotPassword: 'Lupa password',
			rongPassword: 'Password salah',
			sent: 'Buka email dari kami dan ikuti petunjuk di dalamnya',
		},
	},
};