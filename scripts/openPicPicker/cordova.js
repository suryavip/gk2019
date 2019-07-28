var openPicPicker = (source, outputType) => new Promise((resolve, reject) => {
	var onSuccess = imageURI => {
		//to blob
		var xhr = new XMLHttpRequest();
		xhr.open('GET', imageURI);
		xhr.responseType = 'blob';
		xhr.onload = () => {
			var imageBlob = xhr.response;
			if (outputType === 'blobOrFile') {
				resolve([imageBlob]);
				return;
			}
			//blob to 64
			var FR = new FileReader();
			var err = (e) => { reject('blobTo64'); };
			FR.onabort = err;
			FR.onerror = err;
			FR.onload = (e) => { resolve([e.target.result]); };
			FR.readAsDataURL(imageBlob);
		};
		xhr.onerror = () => { reject('URIToBlob'); };
		xhr.send();
	};
	var onFail = (message) => {
		reject(`getPic cordova: ${message}`);
	};
	var options = {
		destinationType: Camera.DestinationType.FILE_URI,
		correctOrientation: true,
	};
	if (source === 'gallery') options.sourceType = Camera.PictureSourceType.PHOTOLIBRARY;
	navigator.camera.getPicture(onSuccess, onFail, options);
});