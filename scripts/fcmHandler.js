var fcmHandler = {
	sendTokenBusy: false,
	sendToken: newToken => {
		if (!firebaseAuth.isSignedIn()) {
			fcmHandler.sendTokenBusy = false;
			return;
		}

		var oldToken = localJSON.get('fcm', 'token');

		fcmHandler.sendTokenBusy = true;

		var lang = localJSON.get('settings', 'language') || 'id';

		var data = {
			new: newToken,
			old: '',
			deviceModel: `${device.manufacturer} ${device.model}`,
			devicePlatform: device.platform,
			deviceVersion: device.version,
			appVersion: appVersion,
			clientLanguage: lang,
		};

		if (typeof oldToken === 'string') {
			if (oldToken !== newToken) {
				data.old = oldToken;
				console.log(`FCMToken swap ${oldToken} to ${newToken}`);
			}
			else console.log(`FCMToken ${newToken}`);
		}
		else console.log(`new FCMToken ${newToken}`);

		jsonFetch.doWithIdToken(`${app.baseAPIAddress}/fcmToken`, {
			method: 'POST',
			body: JSON.stringify(data),
		}).then(f => {
			if (f.status === 201) {
				localJSON.put('fcm', 'token', newToken);
				console.log(`FCMToken sent`);
				fcmHandler.sendTokenBusy = false;
			}
			else {
				console.error(`FCMToken retry`);
				setTimeout(() => {
					fcmHandler.sendToken(newToken);
				}, 10000);
			}
		});
	},

};

window.addEventListener('firebase-status-signedin', () => {
	var fetchToken = async () => {
		console.log('fetching fcm token');
		var newToken = await window.cordova.plugins.firebase.messaging.getToken();
		fcmHandler.sendToken(newToken);
	};

	fetchToken();

	window.cordova.plugins.firebase.messaging.onTokenRefresh(() => {
		console.log('onFCMTokenRefresh');
		fetchToken();
	});

	//managing notification
	var onNotifOpen = (n, fromBackground) => {
		//sample when app in foreground
		//{"oldName":"XII IPS 1","targetException":"[\"sfPTqNLWnTVcc3CW9vMlHTjVz713\"]","tap":false,"body":"Surya mengubah nama grup XII IPS 1 menjadi XII IPS I","groupId":"a59966ba-6772-47f7-b3a6-8ce67a981f2a","performer":"{\"uid\":\"sfPTqNLWnTVcc3CW9vMlHTjVz713\",\"name\":\"Surya\"}","newName":"XII IPS I","notifType":"editGroup"}

		//sample when app in background and user click
		//{"google.delivered_priority":"high","google.sent_time":1553844810369,"google.ttl":259200,"google.original_priority":"high","oldName":"XII IPS I","targetException":"[\"sfPTqNLWnTVcc3CW9vMlHTjVz713\"]","tap":true,"from":"206566094511","groupId":"a59966ba-6772-47f7-b3a6-8ce67a981f2a","performer":"{\"uid\":\"sfPTqNLWnTVcc3CW9vMlHTjVz713\",\"name\":\"Surya\"}","google.message_id":"0:1553844810399688%7f5590a37f5590a3","newName":"XII IPS 1","collapse_key":"com.boostedcode.bs2019","notifType":"editGroup"}

		if (n.notifType === 'test') {
			ui.float.success(gl('testNotifSuccess', null, 'fcmHandler'));	
			return;
		}

		if (fromBackground) {
			go('notifications');
		}
		else {
			ui.float.success(gl('newNotification', null, 'fcmHandler'), 5000, `go('notifications')`);
		}
	}

	cordova.plugins.firebase.messaging.onMessage(n => {
		console.log("New foreground FCM message: ", n);
		var isPgSet = () => {
			if (typeof pg === 'undefined') setTimeout(isPgSet, 500);
			else onNotifOpen(n, false);
		};
		isPgSet();
	});

	cordova.plugins.firebase.messaging.onBackgroundMessage(n => {
		console.log("New background FCM message: ", n);
		var isPgSet = () => {
			if (typeof pg === 'undefined') setTimeout(isPgSet, 500);
			else onNotifOpen(n, true);
		};
		isPgSet();
	});
});

window.addEventListener('firebase-signout', async () => {
	var oldToken = localJSON.get('fcm', 'token');
	if (typeof oldToken === 'string') {
		var f = await jsonFetch.do(`${app.baseAPIAddress}/fcmToken`, {
			method: 'DELETE',
			body: JSON.stringify({
				old: oldToken,
			}),
		});
		if (f.status === 200) console.log('FCMToken cleaned');
		else console.error(`FCMToken failed to clean`);
	}

	localJSON.drop('fcm');
	await cordova.plugins.firebase.messaging.revokeToken();
});

window.addEventListener('vipLanguageInit', () => {
	vipLanguage.lang['fcmHandler'] = {
		en: {
			newNotification: 'New notification has arrive!',
			testNotifSuccess: 'Push notification test is received',
		},
		id: {
			newNotification: 'Ada notifikasi baru!',
			testNotifSuccess: 'Tes push notification berhasil diterima',
		},
	};
});