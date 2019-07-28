vipPaging.pageTemplate['changePassword'] = {
	import: [
		'scripts/reauth.js',
	],
	preopening: () => firebaseAuth.authCheck(true),
	opening: () => {
		ui.btnLoading.install();
		
		app.listenForChange(['old', 'new', 're'], () => {
			pg.getEl('btn').disabled = pg.getEl('old').value === '' || pg.getEl('new').value === '' || pg.getEl('re').value === '';
		});
	},
	innerHTML: (d) => `
<div class="vipPaging-vLayout">
	<div class="head"><div>
		<div class="actionBar">
			<div class="button" onclick="window.history.go(-1)"><i class="fas fa-arrow-left"></i></div>
			<div class="title">${gl('title')}</div>
		</div>
	</div></div>
	<div class="body"><div><div class="maxWidthWrap-480 aPadding-30">

		<div class="inputLabel">${gl('oldPassword')}</div>
		<div class="inputWithButton">
			<div><input id="old" maxlength="32" type="password" placeholder="${gl('oldPasswordPlaceholder')}" /></div>
			<div onclick="app.passwordShowHideToggle(this)"><i class="fas fa-eye"></i></div>
		</div>

		<div class="inputLabel">${gl('newPassword')}</div>
		<div class="inputWithButton">
			<div><input id="new" maxlength="32" type="password" placeholder="${gl('newPasswordPlaceholder')}" /></div>
			<div onclick="app.passwordShowHideToggle(this)"><i class="fas fa-eye"></i></div>
		</div>

		<div class="inputLabel">${gl('confirmPassword')}</div>
		<div class="inputWithButton">
			<div><input id="re" maxlength="32" type="password" placeholder="${gl('confirmPasswordPlaceholder')}" /></div>
			<div onclick="app.passwordShowHideToggle(this)"><i class="fas fa-eye"></i></div>
		</div>

		<div class="vSpace-30"></div>

		<button id="btn" class="primary" onclick="pg.done()">${gl('done')}</button>

	</div></div></div>
</div>
`,
	functions: {
		done: async () => {
			var password = pg.getEl('old');
			var newpass = pg.getEl('new');
			var re = pg.getEl('re');
			if (newpass.value !== re.value) {
				ui.popUp.alert(gl('inconsistentPassword'), () => {
					newpass.value = '';
					re.value = '';
					newpass.focus();
				});
				return;
			}

			ui.btnLoading.on(pg.getEl('btn'));
			await firebaseAuth.waitStated();
			var newpassValue = `${newpass.value}`;

			reauth.core(password.value)
				.then(() => {
					firebase.auth().currentUser.updatePassword(newpassValue)
						.then(() => {
							ui.float.success(gl('saved'));
							window.history.go(-1);
						})
						.catch(error => {
							ui.btnLoading.off(pg.getEl('btn'));
							if (error.code === 'auth/weak-password') {
								ui.popUp.alert(gl('weakPassword'), () => {
									newpass.value = '';
									re.value = '';
									newpass.focus();
								});
							}
							else firebaseCommonError(error);
						});
				})
				.catch(error => {
					ui.btnLoading.off(pg.getEl('btn'));
					if (error === 'wrongPassword') {
						password.value = '';
						password.focus();
					}
				});
		},
	},
	lang: {
		en: {
			title: 'Change Password',
			oldPassword: 'Old password:',
			oldPasswordPlaceholder: 'Old password...',
			newPassword: 'New password:',
			newPasswordPlaceholder: '6 to 32 characters',
			confirmPassword: 'Confirm new password:',
			confirmPasswordPlaceholder: 'Type again to confirm',
			done: 'Save',
			inconsistentPassword: 'Inconsistent password',
			saved: 'Changes are saved',
			weakPassword: ' New password is too weak',
		},
		id: {
			title: 'Ganti Password',
			oldPassword: 'Password lama:',
			oldPasswordPlaceholder: 'Password lama...',
			newPassword: 'Password baru:',
			newPasswordPlaceholder: '6 sampai 32 karakter',
			confirmPassword: 'Konfirmasi password baru:',
			confirmPasswordPlaceholder: 'Ketik lagi untuk konfirmasi',
			done: 'Simpan',
			inconsistentPassword: 'Password tidak konsisten',
			saved: 'Perubahan tersimpan',
			weakPassword: ' Password baru terlalu lemah',
		},
	},
};