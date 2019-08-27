var FilePicker = {

	result: function (files, nonImage) {
		//replace this function
	},

	pick: function (multiple, acceptNonImage) {
		var options = [];
		if (isCordova) options.push({
			title: this.gl('takePhoto'),
			icon: 'fas fa-camera',
			callBackParam: 'camera',
		});
		options.push({
			title: multiple ? this.gl('choosePhotos') : this.gl('choosePhoto'),
			icon: multiple ? 'fas fa-images' : 'fas fa-image',
			callBackParam: 'image',
		});
		if (acceptNonImage) options.push({
			title: multiple ? this.gl('chooseFiles') : this.gl('chooseFile'),
			icon: multiple ? 'fas fa-copy' : 'fas fa-file',
			callBackParam: 'file',
		});

		if (options.length === 1) {
			this.openPicker('image', multiple);
			return;
		}

		ui.popUp.option(options, source => {
			if (typeof source !== 'string') return;
			if (source === 'camera') FilePicker.takePhoto();
			else FilePicker.openPicker(source, multiple);
		});
	},

	gl: (k, p) => gl(k, p, 'FilePicker'),

	blobTobase64: (blobOrFile) => new Promise((resolve, reject) => {
		var FR = new FileReader();
		var err = (e) => { reject('fileTo64'); };
		FR.onabort = err;
		FR.onerror = err;
		FR.onload = (e) => { resolve(e.target.result); };
		FR.readAsDataURL(blobOrFile);
	}),

	takePhoto: function () {
		var onSuccess = imageURI => {
			//to blob
			var xhr = new XMLHttpRequest();
			xhr.open('GET', imageURI);
			xhr.responseType = 'blob';
			xhr.onload = () => { FilePicker.result([xhr.response], false); };
			xhr.send();
		};
		navigator.camera.getPicture(onSuccess, () => { }, {
			destinationType: Camera.DestinationType.FILE_URI,
			correctOrientation: true,
		});
	},

	openPicker: function (source, multiple) {
		var acceptedTypes = [
			'text/plain',
			'application/pdf',
			'application/msword',
			'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
			'application/vnd.oasis.opendocument.text',
			'application/vnd.ms-powerpoint',
			'application/vnd.openxmlformats-officedocument.presentationml.presentation',
			'application/vnd.oasis.opendocument.presentation',
			'application/vnd.ms-excel',
			'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
			'application/vnd.oasis.opendocument.spreadsheet',
			'application/x-rar-compressed',
			'application/zip',
		];
		var input = document.createElement('input');
		input.multiple = multiple == true;
		input.type = 'file';
		input.accept = source === 'image' ? 'image/*' : isCordova ? '' : acceptedTypes.join(',');
		input.value = '';
		input.addEventListener('change', async (e) => { FilePicker.result(input.files, source !== 'image'); });
		document.body.appendChild(input);
		input.click();
	},

	clearImage: function (el) {
		ui.popUp.confirm(this.gl('clearPic'), a => {
			if (a) photoLoader.remove(el, true);
		});
	},

};

vipLanguage.lang['FilePicker'] = {
	en: {
		takePhoto: 'Take a photo',

		choosePhotos: 'Choose images',
		choosePhoto: 'Choose image',

		chooseFiles: 'Choose files',
		chooseFile: 'Choose file',

		clearPic: 'Remove photo?',
	},
	id: {
		takePhoto: 'Ambil foto',

		choosePhotos: 'Pilih gambar',
		choosePhoto: 'Pilih gambar',

		chooseFiles: 'Pilih file',
		chooseFile: 'Pilih file',

		clearPic: 'Hapus foto?',
	},
};