vipPaging.pageTemplate['home'] = {
	import: [
		'pages/embeddedHome.js',
	],
	preopening: (d) => {
		if (!firebaseAuth.authCheck(true)) return false;
		if (document.body.offsetWidth > 700) {
			//wide mode, home is not needed (embeeded in group.js side bar)
			if (d.direction === 'forward') go('group');
			else if (d.direction === 'back') {
				// if back from group, then keep going back
				// else, open group
				if (vipHistory.pageBeforeBack === 'group') window.history.go(-1);
				else go('group');
			}
			return false;
		}
		return true;
	},
	opening: () => {
		embeddedHome.opening();
	},
	innerHTML: () => `
<div class="vipPaging-vLayout">
	<div class="head"><div>
		${embeddedHome.head()}
	</div></div>
	<div class="body"><div><div class="maxWidthWrap-480 aPadding-20" style="text-align:center">
		${embeddedHome.body()}
	</div></div></div>
</div>
`,
	functions: {
		//
	},
	lang: {
		en: {
			//
		},
		id: {
			//
		},
	},
};