var openPicPicker = (source, outputType, numOfFiles) => new Promise((resolve, reject) => {
	var input = document.createElement('input');
	input.multiple = numOfFiles > 1;
	input.type = 'file';
	input.accept = 'image/*';
	input.onchange = async () => {
		if (outputType === 'blobOrFile') {
			resolve(input.files);
			return;
		}
		//convert to base64
		var base64Converter = (blobOrFile) => new Promise((resolve, reject) => {
			var FR = new FileReader();
			var err = (e) => { reject('fileTo64'); };
			FR.onabort = err;
			FR.onerror = err;
			FR.onload = (e) => { resolve(e.target.result); };
			FR.readAsDataURL(blobOrFile);
		});
		var collectedBase64 = [];
		for (var i = 0; i < input.files.length; i++) {
			try {
				collectedBase64.push(await base64Converter(input.files[i]));
			}
			catch {
				reject('fileTo64');
			}
		}
		resolve(collectedBase64);
	};
	document.body.appendChild(input);
	input.click();
});