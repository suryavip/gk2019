var ProfilePhotoController = {
	upload: (file, thumbnail) => {
		var form = new FormData()
		form.append('file', file)
		form.append('thumbnail', thumbnail)
		var options = {
			method: 'POST',
			body: form,
			headers: {},
		};
		options.headers['Content-Type'] = false;
		return jsonFetch.doWithIdToken(`${app.baseAPIAddress}/storage/profile_pic`, options);
	},
	delete: () => {
		var options = {
			method: 'DELETE',
			headers: {},
		};
		options.headers['Content-Type'] = false;
		return jsonFetch.doWithIdToken(`${app.baseAPIAddress}/storage/profile_pic`, options);
	},
};