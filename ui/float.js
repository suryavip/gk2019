if (typeof ui === 'undefined') var ui = {};
ui.float = {
	error: (msg, time, onclick) => {
		vipPaging.float.show(`<h3>${msg}</h3>`, time, 'error', onclick);
	},
	success: (msg, time, onclick) => {
		vipPaging.float.show(`<h3>${msg}</h3>`, time, 'success', onclick);
	},
	normal: (msg, time, onclick) => {
		vipPaging.float.show(`<h3>${msg}</h3>`, time, null, onclick);
	},
};