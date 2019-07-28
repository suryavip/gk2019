var imagePicker = {
	pick: (numOfFiles, outputType) => new Promise((resolve, reject) => {
		if (typeof numOfFiles !== 'number') numOfFiles = 1;
		var doPick = async (source) => {
			vipLoading.add('imagePicker-loading');
			await vipPaging.importResourcesPromise([
				isCordova ? 'scripts/openPicPicker/cordova.js' : `scripts/openPicPicker/non-cordova.js?${appVersion}`,
			]);
			vipLoading.remove('imagePicker-loading');
			if (isCordova) vipLoading.add('imagePicker');
			openPicPicker(source, outputType, numOfFiles).then(output => {
				vipLoading.remove('imagePicker');
				if (numOfFiles === 1) resolve(output[0]);
				else resolve(output);
			}).catch(() => {
				vipLoading.remove('imagePicker');
			});
		};
		if (isCordova) {
			//show option to 
			var options = [];
			options.push({
				title: gl('useCamera', null, 'imagePicker'),
				icon: 'fas fa-camera',
				callBackParam: 'camera',
			});
			options.push({
				title: gl('chooseFromGallery', null, 'imagePicker'),
				icon: 'fas fa-images',
				callBackParam: 'gallery',
			});
			ui.popUp.option(options, source => {
				if (typeof source !== 'string') return;
				doPick(source);
			});
		}
		else doPick();
	}),
	clear: (el) => {
		ui.popUp.confirm(gl('clearPic', null, 'imagePicker'), a => {
			if (a) photoLoader.remove(el, true);
		});
	},
};

vipLanguage.lang['imagePicker'] = {
	en: {
		useCamera: 'Use camera',
		chooseFromGallery: 'Choose from gallery',
		clearPic: 'Remove photo?',
	},
	id: {
		useCamera: 'Gunakan kamera',
		chooseFromGallery: 'Pilih dari galeri',
		clearPic: 'Hapus foto?',
	},
};