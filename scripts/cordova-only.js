/*
IF U USING cordova-plugin-browsertab, ENABLE THIS CODE TO OPEN NEW TAB IN ChromeTab WHEN window.open IS CALLED
document.addEventListener('deviceready', () => {
	window.open = cordova.plugins.browsertab.openUrl;
}, false);*/

var isCordovaAndroid = navigator.userAgent.match(/(CordovaAndroid)/) != null;

window.addEventListener('vipHistoryCloseApp', () => {
	return navigator.app.exitApp();
});

window.addEventListener('vipHistoryInit', () => {
	cordova.plugins.firebase.dynamiclinks.onDynamicLink(function(data) {
		//sample
		//{"deepLink":"https://adapr.boostedcode.com/?group=.....","clickTimestamp":1554448614908,"minimumAppVersion":0}
		console.log(data);
		var pageId = data.deepLink.replace(`${app.baseAPPAddress}/?`, '');
		var sourceAndParameter = vipPaging.getSourceAndParameter(pageId);
		if (pg.thisPage.id !== pageId) go(sourceAndParameter.source, sourceAndParameter.parameter, true); //make this the first page open so the behaviour will be the same as on browser
	});
});