vipPaging.pageTemplate['signup-photo'] = {
	import: [
		'scripts/FilePicker.js',
	],
	preopening: () => firebaseAuth.authCheck(false),
	opening: () => {
		enableAllTippy();
		if (app.state.cropPhoto == null) app.state.cropPhoto = {};
		if (app.state.cropPhoto.justFinish) {
			photoLoader.set(pg.getEl('photo'), app.state.cropPhoto.small.base64, true);
			delete app.state.cropPhoto.justFinish;
		}
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
		<div class="profilePhoto circleCenter-120" id="photo" onclick="pg.changePhoto()">
			<i class="fas fa-camera"></i>
		</div><div title="${gl('clear')}" class="clearPhotoButton" onclick="FilePicker.clearImage(pg.getEl('photo'))">
			<i class="fas fa-times"></i>
		</div>
		<div class="vSpace-30"></div>
		<button id="btn" class="primary" onclick="pg.done()">${gl('continue')}</button>

	</div></div></div>
</div>
`,
	functions: {
		changePhoto: () => {
			FilePicker.result = async (files) => {
				var image64 = await FilePicker.blobTobase64(files[0]);
				app.state.cropPhoto.input = image64;
				go('cropPhoto');
			},
			FilePicker.pick(false, false);
		},
		done: () => {
			var photo = pg.getEl('photo');
			if (photo.getAttribute('data-hideIcon') !== 'true') app.state.signupPhoto = false;
			else app.state.signupPhoto = app.state.cropPhoto;
			go(`signup-password`, pg.parameter);
		},
	},
	lang: {
		en: {
			title: `Set your profile photo`,
			clear: 'Clear',
			continue: 'Continue',
		},
		id: {
			title: 'Pasang foto profil-mu',
			clear: 'Hapus foto',
			continue: 'Lanjutkan',
		},
	},
};