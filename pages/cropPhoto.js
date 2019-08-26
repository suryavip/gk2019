vipPaging.pageTemplate['cropPhoto'] = {
	import: [
		'lib/croppie-2.6.4/croppie.min.js',
		'lib/croppie-2.6.4/croppie.css',
		'lib/compressorjs-1.0.5/compressorjs.min.js',
		'scripts/compressorjsWrapper.js',
	],
	opening: () => {
		if (app.state.cropPhoto == null) app.state.cropPhoto = {};
		ui.btnLoading.install();
		var inPhoto = app.state.cropPhoto.input;
		if (inPhoto == null) {
			window.history.go(-1);
			return;
		}
		var el = document.querySelector('#cropPhotoPhoto');
		var vanilla = new Croppie(el, {
			viewport: { width: 230, height: 230, type: 'circle' },
			boundary: { width: 240, height: 240 },
			enableOrientation: true
		});
		vanilla.bind({ url: `${inPhoto}` });
		document.querySelector('#cropPhotoDone').addEventListener('click', async () => {
			ui.btnLoading.on(document.querySelector('#cropPhotoDone'));
			var blob = await vanilla.result({
				type: 'blob',
				size: { width: 600 },
				circle: false,
			});
			var compressedBig = await compressorjsWrapper(blob, 600, 600, 0.8);
			app.state.cropPhoto.big = compressedBig;
			var compressedSmall = await compressorjsWrapper(blob, 200, 200, 0.6);
			app.state.cropPhoto.small = compressedSmall;
			app.state.cropPhoto.justFinish = true;
			window.history.go(-1);
		});
		document.querySelector('#cropPhotoRotateLeft').addEventListener('click', () => { vanilla.rotate(-90); });
		document.querySelector('#cropPhotoRotateRight').addEventListener('click', () => { vanilla.rotate(90); });
	},
	innerHTML: (d) => `
<div class="vipPaging-vLayout">
	<div class="head"><div>
		<div class="actionBar">
			<div class="button" onclick="window.history.go(-1)"><i class="fas fa-arrow-left"></i></div>
			<div class="title">${gl('title')}</div>
		</div>
	</div></div>
	<div class="body body-center"><div><div class="maxWidthWrap-640 aPadding-30" style="text-align:center">

		<div id="cropPhotoPhoto"></div>
		<div class="table dual-10 vSpace-10">
			<div><button id="cropPhotoRotateLeft"><i class="fas fa-redo fa-flip-horizontal"></i></button></div>
			<div><button id="cropPhotoRotateRight"><i class="fas fa-redo"></i></button></div>
		</div>
		<div class="vSpace-20"></div>
		<button id="cropPhotoDone" class="primary">${gl('done')}</button>

	</div></div></div>
</div>
`,
	functions: {
		
	},
	lang: {
		en: {
			title: 'Crop Photo',
			done: 'Done',
		},
		id: {
			title: 'Crop Foto',
			done: 'Selesai',
		},
	},
};