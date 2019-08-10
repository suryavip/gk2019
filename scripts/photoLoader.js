var photoLoader = {
	set: (el, url, changed) => {
		el.setAttribute('data-imageChanged', changed === true);
		el.setAttribute('data-hideIcon', true);
		el.style.backgroundImage = `url(${url})`;
	},
	remove: (el, changed) => {
		el.setAttribute('data-imageChanged', changed === true);
		el.removeAttribute('data-hideIcon');
		el.style.backgroundImage = `none`;
		var curOnclick = el.getAttribute('onclick');
		if (typeof curOnclick === 'string' && curOnclick.startsWith('photoLoader.view(')) el.removeAttribute('onclick');
	},
	setSpinner: function (el) {
		var i = el.querySelector('i');
		i.setAttribute('data-classBackup', i.getAttribute('class'));
		//i.setAttribute('class', 'fas fa-spinner fa-pulse');
		i.setAttribute('class', 'fas fa-hourglass-half photoLoading');
	},
	removeSpinner: function (el) {
		var i = el.querySelector('i');
		var backup = i.getAttribute('data-classBackup');
		if (backup == null) return;
		i.setAttribute('class', backup);
		i.removeAttribute('data-classBackup');
	},
	blank: function (el) {
		this.removeSpinner(el);
		this.remove(el, false);
	},
	notBlank: function (el, url) {
		this.removeSpinner(el);
		this.set(el, url, false);
	},
	autoLoad: function (scope) {
		if (scope == null) scope = pg.thisPage;
		var photos = scope.querySelectorAll('[data-photoRefPath]');
		var toLoad = {};
		for (var i = 0; i < photos.length; i++) {
			var photoRefPath = photos[i].getAttribute('data-photoRefPath');
			var fullPhotoRefPath = photos[i].getAttribute('data-fullPhotoRefPath');
			toLoad[photoRefPath] = fullPhotoRefPath;
		}
		for (photoRefPath in toLoad) {
			var fullPhotoRefPath = toLoad[photoRefPath];
			this.load(
				Array.prototype.slice.call(scope.querySelectorAll(`[data-photoRefPath="${photoRefPath}"]`)),
				photoRefPath,
				photoRefPath
			);
		}
	},
	load: function (target, refPath, fullRefPath) {
		if (!Array.isArray(target) && target != null) target = [target];
		if (target[0].getAttribute == null) target = Array.prototype.slice.call(target);

		for (var i = 0; i < target.length; i++) {
			//setting spinner (or other loading indication)
			photoLoader.setSpinner(target[i]);
			//setting fullRefPath
			if (typeof fullRefPath === 'string' && target[i].getAttribute('onclick') == null) {
				target[i].setAttribute('onclick', `photoLoader.view('${fullRefPath}')`);
			}
		}

		fss.get(refPath, url => {
			if (url == null) {
				for (var i = 0; i < target.length; i++) this.blank(target[i]);
			}
			else {
				//test
				var testImg = document.createElement('img');
				testImg.onload = () => {
					for (var i = 0; i < target.length; i++) this.notBlank(target[i], url);
				};
				testImg.onerror = () => {
					for (var i = 0; i < target.length; i++) this.blank(target[i]);
				};
				testImg.src = url;
			}
		});
	},
	importPhotoSwipe: async () => {
		if (typeof photoswipeController === 'object') {
			console.log('photoswipeController already imported');
			return true;
		}
		console.log('importing photoswipeController');
		vipLoading.add('photoSwipe');
		try {
			await vipPaging.importResourcesPromise([
				`lib/photoSwipe-4.1.2/photoswipe.css`,
				`lib/photoSwipe-4.1.2/default-skin/default-skin.css`,
				`lib/photoSwipe-4.1.2/photoswipe.min.js`,
				`lib/photoSwipe-4.1.2/photoswipe-ui-default.js`,
				`scripts/photoswipeController.js`,
			]);
			vipLoading.remove('photoSwipe');
			return true;
		}
		catch {
			console.log(`Cannot load photoSwipe`);
			vipLoading.remove('photoSwipe');
			return false;
		}
	},
	view: async refPath => {
		var im = await photoLoader.importPhotoSwipe();
		if (im === false) return false;
		//open photoSwipe
		photoswipeController.showFirebase(refPath);
	},
};