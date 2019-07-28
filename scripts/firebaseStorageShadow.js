var fss = {
	knownURL: {},
	get: async (refPath, callBack) => {
		var knownURL = fss.knownURL[refPath];
		if (knownURL === 'blank') callBack.apply(this, [null]);
		else if (knownURL != null) callBack.apply(this, [knownURL]);

		await firebaseAuth.waitStated();

		var ref = firebase.storage().ref(refPath);
		ref.getDownloadURL().then(url => {
			fss.knownURL[refPath] = url;
			if (url !== knownURL) callBack.apply(this, [url]);
		}).catch(error => {
			fss.knownURL[refPath] = `blank`;
			callBack.apply(this, [null]);
			if (error.code !== 'storage/object-not-found') console.error(error);
		});
	},
	delete: refPath => {//this is just a wrapper, not actually needed on non cordova
		fss.knownURL[refPath] = null;
	},
};