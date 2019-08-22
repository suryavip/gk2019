var FilePicker = {

	pick: async function (multiple, acceptNonImage) {
		var availableOptions = [];
		if (isCordova) availableOptions.push('camera');
		availableOptions.push('image');
		if (acceptNonImage) availableOptions.push('file');
		
		if (availableOptions.length === 1) return this.openPicker('image', multiple);
		
		var options = [];
		if (isCordova) options.push({
				title: this.gl('takePhoto'),
				icon: 'fas fa-camera',
				callBackParam: 'camera',
			});
		options.push({
			title: this.gl('choosePhotos'),
			icon: 'fas fa-images',
			callBackParam: 'photos',
		});
		options.push({
			title: this.gl('chooseFiles'),
			icon: 'fas fa-copy',
			callBackParam: 'files',
		});
		ui.popUp.option(options, source => {
			if (typeof source !== 'string') return;
			if (source === 'camera') AttachmentForm.takePhoto();
			else AttachmentForm.choose(source);
		});
	},

},