vipPaging.pageTemplate['home'] = {
	import: [
		//
	],
	preopening: () => firebaseAuth.authCheck(true),
	opening: () => {
		//
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
	<div class="body"><div><div class="maxWidthWrap-480 aPadding-20" style="text-align:center">
		--
	</div></div></div>
	<div class="foot"><div>
		<div class="actionBar aPadding-10">
			<div class="vipPaging-subNavigator" onclick="vipPaging.subPage.change(this)" data-active="true">
				<i class="fas fa-home"></i>
				<h3>${gl('home')}</h3>
			</div>
			<div class="vipPaging-subNavigator" id="announcementTabBtn" onclick="vipPaging.subPage.change(this)">
				<i class="fas fa-bullhorn"></i>
				<h3>${gl('announcement')}</h3>
			</div>
			<div class="vipPaging-subNavigator" id="scheduleTabBtn" onclick="vipPaging.subPage.change(this)">
				<i class="fas fa-clock"></i>
				<h3>${gl('schedule')}</h3>
			</div>
			<div class="vipPaging-subNavigator" id="assignmentTabBtn" onclick="vipPaging.subPage.change(this)">
				<i class="fas fa-tasks"></i>
				<h3>${gl('assignment')}</h3>
			</div>
			<div class="vipPaging-subNavigator" id="examTabBtn" onclick="vipPaging.subPage.change(this)">
				<i class="fas fa-flag-checkered"></i>
				<h3>${gl('exam')}</h3>
			</div>
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