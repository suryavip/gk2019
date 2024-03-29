vipPaging.pageTemplate['appStatus'] = {
	preopening: () => firebaseAuth.authCheck(true),
	opening: () => {
		dat.attachListener(pg.load, ['schedule', 'assignment', 'exam', 'opinion']);
	},
	innerHTML: () => `
<div class="vipPaging-vLayout">
	<div class="head"><div>
		<div class="actionBar">
			<div class="button" onclick="window.history.go(-1)"><i class="fas fa-arrow-left"></i></div>
			<div class="title">${gl('title')}</div>
		</div>
	</div></div>
	<div class="body"><div><div class="maxWidthWrap-640">

		<div class="container-20" style="text-align:center">
			<img src="icon/xxxhdpi.png" width="96" style="border-radius: 20px;">
			<div class="vSpace-10"></div>
			<h1>Grup Kelas</h1>
			<div class="vSpace-10"></div>
			<h3>${gl('version')} ${appVersion}${location.pathname === '/sdcard/gk2019/index.html' ? ' devSD' : ''}</h3>
			<div class="vSpace-20"></div>
			<p><a href="mailto:contact@boostedcode.com" target="_blank">contact@boostedcode.com</a></p>
			<p>${gl('by')}</p>
			<p>${gl('madeIn')}</p>
		</div>

		<div class="container-20">
			<p style="text-align:center">${gl('pendingCount')}: <a id="pendingCount">0</a></p>
			<div class="vSpace-20"></div>
			<button onclick="pg.resetSync()">${gl('resetSync')}</button>
			<div class="vSpace-20 activable" data-active="${isCordova}"></div>
			<button class="activable" data-active="${isCordova}" onclick="pg.testPushNotif()">${gl('testPushNotif')}</button>
		</div>

	</div></div></div>
</div>

`,
	functions: {
		load: async () => {
			var count = await dat.db.assignment.where('source').anyOf(['local-new', 'local']).count();
			count += await dat.db.exam.where('source').anyOf(['local-new', 'local']).count();
			count += await dat.db.schedule.where('source').anyOf(['local']).count();
			count += await dat.db.opinion.where('source').anyOf(['local']).count();

			pg.getEl('pendingCount').textContent = count;
		},
		resetSync: () => {
			ui.popUp.confirm(gl('resetSyncConfirm'), async a => {
				if (!a) return;
				await dat.db.delete();
				app.reload();
			});
		},
		testPushNotif: async () => {
			//test push notif
			vipLoading.add('testPushNotif');
			var f = await jsonFetch.doWithIdToken(`${app.baseAPIAddress}/fcmToken`);
			vipLoading.remove('testPushNotif');
			if (f.status !== 200) {
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
			title: 'About This App',
			resetSync: 'Clear data &amp; re-sync',
			testPushNotif: 'Test push notification',
			version: 'Version:',
			by: 'by Boosted Code',
			madeIn: 'Bekasi, Indonesia',
			resetSyncConfirm: 'Warning! All unsynced data will be lost. Clear data and re-sync?',
			pendingCount: 'Unsynced data',
		},
		id: {
			title: 'Informasi Aplikasi',
			resetSync: 'Bersihkan data &amp; sinkron ulang',
			testPushNotif: 'Tes push notification',
			version: 'Versi:',
			by: 'oleh Boosted Code',
			madeIn: 'Bekasi, Indonesia',
			resetSyncConfirm: 'Peringatan! Semua data yang belum tersinkronisasi akan hilang. Jadi bersihkan data dan sinkron ulang?',
			pendingCount: 'Data yang belum tersinkron',
		},
	},
};