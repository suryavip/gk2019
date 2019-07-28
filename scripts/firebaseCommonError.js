function firebaseCommonError(error) {
	if (error.code === 'auth/network-request-failed') {
		ui.float.error(gl('connectionError', null, 'app'));
	}
	else if (error.code === 'auth/too-many-requests') {
		ui.float.error(gl('tooManyRequests', null, 'firebaseCommonError'));
	}
	else if (error.code === 'auth/user-disabled') {
		ui.float.error(gl('userDisabled', null, 'firebaseCommonError'));
	}
	else ui.float.error(gl('unexpectedError', error.code, 'app'));
}

window.addEventListener('vipLanguageInit', () => {
	vipLanguage.lang['firebaseCommonError'] = {
		en: {
			tooManyRequests: 'Requests are blocked from a device due to unusual activity. Please try again after a few moment.',
			userDisabled: 'This account has been disabled. Please contact us.',
		},
		id: {
			tooManyRequests: 'Permintaan diblokir karena aktivitas tidak biasa. Silahkan coba lagi setelah beberapa saat.',
			userDisabled: 'Akun ini telah dinonaktifkan. Silahkan hubungi kami.',
		},
	};
});