/*
IF U USING cordova-plugin-browsertab, ENABLE THIS CODE TO OPEN NEW TAB IN ChromeTab WHEN window.open IS CALLED
document.addEventListener('deviceready', () => {
	window.open = cordova.plugins.browsertab.openUrl;
}, false);*/

var isCordovaAndroid = navigator.userAgent.match(/(CordovaAndroid)/) != null;

window.addEventListener('vipHistoryCloseApp', () => {
	return navigator.app.exitApp();
});

function photoswipeDownload(src) {
	var path = `Download/${new Date().getTime()}.jpg`;
	window.resolveLocalFileSystemURL(`cdvfile://localhost/sdcard/`, (parent) => {
		fss.util.fileEntry(parent, path, true, (fileEntry) => {
			var oReq = new XMLHttpRequest();
			oReq.open('GET', src, true);
			oReq.responseType = 'blob';
			oReq.onload = (oEvent) => {
				var blob = oReq.response;
				if (blob) fss.util.writeFile(fileEntry, blob, () => {
					console.log(`download from fss complete: ${fileEntry.toURL()}`);
					ui.float.success(gl('downloaded', path, 'cordovaOnly'));
				});
				else {
					console.error('we didnt get an XHR response!');
					ui.float.error(gl('downloadFailed', null, 'cordovaOnly'));
				}
			};
			oReq.send(null);
		});
	});
}

window.addEventListener('vipLanguageInit', () => {
	vipLanguage.lang['cordovaOnly'] = {
		en: {
			downloaded: p => `Image saved to ${p}`,
			downloadFailed: 'Failed to save image',
		},
		id: {
			downloaded: p => `Berhasil di simpan ke ${p}`,
			downloadFailed: 'Gagal meng-download',
		},
	};
});

window.addEventListener('vipHistoryInit', () => {
	cordova.plugins.firebase.dynamiclinks.onDynamicLink(function(data) {
		//sample
		//{"deepLink":"https://adapr.boostedcode.com/?group=.....","clickTimestamp":1554448614908,"minimumAppVersion":0}
		console.log(data);
		var pageId = data.deepLink.replace(`${app.baseAPPAddress}/?`, '');
		var sourceAndParameter = vipPaging.getSourceAndParameter(pageId);
		go(sourceAndParameter.source, sourceAndParameter.parameter, true); //make this the first page open so the behaviour will be the same as on browser
	});
});