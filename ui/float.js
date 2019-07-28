if (typeof ui === 'undefined') var ui = {};
ui.float = {
	error: (msg) => {
		vipPaging.float.show(`<h3>${msg}</h3>`, null, 'error');
	},
	success: (msg) => {
		vipPaging.float.show(`<h3>${msg}</h3>`, null, 'success');
	},
	normal: (msg, time, onclick) => {
		vipPaging.float.show(`<h3>${msg}</h3>`, time, null, onclick);
	},
};