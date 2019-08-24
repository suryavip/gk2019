var AttachmentForm = {

	init: function (area, addBtn, ownerId, initialAttachments, limit) {
		this.area = area; //area element which will contain attachment elements
		this.addBtn = addBtn; //element button that will be disabled if attachment reach it's limit
		this.ownerId = ownerId; //group or user id
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
				//el.setAttribute('data-photoRefPath', a.attachmentId);
				//el.setAttribute('data-photoRefPath', a.attachmentId);
				el.innerHTML = `<i class="fas fa-image"></i>`;
				this.area.appendChild(el);
			}
		}

		//TODO: load image
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
			if (nonImage) AttachmentForm.filesIntake(files);
			else AttachmentForm.imagesIntake(files);
		};
		FilePicker.pick(true, true);
	},

	imagesIntake: async function (files) {
		var batchId = new Date().getTime().toString(36);
		this.status.add(batchId);

		this.addBtn.setAttribute('data-active', this.attachments.length + files.length < this.limit);

		//create loading items
		var els = [];
		for (var i = 0; i < files.length && i + this.attachments.length < this.limit; i++) {
			var el = document.createElement('div');
			el.setAttribute('onclick', `AttachmentForm.imageOption(this)`);
			el.classList.add('smallAttachment');
			el.innerHTML = `<i class="fas fa-image"></i>`;
			this.area.appendChild(el);
			photoLoader.setSpinner(el);
			els.push(el);
		}

		for (var i = 0; i < files.length && i + this.attachments.length < this.limit; i++) {
			var file = files[i];

			//compress
			var thumb = await compressorjsWrapper(file, 200, 200, 0.6);
			var compressed = await compressorjsWrapper(file, 2560, 2560, 0.6);

			var f = await dat.server.uploadAttachment(compressed.file, null, thumb.file);
			if (f.status === 201) {
				photoLoader.removeSpinner(els[i]);
				photoLoader.set(els[i], compressed.base64, true);

				this.attachments.push({
					attachmentId: f.b.attachmentId,
				});
			}
			else {
				this.area.removeChild(els[i]);
				ui.float.error(this.gl('uploadError', f.status));
			}
		}

		this.status.remove(batchId);
	},

	filesIntake: async function (files) {
		var batchId = new Date().getTime().toString(36);
		this.status.add(batchId);

		this.addBtn.setAttribute('data-active', this.attachments.length + files.length < this.limit);

		//create loading items
		var els = [];
		for (var i = 0; i < files.length && i + this.attachments.length < this.limit; i++) {
			var file = files[i];
			var el = document.createElement('div');
			el.setAttribute('onclick', `AttachmentForm.fileOption(this)`);
			el.classList.add('smallAttachment');
			el.innerHTML = `<i class="fas fa-file"></i><p>${app.escapeHTML(file.name)}</p>`;
			this.area.appendChild(el);
			photoLoader.setSpinner(el);
			els.push(el);
		}

		for (var i = 0; i < files.length && i + this.attachments.length < this.limit; i++) {
			var file = files[i];

			var f = await dat.server.uploadAttachment(file, file.name);
			if (f.status === 201) {
				photoLoader.removeSpinner(els[i]);
				photoLoader.set(els[i], compressed.base64, true);

				this.attachments.push({
					attachmentId: f.b.attachmentId,
					originalFilename: file.name,
				});
			}
			else {
				this.area.removeChild(els[i]);
				ui.float.error(this.gl('uploadError', f.status));
			}
		}

		this.status.remove(batchId);
	},

	imageOption: function (targetEl) {
		//find index
		var attachments = this.area.children;
		var index = 0;
		for (var i = 0; i < attachments.length; i++) if (attachments[i] == targetEl) index = i;
		console.log(`image at index ${index}`);

		var options = [];
		options.push({
			title: this.gl('viewImage'),
			icon: 'fas fa-eye',
			callBackParam: 'view',
		});
		options.push({
			title: this.gl('deleteImage'),
			icon: 'fas fa-trash',
			callBackParam: 'delete',
		});
		ui.popUp.option(options, (action) => {
			if (typeof action !== 'string') return;
			if (action === 'view') {
				var fullPhotoRefPath = targetEl.getAttribute('data-fullPhotoRefPath');
				photoLoader.view(fullPhotoRefPath);
			}
			if (action === 'delete') {
				ui.popUp.confirm(this.gl('deleteImageConfirm'), v => {
					if (!v) return;
					this.area.removeChild(targetEl);
					this.attachments.splice(index, 1);
				});
			}
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
		viewImage: 'View image',
		deleteImage: 'Delete image',
		deleteImageConfirm: 'Delete this image?',

		deleteFileConfirm: 'Delete this file?',

		uploadError: p => `Failed to upload (${p})`,
	},
	id: {
		viewImage: 'Lihat gambar',
		deleteImage: 'Hapus gambar',
		deleteImageConfirm: 'Hapus gambar ini?',

		deleteFileConfirm: 'Hapus file ini?',

		uploadError: p => `Gagal mengupload (${p})`,
	},
};