vipPaging.pageTemplate['index'] = {
	preopening: () => firebaseAuth.authCheck(false),
	opening: () => {
		ui.btnLoading.install();

		app.listenForChange(['email'], () => {
			pg.getEl('btn').disabled = pg.getEl('email').value === '';
		});
		app.listenForEnterKey(['email'], () => {
			if (pg.getEl('btn').disabled) return;
			pg.done();
		});

		pg.getEl('email').focus();
		pg.noticeSent = false;
	},
	innerHTML: () => `
<div class="vipPaging-vLayout">
	<div class="head"><div>
		<div class="actionBar">
			${app.dynamicBackButton(true)}
			<div class="title"></div>
		</div>
	</div></div>
	<div class="body body-center"><div><div class="maxWidthWrap-480 aPadding-30" style="text-align: center">

		<h1>Grup Kelas</h1>
		<h6>v${appVersion}${location.pathname === '/sdcard/gk2019/index.html' ? ' devSD' : ''}</h6>
		<div class="vSpace-20"></div>
		<div class="inputLabel">${gl('email')}</div>
		<input id="email" maxlength="254" type="email" placeholder="${gl('emailPlaceholder')}" />
		<div class="vSpace-30"></div>
		<button id="btn" class="primary" onclick="pg.done()">${gl('continue')}</button>

	</div></div></div>
</div>
`,
	functions: {
		done: () => {
			if (pg.noticeSent) pg.realDone();
			else {
				ui.popUp.confirm(gl('tospp'), c => {
					if (!c) return;
					pg.realDone();
				});
			}
		},
		realDone: async function () {
			pg.noticeSent = true;
			ui.btnLoading.on(pg.getEl('btn'));
			var email = pg.getEl('email');

			await firebaseAuth.waitStated();

			//check if user exist by checking signin method
			firebase.auth().fetchSignInMethodsForEmail(email.value)
				.then(result => {
					if (result.length === 0) {
						//user is not registered
						go(`signup-name`, email.value);
					}
					else go('signin', email.value); //user is registered
				})
				.catch(error => {
					ui.btnLoading.off(pg.getEl('btn'));
					if (error.code === 'auth/invalid-email') {
						ui.popUp.alert(gl('invalidEmailAddress'), () => {
							email.focus();
						});
					}
					else firebaseCommonError(error);
				});
		},
	},
	lang: {
		en: {
			email: 'Email:',
			emailPlaceholder: 'example@email.com',
			continue: 'Continue',
			invalidEmailAddress: 'Invalid email address',
			tospp: `To use this app, you must understand and agree with our <a class="underline" onclick="window.open('${app.baseAPPAddress}/doc/terms_of_use', '_blank')">Terms of Use</a> and <a class="underline" onclick="window.open('${app.baseAPPAddress}/doc/privacy_policy', '_blank')">Privacy Policy</a>`,
		},
		id: {
			email: 'Email:',
			emailPlaceholder: 'contoh@email.com',
			continue: 'Lanjutkan',
			invalidEmailAddress: 'Alamat email tidak valid',
			tospp: `Untuk menggunakan aplikasi ini, anda harus memahami dan setuju dengan <a class="underline" onclick="window.open('${app.baseAPPAddress}/doc/terms_of_use', '_blank')">Ketentuan Penggunaan</a> dan <a class="underline" onclick="window.open('${app.baseAPPAddress}/doc/privacy_policy', '_blank')">Kebijakan Privasi</a> kami`,
		},
	},
};