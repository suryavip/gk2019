var langTheme = {

	langList: {
		en: 'English',
		id: 'Bahasa Indonesia',
	},
	lang: function () {
		var options = [];
		for (i in this.langList) {
			options.push({
				title: this.langList[i],
				callBackParam: i,
				checked: vipLanguage.key === i,
				icon: vipLanguage.key === i ? 'fas fa-check' : '',
			});
		}
		ui.popUp.option(options, langCode => {
			if (langCode == null) return;
			langTheme.changeLanguageTo(langCode);
		});
	},
	changeLanguageTo: function (langCode) {
		if (langCode === vipLanguage.key) return;
		vipLoading.add('langTheme-changeLanguageTo');

		localJSON.put('settings', 'language', langCode);
		app.reload();
	},

	theme: function () {
		var theme = getTheme();
		var options = [
			{
				title: gl('dim', null, 'langTheme'),
				callBackParam: 'default',
				icon: theme === 'default' ? 'fas fa-check' : '',
			},
		];
		ui.popUp.option(options, theme => {
			if (theme == null) return;
			langTheme.changeThemeTo(theme);
		});
	},
	changeThemeTo: function (theme) {
		var currentSettings = getTheme();
		if (currentSettings === theme) return;

		vipLoading.add('langTheme-changeThemeTo');

		localJSON.put('settings', 'theme', theme);

		var currentStyle = document.body.querySelector('link[href^="ui/"]');
		currentStyle.setAttribute('href', `ui/${getTheme()}.css?${appVersion}`);
		vipLoading.remove('langTheme-changeThemeTo');
	},

};

vipLanguage.lang['langTheme'] = {
	en: {
		dim: 'Dim',
	},
	id: {
		dim: 'Redup',
	},
};