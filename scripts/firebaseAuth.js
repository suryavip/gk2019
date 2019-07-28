var firebaseAuth = {
	userId: localJSON.get('userdata', 'userId'),
	emailVerified: localJSON.get('userdata', 'emailVerified') === true,

	waitAfterSignUp: false,

	stated: false,
	waitStated: () => new Promise((resolve) => {
		var check = () => {
			if (firebaseAuth.stated) resolve();
			else setTimeout(() => { check(); }, 10);
		}
		check();
	}),

	isSignedIn: () => typeof firebaseAuth.userId === 'string',

	authCheck: required => {
		if (required) {
			if (!firebaseAuth.isSignedIn()) {
				console.log('kicked by guard');
				go('index', null, true);
				return false;
			}
			/*else if (!firebaseAuth.emailVerified) {
				go('verify', null, true);
				return false;
			}*/
			else return true;
		}
		else if (firebaseAuth.isSignedIn()) {
			console.log('pulled in by guard');
			go('home', null, true);
			return false;
		}
		else return true;
	},
};

window.addEventListener('firebase-ready', () => {
	var tempGlobalUserId;

	var firsttimesignedin = user => {
		console.log('signed-in');

		localJSON.put('userdata', 'userId', tempGlobalUserId);
		localJSON.put('userdata', 'name', user.displayName);
		localJSON.put('userdata', 'email', user.email);
		localJSON.put('userdata', 'emailVerified', user.emailVerified);
		firebaseAuth.userId = tempGlobalUserId;
		firebaseAuth.emailVerified = user.emailVerified;

		window.dispatchEvent(new CustomEvent(`firebase-signin`, { detail: user })); //for other js to reset initial or do things...

		vipLoading.add('firebaseAuth-firsttimesignedin'); //JUST TO MAKE SMOOTH CAUSE I DONT KNOW WHY TF ITS NOT SMOOTH BETWEEN VIPLOADING
		setTimeout(() => {
			/*if (firebaseAuth.emailVerified) */go('home', null, true);
			//else go('verify', null, true);
			vipLoading.remove('firebaseAuth-firsttimesignedin', true);
		}, 300);
	};

	var signedin = user => {
		if (firebaseAuth.waitAfterSignUp) {
			console.log('wait after sign-up (completing signup data)');
			setTimeout(() => { signedin(user) }, 1000);
			return;
		}
		console.log('status signed-in');
		var oldUserId = firebaseAuth.userId;
		tempGlobalUserId = user.uid;
		if (oldUserId !== tempGlobalUserId) firsttimesignedin(user);
		else {
			localJSON.put('userdata', 'userId', tempGlobalUserId)
			firebaseAuth.userId = tempGlobalUserId;
			localJSON.put('userdata', 'emailVerified', user.emailVerified);
			firebaseAuth.emailVerified = user.emailVerified;
			localJSON.put('userdata', 'name', user.displayName);
			localJSON.put('userdata', 'email', user.email);
		}
		window.dispatchEvent(new Event('firebase-status-signedin'));
	};

	var signedout = user => {
		console.log('status signed-out');
		if (!firebaseAuth.isSignedIn()) return; //emg blom ada yg login
		//reset app
		console.log('signed-out');
		vipLoading.add('firebaseAuth-signout');
		window.dispatchEvent(new Event('firebase-signout'));
		localJSON.drop('userdata');
		firebaseAuth.userId = null;
		go('index', null, true);
		vipLoading.remove('firebaseAuth-signout');
	};
	
	firebase.auth().onAuthStateChanged(user => {
		console.log(`firebase auth stated ${new Date()}`);
		firebaseAuth.stated = true;
		if (user) signedin(user);
		else signedout(user);
	});
});