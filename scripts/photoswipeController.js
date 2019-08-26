var photoswipeController = {
	photoSwipe: {},
	buildHTML: function () {
		var dummy = document.createElement('div');
		dummy.innerHTML = `<div class="pswp" tabindex="-1" role="dialog" aria-hidden="true">
			<div class="pswp__bg"></div>
			<div class="pswp__scroll-wrap">
				<div class="pswp__container">
					<div class="pswp__item"></div>
					<div class="pswp__item"></div>
					<div class="pswp__item"></div>
				</div>
				<div class="pswp__ui pswp__ui--hidden">
					<div class="pswp__top-bar">
						<div class="pswp__counter"></div>
						<button class="pswp__button pswp__button--close" title="${gl('close', null, 'photoswipeController')}"><i class="fas fa-times"></i></button>
						<button class="pswp__button pswp__button--share" title="Share"><i class="fas fa-share"></i></button>
						<button class="pswp__button pswp__button--download" title="${gl('download', null, 'photoswipeController')}"><i class="fas fa-download"></i></button>
						<button class="pswp__button pswp__button--fs" title="Toggle fullscreen"></button>
						<button class="pswp__button pswp__button--zoom" title="${gl('zoom', null, 'photoswipeController')}"><i class="fas fa-search"></i></button>
						<div class="pswp__preloader">
							<div class="pswp__preloader__icn">
								<div class="pswp__preloader__cut"><div class="pswp__preloader__donut"></div></div>
							</div>
						</div>
					</div>
					<div class="pswp__share-modal pswp__share-modal--hidden pswp__single-tap">
						<div class="pswp__share-tooltip"></div> 
					</div>
					<button class="pswp__button pswp__button--arrow--left" title="${gl('previous', null, 'photoswipeController')}"></button>
					<button class="pswp__button pswp__button--arrow--right" title="${gl('next', null, 'photoswipeController')}"></button>
					<div class="pswp__caption">
						<div class="pswp__caption__center"></div>
					</div>
				</div>
			</div>
		</div>`;
		return dummy.firstElementChild;
	},
	show: (urls, startIndex, downloadBtn) => {
		if (typeof urls === 'string') urls = [urls];
		if (typeof startIndex !== 'number') startIndex = 0;

		var pswpElement = document.querySelector('.pswp');
		var items = []; var count = 0;
		var done = () => {
			if (count !== urls.length) return;
			vipLoading.remove('photoswipeController-show');
			var options = {
				showAnimationDuration: 0,
				hideAnimationDuration: 0,
				closeOnScroll: false,
				fullscreenEl: false,
				shareEl: false,
				downloadEl: downloadBtn === true,
				loop: false,
				history: false,
				loadingIndicatorDelay: 300,
				index: startIndex,
				errorMsg: `<div class="pswp__error-msg">${gl('failedToLoadImage', null, 'photoswipeController')}</div>`,
				pinchToClose: false,
				downloadCallBack: async src => {
					if (src.startsWith('cdvfile')) {
						await firebaseAuth.waitStated();
						var refPath = src.replace(`${fss.root}${fss.shadowDir}/`, '');
						refPath = refPath.split('?')[0];
						var url = `${app.baseAPIAddress}/storage/${refPath}?r=${firebaseAuth.userId}&download=true`;
						window.open(url, '_blank');
					}
					else if (src.startsWith(app.baseAPIAddress)) {
						await firebaseAuth.waitStated();
						var baseAddress = src.split('?')[0];
						var url = `${baseAddress}?r=${firebaseAuth.userId}&download=true`;
						window.open(url, '_blank');
					}
				},
			};
			photoswipeController.photoSwipe = new PhotoSwipe(pswpElement, PhotoSwipeUI_Default, items, options);
			var id = new Date().getTime();
			try {
				photoswipeController.photoSwipe.init();

				var close = () => {
					photoswipeController.removeViaBackButton = true;
					window.removeEventListener(`vipHistoryBackListener-photoswipeController-${id}`, close);
					photoswipeController.photoSwipe.close();
				};

				delete photoswipeController.removeViaBackButton;
				window.addEventListener(`vipHistoryBackListener-photoswipeController-${id}`, close);
				vipHistory.backListener.add(`photoswipeController-${id}`);

				photoswipeController.photoSwipe.listen('close', (e) => {
					window.removeEventListener(`vipHistoryBackListener-photoswipeController-${id}`, close);
					//only remove backListener if back not come from back button
					if (!photoswipeController.removeViaBackButton) vipHistory.backListener.removeMatch(`photoswipeController-${id}`);
				});
			}
			catch (err) {
				console.error(err);
				ui.float.error(gl('failedToLoadImage', null, 'photoswipeController'));
				photoswipeController.photoSwipe.close();
			}
		}

		vipLoading.add('photoswipeController-show');
		for (i in urls) {
			var testImg = document.createElement('img');
			((index, el) => {
				el.onload = () => {
					items[index] = { src: el.src, w: el.width, h: el.height };
					count++;
					done();
				}
				el.onerror = () => {
					items[index] = { src: 'about:blank', w: 0, h: 0 };
					count++;
					done();
				}
				el.src = urls[index];
			})(i, testImg);
		}
	},
	showFromPath: async (refPath, startIndex, downloadBtn) => {
		if (typeof refPath === 'string') refPath = [refPath];

		vipLoading.add('photoswipeController-showFirebase');

		var urls = []; var count = 0;
		var done = () => {
			if (count !== refPath.length) return;
			vipLoading.remove('photoswipeController-showFirebase');
			photoswipeController.show(urls, startIndex, downloadBtn);
		}
		for (var i = 0; i < refPath.length; i++) {
			((index, refPath) => {
				fss.get(refPath, url => {
					if (url == null) {
						urls[index] = 'about:blank';
						count++;
						done();
					}
					else {
						urls[index] = url;
						count++;
						done();
					}
				}, true);
			})(i, refPath[i]);
		}
	},
};

vipLanguage.lang['photoswipeController'] = {
	en: {
		failedToLoadImage: 'Failed to load image',
		close: 'Close',
		download: 'Download',
		zoom: 'Zoom in/out',
		previous: 'Previous',
		next: 'Next',
	},
	id: {
		failedToLoadImage: 'Gagal memuat gambar',
		close: 'Tutup',
		download: 'Download',
		zoom: 'Perbesar/Perkecil',
		previous: 'Sebelumnya',
		next: 'Selanjutnya',
	},
};

document.body.insertBefore(photoswipeController.buildHTML(), document.querySelector('#vipLoading'));