vipPaging.pageTemplate['deleteAccount'] = {
	import: [
		'scripts/reauth.js',
	],
	preopening: () => firebaseAuth.authCheck(true),
	opening: () => {
		ui.btnLoading.install();
	},
	innerHTML: (d) => `
<div class="vipPaging-vLayout">
	<div class="head"><div>
		<div class="actionBar">
			<div class="button" onclick="window.history.go(-1)"><i class="fas fa-arrow-left"></i></div>
			<div class="title">${gl('title')}</div>
		</div>
	</div></div>
	<div class="body body-center"><div><div class="maxWidthWrap-480 aPadding-30" style="text-align:center">

			<h1>${gl('text1')}</h1>
			<div class="vSpace-10"></div>
			<p>${gl('text2')}</p>

			<div class="vSpace-30"></div>

			<button id="btn" class="negative" onclick="pg.delete()">${gl('yes')}</button>

			<div class="vSpace-20"></div>

			<button onclick="window.history.go(-1)">${gl('cancel')}</button>

	</div></div></div>
</div>
`,
	functions: {
		delete: () => {
			reauth.prompt().then(idToken => {
				ui.btnLoading.on(pg.getEl('btn'));
				jsonFetch.doWithIdToken(`${app.baseAPIAddress}/user`, {
					method: 'DELETE',
				}, true).then(f => {
					if (f.status === 200) {
						firebase.auth().signOut();
					}
					else {
						ui.btnLoading.off(pg.getEl('btn'));
						if (f.status === 'connectionError') {
							ui.float.error(gl('connectionError', null, 'app'));
						}
						else {
							ui.float.error(gl('pleaseTryAgain'));
						}
					}
				});
			});
		},
	},
	lang: {
		en: {
			title: 'Delete Account',
			text1: 'Are you sure?',
			text2: 'We cannot restore any data that deleted after this process!',
			yes: 'Yes, delete my account',
			cancel: 'Cancel',
			pleaseTryAgain: 'Please try again',
		},
		id: {
			title: 'Hapus Akun',
			text1: 'Yakin ingin mehapus akun?',
			text2: 'Kami tidak dapat mengembalikan data apapun yang terhapus setelah proses ini!',
			yes: 'Ya, hapus akun ini',
			cancel: 'Batal',
			pleaseTryAgain: 'Silahkan coba lagi',
		},
	},
};