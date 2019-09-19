vipPaging.pageTemplate['settings'] = {
	import: [
		'scripts/langTheme.js',
	],
	preopening: () => firebaseAuth.authCheck(true),
	opening: () => {
		//
	},
	innerHTML: () => `
<div class="vipPaging-vLayout">
	<div class="head"><div>
		<div class="actionBar">
			<div class="button" onclick="window.history.go(-1)"><i class="fas fa-arrow-left"></i></div>
			<div class="title">${gl('title')}</div>
		</div>
	</div></div>
	<div class="body"><div><div class="maxWidthWrap-480">

		<div class="container">
			<div class="list feedback" onclick="go('editProfile')">
				<div class="icon"><i class="fas fa-user-cog"></i></div>
				<div class="content"><h4>${gl('editProfile')}</h4></div>
			</div>
			<div class="list feedback" onclick="go('changePassword')">
				<div class="icon"><i class="fas fa-key"></i></div>
				<div class="content"><h4>${gl('changePassword')}</h4></div>
			</div>
			<div class="list feedback" onclick="go('deleteAccount')">
				<div class="icon"><i class="fas fa-user-slash"></i></div>
				<div class="content"><h4>${gl('deleteAccount')}</h4></div>
			</div>
			<div class="list feedback" onclick="pg.signOut()">
				<div class="icon"><i class="fas fa-sign-out-alt"></i></div>
				<div class="content"><h4>${gl('signOut')}</h4></div>
			</div>
		</div>

		<div class="container">
			<div class="list feedback" onclick="langTheme.lang()">
				<div class="icon"><i class="fas fa-language"></i></div>
				<div class="content"><h4>${gl('language')}</h4></div>
			</div>
			<div class="list feedback" onclick="langTheme.theme()">
				<div class="icon"><i class="fas fa-palette"></i></div>
				<div class="content"><h4>${gl('theme')}</h4></div>
			</div>
		</div>
		
		<div class="container">
			<div class="list feedback" onclick="window.open('${app.baseAPPAddress}/doc/terms_of_use', '_blank')">
				<div class="icon"><i class="fas fa-handshake"></i></div>
				<div class="content"><h4>${gl('tos')}</h4></div>
			</div>
			<div class="list feedback" onclick="window.open('${app.baseAPPAddress}/doc/privacy_policy', '_blank')">
				<div class="icon"><i class="fas fa-user-shield"></i></div>
				<div class="content"><h4>${gl('pp')}</h4></div>
			</div>
			<div class="list feedback" onclick="go('appStatus')">
				<div class="icon"><i class="fas fa-chart-bar"></i></div>
				<div class="content"><h4>${gl('appStatus')}</h4></div>
			</div>
		</div>

	</div></div></div>
</div>
`,
	functions: {
		signOut: () => {
			ui.popUp.confirm(gl('signOutConfirm'), a => {
				if (a) firebase.auth().signOut();
			});
		},
	},
	lang: {
		en: {
			title: 'Settings',
			editProfile: 'Edit profile',
			changePassword: 'Change password',
			deleteAccount: 'Delete account',
			signOut: 'Sign out',
			language: 'Language',
			theme: 'Theme',
			tos: 'Terms of use',
			pp: 'Privacy policy',
			feedback: 'Give feedback',
			appStatus: 'About this app',
			signOutConfirm: 'Sign out from this device?',
		},
		id: {
			title: 'Pengaturan',
			editProfile: 'Ubah profil',
			changePassword: 'Ganti password',
			deleteAccount: 'Hapus akun',
			signOut: 'Keluar',
			language: 'Bahasa (Language)',
			theme: 'Tema warna',
			tos: 'Ketentuan Penggunaan',
			pp: 'Kebijakan Privasi',
			feedback: 'Berikan tanggapan',
			appStatus: 'Informasi aplikasi',
			signOutConfirm: 'Keluar dari perangkat ini?',
		},
	},
};