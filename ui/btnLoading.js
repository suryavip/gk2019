if (typeof ui === 'undefined') var ui = {};
ui.btnLoading = {
	install: () => {
		var btns = pg.thisPage.querySelectorAll('button');
		for (var i = 0; i < btns.length; i++) {
			var btn = btns[i];
			//cleanup
			btn.setAttribute('data-loading', 'false');
			var loadings = btn.querySelectorAll('.loading');
			if (loadings.length > 0) continue;

			var loading = document.createElement('div');
			loading.classList.add('loading');
			loading.innerHTML = `<div></div><div></div><div></div>`;
			btn.appendChild(loading);
		}
	},
	on: b => b.setAttribute('data-loading', 'true'),
	off: b => b.setAttribute('data-loading', 'false'),
};