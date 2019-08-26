//for non cordova, this just refPath to real URL translator and tester
//return url will be null if failed

var fss = {
	get: async (refPath, callBack, dontReturnFailedLocal) => {
		await firebaseAuth.waitStated();
		var url = `${app.baseAPIAddress}/storage/${refPath}?r=${firebaseAuth.userId}&d=${new Date().getTime()}`;
		var testImg = document.createElement('img');
		testImg.onload = () => { callBack.apply(this, [url]); };
		testImg.onerror = () => { callBack.apply(this, [null]); };
		testImg.src = url;
	},
	delete: refPath => {
		//this is just a wrapper, not actually needed on non cordova
	},
};