vipPaging.pageTemplate['feedback'] = {
	preopening: () => firebaseAuth.authCheck(true),
	opening: () => {
		pg.lastState = null;
	},
	innerHTML: () => `
<div class="vipPaging-vLayout">
	<div class="head"><div>
		<div class="actionBar">
			<div class="button" onclick="window.history.go(-1)"><i class="fas fa-arrow-left"></i></div>
			<div class="title">${gl('title')}</div>
		</div>
	</div></div>
	<div class="body"><div><div class="maxWidthWrap-640">

		<div class="container-20" style="text-align:center">
			<h3>${gl('feedbackQuestion')}</h3>
			<div class="table dual-10 vSpace-20">
				<div>
					<div class="circleButton circleCenter-50" onclick="pg.dislike()"><i id="dislike" class="far fa-thumbs-down"></i></div>
					<div class="vSpace-10"></div>
					<p>${gl('dontLikeIt')}</p>
				</div>
				<div>
					<div class="circleButton circleCenter-50" onclick="pg.like()"><i id="like" class="far fa-thumbs-up"></i></div>
					<div class="vSpace-10"></div>
					<p>${gl('likeIt')}</p>
				</div>
			</div>
		</div>
		<div id="positive" class="activable container-20" style="text-align:center">
			<div class="vSpace-10"></div>	
			<p>${gl('positiveThanks')}</p>
			<div class="vSpace-30"></div>
			<button onclick="">${gl('rateOnGooglePlay')}</button>
			<div class="vSpace-20"></div>
			<button onclick="pg.giveSuggestion()">${gl('giveSuggestion')}</button>
		</div>
		<div id="suggestion" class="activable container-20" style="text-align:center">
			<textarea id="suggestion1" maxlength="500" placeholder="${gl('suggestionPlaceholder')}" rows="4"></textarea>
		</div>
		<div id="negative" class="activable container-20" style="text-align:center">
			<div class="vSpace-10"></div>
			<p>${gl('negativeThanks')}</p>
			<div class="vSpace-30"></div>
			<textarea id="suggestion2" maxlength="500" placeholder="${gl('suggestionPlaceholder')}" rows="4"></textarea>
		</div>
		<div id="done" class="activable container-20">
			<button class="primary" onclick="pg.done()">${gl('done')}</button>
		</div>

	</div></div></div>
</div>

`,
	functions: {
		like: () => {
			if (pg.lastState === true) return;
			pg.lastState = true;

			pg.getEl('like').classList.remove('far');
			pg.getEl('like').classList.add('fas');
			pg.getEl('dislike').classList.remove('fas');
			pg.getEl('dislike').classList.add('far');

			pg.getEl('positive').setAttribute('data-active', true);
			pg.getEl('suggestion').setAttribute('data-active', false);
			pg.getEl('negative').setAttribute('data-active', false);
			pg.getEl('done').setAttribute('data-active', true);
			pg.getEl('suggestion1').value = '';
		},
		dislike: () => {
			if (pg.lastState === false) return;
			pg.lastState = false;

			pg.getEl('like').classList.remove('fas');
			pg.getEl('like').classList.add('far');
			pg.getEl('dislike').classList.remove('far');
			pg.getEl('dislike').classList.add('fas');

			pg.getEl('positive').setAttribute('data-active', false);
			pg.getEl('suggestion').setAttribute('data-active', false);
			pg.getEl('negative').setAttribute('data-active', true);
			pg.getEl('done').setAttribute('data-active', true);
			pg.getEl('suggestion2').value = '';
		},
		giveSuggestion: () => {
			pg.getEl('suggestion').setAttribute('data-active', true);
			pg.getEl('suggestion1').focus();
		},
		done: () => {
			//
		},
	},
	lang: {
		en: {
			title: 'Give Feedback',
			feedbackQuestion: 'Do you like this app?',
			dontLikeIt: `I don't like it`,
			likeIt: 'I like it',

			positiveThanks: `Thank you for your feedback. We are happy to know that you like this app.`,
			rateOnGooglePlay: 'Give rate on Google Play Store',
			giveSuggestion: 'Send suggestions',

			suggestionPlaceholder: 'Tell us how we can improve this app...',

			negativeThanks: `Thank you for your feedback. We'll improve this app further.`,

			done: 'Done',
		},
		id: {
			title: 'Beri Tanggapan',
			feedbackQuestion: 'Apakah kamu menyukai aplikasi ini?',
			dontLikeIt: 'Tidak suka',
			likeIt: 'Suka',

			positiveThanks: 'Terima kasih atas tanggapannya. Kami senang kamu bisa terbantu dengan aplikasi ini.',
			rateOnGooglePlay: 'Berikan rating di Google Play Store',
			giveSuggestion: 'Berikan kritik atau saran',

			suggestionPlaceholder: 'Berikan kritik dan saran mu...',

			negativeThanks: `Terima kasih atas tanggapannya. Kami akan terus melakukan peningkatan kualitas aplikasi.`,

			done: 'Selesai',
		},
	},
};