var AttachmentForm = {

	init: function (area, addBtn, initialAttachments, limit) {
		this.area = area; //area element which will contain attachment elements
		this.addBtn = addBtn; //element button that will be disabled if attachment reach it's limit
		this.attachments = initialAttachments.slice(); /*{
			attachmentId: string. null for new file/image
			originalFilename: optional if this attachment is file
		}*/
		this.limit = limit || 10;

		this.addBtn.classList.add('activable');
		this.buildElement();
	},
	gl: (k, p) => gl(k, p, 'AttachmentForm'),

	buildElement: function () {
		//implement this.attachments into this.area

		this.addBtn.setAttribute('data-active', this.attachments.length < this.limit);

		for (i in this.attachments) {
			var a = this.attachments[i];
			var el = document.createElement('div');
			el.classList.add('smallAttachment');
			if (typeof a.originalFilename === 'string') {
				//this is file
				el.setAttribute('onclick', `AttachmentForm.fileOption(this)`);
				el.innerHTML = `<i class="fas fa-file"></i>
				<p>${app.escapeHTML(a.originalFilename)}</p>`;
				this.area.appendChild(el);
			}
			else {
				//this is image
				el.setAttribute('onclick', `AttachmentForm.imageOption(this)`);
				el.setAttribute('data-photoRefPath', `attachment/${a.attachmentId}_thumb`);
				el.innerHTML = `<i class="fas fa-image"></i>`;
				this.area.appendChild(el);
			}
		}

		photoLoader.autoLoad(this.area);
	},

	status: {
		value: {}, //if key length is 0 then its idle
		listen: function (callBack) {
			//useful for controlling saveBtn
			callBack(Object.keys(this.value).length);
			pg.thisPage.addEventListener(`AttachmentFormStatus`, (e) => { callBack(e.detail); });
		},
		add: function (id) {
			this.value[id] = true;
			var ev = new CustomEvent(`AttachmentFormStatus`, { detail: Object.keys(this.value).length });
			pg.thisPage.dispatchEvent(ev);
		},
		remove: function (id) {
			delete this.value[id];
			var ev = new CustomEvent(`AttachmentFormStatus`, { detail: Object.keys(this.value).length });
			pg.thisPage.dispatchEvent(ev);
		},
	},

	add: function () {
		FilePicker.result = (files, nonImage) => {
			console.log(files);
			AttachmentForm.intake(files, nonImage);
		};
		FilePicker.pick(true, true);
	},

	intake: async function (files, nonImage) {
		var batchId = new Date().getTime().toString(36);
		this.status.add(batchId);

		this.addBtn.setAttribute('data-active', this.attachments.length + files.length < this.limit);

		//create loading items
		var els = [];
		for (var i = 0; i < files.length && i + this.attachments.length < this.limit; i++) {
			var file = files[i];
			var el = document.createElement('div');
			el.classList.add('smallAttachment');
			if (nonImage) {
				el.setAttribute('onclick', `AttachmentForm.fileOption(this)`);
				el.innerHTML = `<i class="fas fa-file"></i><p>${app.escapeHTML(file.name)}</p>`;
			}
			else {
				el.setAttribute('onclick', `AttachmentForm.imageOption(this)`);
				el.innerHTML = `<i class="fas fa-image"></i>`;
			}
			this.area.appendChild(el);
			photoLoader.setSpinner(el);
			els.push(el);
		}

		rejected = [];
		failed = [];

		for (var i = 0; i < files.length && i < els.length; i++) {
			var file = files[i];

			if (nonImage) var f = await this.uploadAttachment(file, file.name);
			else {
				var thumb = await compressorjsWrapper(file, 200, 200, 0.6);
				var compressed = await compressorjsWrapper(file, 2560, 2560, 0.6);
				var f = await this.uploadAttachment(compressed.file, null, thumb.file);
			}

			if (f.status === 201) {
				photoLoader.removeSpinner(els[i]);
				var newA = { attachmentId: f.b.attachmentId };
				if (nonImage) newA['originalFilename'] = file.name;
				else photoLoader.set(els[i], compressed.base64, true);
				
				this.attachments.push(newA);
			}
			else {
				this.area.removeChild(els[i]);
				if (f.status === 400 && f.b.code === 'unknown type') rejected.push(file.name);
				else failed.push(file.name);
			}

			await this.delay(500);
		}

		this.status.remove(batchId);

		//show rejected and failed files
		var showFailed = () => {
			if (failed.length > 0) ui.popUp.alert(this.gl('uploadFileError', failed.join(', ')));
		};
		if (rejected.length > 0) ui.popUp.alert(this.gl('rejectedType', rejected.join(', ')), showFailed);
		else showFailed();

		this.addBtn.setAttribute('data-active', this.attachments.length < this.limit);
	},

	delay: (ms) => new Promise((resolve) => { setTimeout(() => { resolve(); }, ms); }),

	uploadAttachment: function (file, originalFilename, thumbnail) {
		var form = new FormData()
		form.append('file', file)
		if (typeof originalFilename === 'string') form.append('originalFilename', originalFilename)
		if (thumbnail != null) form.append('thumbnail', thumbnail)
		var options = {
			method: 'POST',
			body: form,
			headers: {},
		};
		options.headers['Content-Type'] = false;
		return jsonFetch.doWithIdToken(`${app.baseAPIAddress}/storage/attachment`, options);
	},

	imageOption: function (targetEl) {
		//find index
		var attachments = this.area.children;
		var index = 0;
		for (var i = 0; i < attachments.length; i++) if (attachments[i] == targetEl) index = i;
		console.log(`image at index ${index}`);

		ui.popUp.confirm(this.gl('deleteImageConfirm'), v => {
			if (!v) return;
			this.area.removeChild(targetEl);
			this.attachments.splice(index, 1);
		});
	},

	fileOption: function (targetEl) {
		//find index
		var attachments = this.area.children;
		var index = 0;
		for (var i = 0; i < attachments.length; i++) if (attachments[i] == targetEl) index = i;
		console.log(`file at index ${index}`);

		ui.popUp.confirm(this.gl('deleteFileConfirm'), v => {
			if (!v) return;
			this.area.removeChild(targetEl);
			this.attachments.splice(index, 1);
		});
	},

};

vipLanguage.lang['AttachmentForm'] = {
	en: {
		deleteImageConfirm: 'Delete this image?',

		deleteFileConfirm: 'Delete this file?',

		uploadImageError: p => `Failed to upload (${p})`,
		uploadFileError: p => `Failed to upload ${app.escapeHTML(p)}`,
		rejectedType: p => `Unsupported file type: ${app.escapeHTML(p)}`,
	},
	id: {
		deleteImageConfirm: 'Hapus gambar ini?',

		deleteFileConfirm: 'Hapus file ini?',

		uploadImageError: p => `Gagal mengupload (${p})`,
		uploadFileError: p => `Gagal mengupload ${app.escapeHTML(p)}`,
		rejectedType: p => `Tidak mendukung file sejenis ini: ${app.escapeHTML(p)}`,
	},
};