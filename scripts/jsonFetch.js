var jsonFetch = {
	timeout: 10 * 1000,
	do: async (url, options) => {
		if (options == null) options = {};
		options.mode = 'cors';
		//options.credentials = 'include';
		if (options.headers == null) options.headers = {};
		options.headers['Accept'] = 'application/json';
		options.headers['Content-Type'] = 'application/json';

		console.log(options);
		try {
			const controller = new AbortController();
			options.signal = controller.signal;
			setTimeout(() => controller.abort(), jsonFetch.timeout);
			var r = await fetch(url, options);
		}
		catch (e) {
			console.error(e);
			return {
				status: 'connectionError',
				r: null,
				b: null
			};
		}
		console.log(r);
		try { var b = await r.json(); }
		catch (e) {
			console.error(e);
			return {
				status: 'decodingError',
				r: r,
				b: null
			};
		}
		console.log(b);
		return {
			status: r.status,
			r: r,
			b: b
		};
	},
	doWithIdToken: async (url, options, forceNewToken) => {
		await firebaseAuth.waitStated();
		try {
			var idToken = await firebase.auth().currentUser.getIdToken(forceNewToken);
		}
		catch (e) {
			console.log('failed to get token');
			return {
				status: 'connectionError',
				r: null,
				b: null
			};
		}
		if (options == null) options = {};
		if (options.headers == null) options.headers = {};
		options.headers['X-idToken'] = idToken;
		return jsonFetch.do(url, options);
	},
};