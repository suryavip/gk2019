var compressorjsWrapper = (blobOrFile, maxWidth, maxHeight, quality) => new Promise(async (resolve, reject) => {
	new Compressor(blobOrFile, {
		maxWidth: maxWidth,
		maxHeight: maxHeight,
		quality: quality,
		mimeType: 'image/jpeg',
		success(r) {
			//convert to base64
			var FR = new FileReader();
			var err = (e) => { };
			FR.onabort = err;
			FR.onerror = err;
			FR.onload = (e) => { resolve({
				file: r,
				base64: e.target.result,
				size: r.size,
			}); };
			FR.onerror = reject;
			FR.readAsDataURL(r);
		},
		error(e) { reject(e); },
	});
});