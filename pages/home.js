vipPaging.pageTemplate['home'] = {
	import: [
		'scripts/GroundLevel.js'
	],
	preopening: () => firebaseAuth.authCheck(true),
	opening: () => {
		GroundLevel.init();
	},
	innerHTML: d => `
<div class="vipPaging-vLayout">
	<div class="head"><div>
		${GroundLevel.head(d.pageId)}
	</div></div>
	<div class="body"><div><div class="maxWidthWrap-640">
		
		<div class="aPadding-30 activable" style="text-align:center" id="freshStart">
			<h2>Selamat datang...</h2>
			<div class="vSpace-30"></div>
			<img src="illustrations/undraw_welcome_3gvl.svg" width="200px" />
			<div class="vSpace-30"></div>
			<button class="primary" onclick="go('groupForm')">Buat Grup Kelas baru</button>
			<div class="vSpace-30"></div>
			<h3>atau minta link bergabung dari grup yang sudah ada</h3>
		</div>

		<div class="aPadding-30 activable" style="text-align:center" id="empty">
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

		<div class="container-20 activable" id="quickSchedule">
			<div class="table">
				<div style="width:100%"><h3>Jadwal besok:</h3></div>
				<div>
					<div class="circleButton" onclick=""><i class="fas fa-ellipsis-h"></i></div>
				</div>
			</div>
			<div class="vSpace-10"></div>
			<div class="card aPadding-20 feedback" onclick="pg.highlight(2, 'a${pg.groupId}schedule${moment().add(1, 'days').format('d')}')">
				<div class="table">
					<div id="quickScheduleSubjects"></div>
					<div style="width: 80px; text-align: right" id="quickScheduleHours"></div>
				</div>
			</div>
		</div>

		<div class="container-20 activable" id="quickAssignment">
			<div class="table">
				<div style="width:100%"><h3>Tugas besok:</h3></div>
				<div>
					<div class="circleButton" onclick=""><i class="fas fa-ellipsis-h"></i></div>
				</div>
			</div>
			<div class="vSpace-10"></div>
			<div id="quickAssignmentContent"></div>
		</div>

		<div class="container-20 activable" id="quickExam">
			<div class="table">
				<div style="width:100%"><h3>Ujian besok:</h3></div>
				<div>
					<div class="circleButton" onclick=""><i class="fas fa-ellipsis-h"></i></div>
				</div>
			</div>
			<div class="vSpace-10"></div>
			<div id="quickExamContent"></div>
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