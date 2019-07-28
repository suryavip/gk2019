const enableAllTippy = () => {
	//deinitialized old tippy
	var old = pg.thisPage.querySelectorAll('[data-original-title]');
	for (var i = 0; i < old.length; i++) {
		var title = old[i].getAttribute('data-original-title');
		old[i].setAttribute('title', title);
		old[i].removeAttribute('data-original-title');
		old[i].removeAttribute('data-tooltipped');
		old[i].removeAttribute('aria-describedby');
	}

	var all = pg.thisPage.querySelectorAll('[title]');
	var timingCount = 1;
	for (var i = 0; i < all.length; i++) {
		if (all[i].classList.contains('tippy-bottom')) var position = 'bottom';
		else if (all[i].classList.contains('tippy-left')) var position = 'left';
		else if (all[i].classList.contains('tippy-right')) var position = 'right';
		else var position = 'top';
		var openOnInitial = all[i].classList.contains('tippy-initial');
		var timing = all[i].getAttribute('data-tippyTiming');
		if (timing != null) timing = parseInt(timing);
		else {
			timing = timingCount;
			if (openOnInitial) timingCount++;
		}
		enableTippy(all[i], position, openOnInitial, timing);
	}
}
const enableTippy = (target, position, openOnInitial, timing) => {
	if (typeof target === 'string') target = pg.getEl(target);
	if (typeof position !== 'string') position = 'bottom';
	var tp = tippy(target, {
		position: position,
		duration: 150,
		trigger: 'manual',
		arrow: true,
		theme: 'base',
	});
	var popper = tp.getPopperElement(target);
	var status = 'idle';

	target.addEventListener('touchstart', e => {
		if (status !== 'idle') return;
		status = 'touchstart';
		setTimeout(() => {
			if (status !== 'touchstart') return;
			tp.show(popper);
			status = 'touchshow';
		}, 500);
	}, { passive: true });

	target.addEventListener('touchend', e => {
		if (status !== 'touchshow' && status !== 'touchstart') return;
		status = 'touchend';
		setTimeout(() => {
			if (status !== 'touchend') return;
			tp.hide(popper);
			status = 'idle';
		}, 500);
	}, { passive: true });

	target.addEventListener('mouseenter', () => {
		if (status !== 'idle') return;
		status = 'mousestart';
		setTimeout(() => {
			if (status !== 'mousestart') return;
			tp.show(popper);
			status = 'mouseshow';
		}, 700);
	}, { passive: true });

	target.addEventListener('mouseleave', () => {
		if (status !== 'mousestart' && status !== 'mouseshow') return;
		status = 'mouseend';
		setTimeout(() => {
			if (status !== 'mouseend') return;
			tp.hide(popper);
			status = 'idle';
		}, 50);
	}, { passive: true });

	var pageId = pg.thisPage.id;
	var pageName = pageId.split('=')[0];
	var autoShowTippy = localJSON.get('autoShowTippy', pageName);
	if (openOnInitial && !autoShowTippy) {
		if (timing == null) timing = 1;
		setTimeout(() => {
			if (pg.thisPage.id !== pageId) return;
			tp.show(popper);
			localJSON.put('autoShowTippy', pageName, true);
			setTimeout(() => {
				if (pg.thisPage.id !== pageId) return;
				tp.hide(popper);
			}, 1500);
		}, (timing - 1) * 1500);
	}
}

window.addEventListener('firebase-signout', () => {
	localJSON.drop('autoShowTippy');
});