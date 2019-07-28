var localJSON = {
	get: (fileName, id) => {
		var fromLS = localStorage.getItem(`${projectId}-${fileName}`);
		if (fromLS == null) fromLS = '{}';
		try { var LS = JSON.parse(fromLS); }
		catch (err) { var LS = {}; }
		if (id == null) return LS;
		else return LS[id];
	},
	put: (fileName, id, value) => {
		var LS = localJSON.get(fileName, null);
		if (value == null) {
			if (LS[id] == null) return;
			else delete LS[id];
		}
		else LS[id] = value;
		localJSON.reSet(fileName, LS);
	},
	reSet: (fileName, newComplete) => {
		localStorage.setItem(`${projectId}-${fileName}`, JSON.stringify(newComplete));
	},
	delete: (fileName, id) => { localJSON.put(fileName, id, null); },
	drop: (fileName) => { localStorage.removeItem(`${projectId}-${fileName}`); },
}