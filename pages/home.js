vipPaging.pageTemplate['home'] = {
	import: [
		//
	],
	preopening: () => firebaseAuth.authCheck(true),
	opening: () => {
		enableAllTippy();
	},
	innerHTML: () => `
<div class="vipPaging-vLayout">
	<div class="head"><div>
		<div class="actionBar aPadding-10">
			<div class="button" onclick="go('settings')" title="Grup-grup"><i class="fas fa-users"></i></div>
			<div class="title center">Beranda</div>
			<div class="profilePhoto" id="embeddedHomePhoto" onclick="embeddedHome.profilePopUp()" title="Profil"><i class="fas fa-user"></i></div>
		</div>
	</div></div>
	<div class="body"><div><div class="maxWidthWrap-640 aPadding-20">
		
		<div class="aPadding-10 activable" style="text-align:center" id="freshStart">
			<h2>Selamat datang...</h2>
			<div class="vSpace-30"></div>
			<img src="illustrations/undraw_welcome_3gvl.svg" width="200px" />
			<div class="vSpace-30"></div>
			<button class="primary" onclick="go('groupForm')">Buat Grup Kelas baru</button>
			<div class="vSpace-30"></div>
			<h3>atau minta link bergabung dari grup yang sudah ada</h3>
		</div>

		<div class="aPadding-10 activable" style="text-align:center" id="empty">
			<h2>Mulai isi data</h2>
			<div class="vSpace-30"></div>
			<img src="illustrations/undraw_product_teardown_elol.svg" width="200px" />
			<div class="vSpace-30"></div>
			<button onclick="">Atur Jadwal</button>
			<div class="vSpace-20"></div>
			<button onclick="">Tambah Tugas</button>
			<div class="vSpace-20"></div>
			<button onclick="">Tambah Ujian</button>
		</div>

	</div></div></div>
	<div class="foot"><div>
		<div class="tabBar five">
			<div onclick="" data-active="true" title="Beranda"><i class="fas fa-home"></i></div>
			<div onclick="" title="Notifikasi"><i class="fas fa-bell"></i></div>
			<div class="theme-primary" onclick=""><i class="fas fa-plus"></i></div>
			<div onclick="" title="Jadwal"><i class="fas fa-clock"></i></div>
			<div onclick="" title="Tugas dan ujian"><i class="fas fa-tasks"></i></div>
		</div>
	</div></div>
</div>
`,
	functions: {
		//
	},
	lang: {
		en: {
			//
		},
		id: {
			//
		},
	},
};