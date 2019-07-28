vipPaging.pageTemplate['signup-photo'] = {
	import: [
		'scripts/imagePicker.js',
	],
	preopening: () => firebaseAuth.authCheck(false),
	opening: () => {
		enableAllTippy();
		if (app.state.cropPhoto == null) app.state.cropPhoto = {};
		if (app.state.cropPhoto.justFinish) {
			photoLoader.set(pg.getEl('photo'), app.state.cropPhoto.small, true);
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
		</div><div title="${gl('clear')}" class="clearPhotoButton" onclick="imagePicker.clear(pg.getEl('photo'))">
			<i class="fas fa-times"></i>
		</div>
		<div class="vSpace-30"></div>
		<button id="btn" class="primary" onclick="pg.done()">${gl('continue')}</button>

	</div></div></div>
</div>
`,
	functions: {
		changePhoto: async () => {
			var image64 = await imagePicker.pick();
			app.state.cropPhoto.input = image64;
			go('cropPhoto');
		},
		done: () => {
			var photo = pg.getEl('photo');
			if (photo.getAttribute('data-hideIcon') === 'true') {
				localJSON.put('signupPhoto', 'small', app.state.cropPhoto.small);
				localJSON.put('signupPhoto', 'big', app.state.cropPhoto.big);
			}
			else localJSON.drop('signupPhoto');
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