var reauth = {
	core: (password) => new Promise(async (resolve, reject) => {
		var email = localJSON.get('userdata', 'email');
		var credential = firebase.auth.EmailAuthProvider.credential(email, password);
		vipLoading.add('reauth');
		await firebaseAuth.waitStated();
		firebase.auth().currentUser.reauthenticateWithCredential(credential)
			.then(() => firebase.auth().currentUser.getIdToken(true))
			.then(idToken => {
				vipLoading.remove('reauth');
				resolve(idToken);
			})
			.catch(error => {
				vipLoading.remove('reauth');
				if (error == null) {
					ui.float.error(gl('pleaseTryAgain', null, 'reauth'));
					reject('unknown');
				}
				else if (error.code === 'auth/wrong-password') {
					ui.popUp.alert(gl('wrongPassword', null, 'reauth'), () => {
						reject('wrongPassword');
					});
				}
				else {
					firebaseCommonError(error);
					reject('unknown');
				}
			});
	}),
	prompt: () => new Promise((resolve, reject) => {
		var fn = () => {
			ui.popUp.prompt(gl('password', null, 'reauth'), {
				'type': 'password',
				'maxlength': '32',
				'placeholder': gl('passwordPlaceholder', null, 'reauth')
			}, null, a => {
				if (a == null || a === '') reject('canceled');
				else reauth.core(a).then(resolve).catch(e => {
					if (e === 'wrongPassword') fn();
					else reject(e);
				});
			});
		};
		fn();
	}),
}

vipLanguage.lang['reauth'] = {
	en: {
		password: 'Password:',
		passwordPlaceholder: 'Your password...',
		wrongPassword: 'Wrong password',
		pleaseTryAgain: 'Please try again',
	},
	id: {
		password: 'Password:',
		passwordPlaceholder: 'Password...',
		wrongPassword: 'Password salah',
		pleaseTryAgain: 'Silahkan coba lagi',
	},
};