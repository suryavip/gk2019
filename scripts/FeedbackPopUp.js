var FeedbackPopUp = {

	init: function () {
		//this will be called on launch or on opening home
		//decide here is it the right time to ask feedback
		this.popUp1();
	},

	gl: (l, p) => gl(l, p, 'FeedbackPopUp'),

	popUp1: function () {
		var popUpBuild = () => `<div style="padding: 20px; text-align: center;">
				<div class="vSpace-10"></div>
				<h3>${this.gl('feedbackQuestion')}</h3>
				<div class="table dual-10 vSpace-20" style="padding-right: 10px; padding-left: 10px;">
					<div>
						<div class="circleButton circleCenter-50" onclick="vipPaging.popUp.close(false)"><i id="dislike" class="far fa-thumbs-down"></i></div>
						<div class="vSpace-10"></div>
						<h4>${this.gl('dontLikeIt')}</h4>
					</div>
					<div>
						<div class="circleButton circleCenter-50" onclick="vipPaging.popUp.close(true)"><i id="like" class="far fa-thumbs-up"></i></div>
						<div class="vSpace-10"></div>
						<h4>${this.gl('likeIt')}</h4>
					</div>
				</div>
				<div class="vSpace-30"></div>
				<button onclick="window.history.go(-1)">${this.gl('close')}</button>
			</div>`;
		vipPaging.popUp.show(null, popUpBuild, null, (liked) => {
			if (typeof liked !== 'boolean') return;
			if (liked) {
				this.popUp2(); //ask for rating on store
				this.sendFeedback(liked);
			}
			else this.popUp3(liked); //ask for feedback
		});
	},

	popUp2: function () {
		var popUpBuild = () => `<div style="padding: 20px; text-align: center;">
				<div class="vSpace-10"></div>
				<h3>${this.gl('storeRatingQuestion')}</h3>
				<div class="vSpace-30"></div>
				<div class="table dual-10">
					<div><button onclick="window.history.go(-1)">${this.gl('no')}</button></div>
					<div><button onclick="vipPaging.popUp.close(true)" class="primary">${this.gl('sure')}</button></div>
				</div>
			</div>`;
		vipPaging.popUp.show(null, popUpBuild, null, (v) => {
			if (v === true) window.open('https://play.google.com/store/apps/details?id=com.boostedcode.gk2019', '_blank');
		});
	},

	popUp3: function (liked) {
		var popUpBuild = (id) => `<div style="padding: 20px; text-align: center;">
				<div class="vSpace-10"></div>
				<h3>${this.gl('suggestionQuestion')}</h3>
				<div class="vSpace-30"></div>
				<textarea id="suggestion" maxlength="500" placeholder="${this.gl('suggestionPlaceholder')}" rows="4"></textarea>
				<div class="vSpace-20"></div>
				<div class="table dual-10">
					<div><button onclick="window.history.go(-1)">${this.gl('skip')}</button></div>
					<div><button onclick="vipPaging.popUp.close(document.querySelector('#vipPaging-popUp-${id} textarea').value)" class="primary">${this.gl('submit')}</button></div>
				</div>
			</div>`;
		vipPaging.popUp.show(null, popUpBuild, null, (suggestion) => {
			if (typeof suggestion === 'string') this.sendFeedback(liked, suggestion);
			else this.sendFeedback(liked);
		});
	},

	sendFeedback: function (liked, suggestion) {
		if (suggestion == null) suggestion = '';

		var lang = localJSON.get('settings', 'language') || 'id';

		var data = {
			deviceModel: `${device.manufacturer} ${device.model}`,
			devicePlatform: device.platform,
			deviceVersion: device.version,
			liked: liked,
			suggestion: suggestion,
			appVersion: appVersion,
			clientLanguage: lang,
		};
		
		var send = async function (body) {
			var f = await jsonFetch.doWithIdToken(`${app.baseAPIAddress}/feedback`, {
				method: 'POST',
				body: body,
			});

			if (f.status === 'connectionError') {
				setTimeout(() => { send(body); }, 10000);
			}
		};

		send(JSON.stringify(data));
	},

};

vipLanguage.lang['FeedbackPopUp'] = {
	en: {
		feedbackQuestion: 'Do you like this app?',
		dontLikeIt: `I don't like it`,
		likeIt: 'I like it',
		close: 'Close',

		storeRatingQuestion: 'Would you mind to rate us on Google Play Store?',
		no: 'No',
		sure: 'Sure',

		suggestionQuestion: 'Would you mind giving us some feedback?',
		suggestionPlaceholder: 'Tell us how we can improve this app...',
		skip: 'Skip',
		submit: 'Send',
	},
	id: {
		feedbackQuestion: 'Apakah kamu menyukai aplikasi ini?',
		dontLikeIt: 'Tidak suka',
		likeIt: 'Suka',
		close: 'Tutup',

		storeRatingQuestion: 'Maukah kamu memberi kami rating di Google Play Store?',
		no: 'Tidak',
		sure: 'Tentu',

		suggestionQuestion: 'Ada kritik atau saran yang ingin disampaikan?',
		suggestionPlaceholder: 'Berikan kritik dan saran mu...',
		skip: 'Nanti saja',
		submit: 'Kirim',
	},
};