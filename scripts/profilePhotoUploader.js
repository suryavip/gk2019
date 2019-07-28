var profilePhotoUploader = (uid, small, big) => new Promise((resolve, reject) => {
	var metadata = { contentType: 'image/jpeg' };
	var start = new Date().getTime();

	var smallNoHead = small.split('base64,')[1];
	var bigNoHead = big.split('base64,')[1];

	var count = 0;
	var finish = () => {
		count++;
		if (count === 2) {
			console.log(`upload finished in ${new Date().getTime() - start}ms`);
			resolve();
		}
	};
	var err = (e) => {
		reject(e);
	};
	firebase.storage().ref(`profile_pic/${uid}_small.jpg`).putString(smallNoHead, 'base64', metadata)
		.then(finish)
		.catch(err);
	firebase.storage().ref(`profile_pic/${uid}.jpg`).putString(bigNoHead, 'base64', metadata)
		.then(finish)
		.catch(err);
});