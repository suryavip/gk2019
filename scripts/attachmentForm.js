var AttachmentForm = {

	init: function (area, addBtn, ownerId, initialAttachments, limit) {
		this.area = area; //area element which will contain attachment elements
		this.addBtn = addBtn; //element button that will be disabled if attachment reach it's limit
		this.ownerId = ownerId; //group or user id
		this.attachments = initialAttachments; /*{
			attachmentId: string. null for new file/image
			filename: optional if this attachment is file
		}*/
		this.limit = limit || 10;

		this.uploadDate = moment.utc();

		this.addBtn.classList.add('activable');
		this.buildElement();
	},
	gl: (k, p) => gl(k, p, 'AttachmentForm'),
	generateId: () => `${firebaseAuth.userId}-${new Date().getTime().toString(36)}`,

	buildElement: function () {
		//implement this.attachments into this.area

		this.addBtn.setAttribute('data-active', this.attachments.length < this.limit);

		for (i in this.attachments) {
			var a = this.attachments[i];
			var el = document.createElement('div');
			el.setAttribute('onclick', `AttachmentForm.option(this)`);
			el.classList.add('smallAttachment');
			if (typeof a.filename === 'string') {
				//this is file
				el.setAttribute('data-fileRefPath', `attachment/${this.ownerId}/${a.attachmentId}`);
				el.innerHTML = `<i class="fas fa-file"></i>
				<p>${app.escapeHTML(a.filename)}</p>`;
				this.area.insertBefore(el, this.addBtn);
			}
			else {
				//this is image
				el.setAttribute('data-photoRefPath', `attachment/${this.ownerId}/${a.attachmentId}`);
				el.innerHTML = `<i class="fas fa-image"></i>`;
				this.area.insertBefore(el, this.addBtn);
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
		var acceptedTypes = [
			'image/*',
			/*'text/plain',
			'application/pdf',
			'application/msword',
			'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
			'application/vnd.oasis.opendocument.text',
			'application/vnd.ms-powerpoint',
			'application/vnd.openxmlformats-officedocument.presentationml.presentation',
			'application/vnd.oasis.opendocument.presentation',
			'application/vnd.ms-excel',
			'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
			'application/vnd.oasis.opendocument.spreadsheet',
			'application/x-rar-compressed',
			'application/zip',*/
		];
		var input = document.createElement('input');
		input.multiple = 'multiple';
		input.type = 'file';
		input.accept = acceptedTypes.join(',');
		input.value = '';
		input.addEventListener('change', async (e) => {
			console.log(input.files);
			var batchId = new Date().getTime().toString(36);
			this.status.add(batchId);

			this.addBtn.setAttribute('data-active', this.attachments.length + input.files.length < this.limit);

			//create loading items
			var els = [];
			for (var i = 0; i < input.files.length && i + this.attachments.length < this.limit; i++) {
				var file = input.files[i];
				var el = document.createElement('div');
				el.setAttribute('onclick', `AttachmentForm.option(this)`);
				el.classList.add('smallAttachment');
				el.innerHTML = `<i class="fas fa-image"></i>`;
				this.area.insertBefore(el, this.addBtn);
				photoLoader.setSpinner(el);
				els.push(el);
			}

			for (var i = 0; i < input.files.length && i + this.attachments.length < this.limit; i++) {
				var file = input.files[i];
				var attachmentId = this.generateId();

				//compress
				var thumb = await compressorjsWrapper(file, 200, 200, 0.6);
				var compressed = await compressorjsWrapper(file, 2560, 2560, 0.6);

				//upload
				var metadata = { contentType: 'image/jpeg' };
				var thumbNoHead = thumb.base64.split('base64,')[1];
				var compressedNoHead = compressed.base64.split('base64,')[1];
				try {
					await firebase.storage().ref(`temp_attachment/${this.uploadDate.format('YYYY/MM/DD')}/${firebaseAuth.userId}/${attachmentId}_thumb`).putString(thumbNoHead, 'base64', metadata);

					await firebase.storage().ref(`temp_attachment/${this.uploadDate.format('YYYY/MM/DD')}/${firebaseAuth.userId}/${attachmentId}`).putString(compressedNoHead, 'base64', metadata);

					photoLoader.removeSpinner(els[i]);
					photoLoader.set(els[i], compressed.base64, true);

					this.attachments.push({
						attachmentId: attachmentId,
					});
				}
				catch (err) {
					//https://firebase.google.com/docs/storage/web/handle-errors
					ui.float.error(this.gl('uploadError', err.code));
					console.error(err);
				}
			}

			this.status.remove(batchId);
		});
		input.click();
	},

	addImage: async function () {
		var imgs = await imagePicker.pick(10, 'blobOrFile');
		this.changeStatus(1);

		//adjust addBtn
		this.addBtn.setAttribute('data-active', this.attachments.length + imgs.length < this.limit);

		//create loading items
		var els = [];
		for (var i = 0; i < imgs.length && i + this.attachments.length < this.limit; i++) {
			var el = document.createElement('div');
			el.setAttribute('onclick', `AttachmentForm.option(this)`);
			el.classList.add('smallAttachment');
			el.innerHTML = `<i class="fas fa-image"></i>`;
			this.area.insertBefore(el, this.addBtn);
			photoLoader.setSpinner(el);
			els.push(el);
		}

		//compress for thumb then upload
		for (var i = 0; i < imgs.length && i + this.attachments.length < this.limit; i++) {
			var attachmentId = this.generateId();

			//compress
			var thumb = await compressorjsWrapper(imgs[i], 200, 200, 0.6);
			var compressed = await compressorjsWrapper(imgs[i], 2560, 2560, 0.6);

			//upload
			var metadata = { contentType: 'image/jpeg' };
			var thumbNoHead = thumb.base64.split('base64,')[1];
			var compressedNoHead = compressed.base64.split('base64,')[1];
			try {
				await firebase.storage().ref(`temp_attachment/${this.uploadDate.format('YYYY/MM/DD')}/${firebaseAuth.userId}/${attachmentId}_thumb`).putString(thumbNoHead, 'base64', metadata);

				await firebase.storage().ref(`temp_attachment/${this.uploadDate.format('YYYY/MM/DD')}/${firebaseAuth.userId}/${attachmentId}`).putString(compressedNoHead, 'base64', metadata);

				photoLoader.removeSpinner(els[i]);
				photoLoader.set(els[i], compressed.base64, true);

				this.attachments.push({
					attachmentId: attachmentId,
				});
			}
			catch (err) {
				//https://firebase.google.com/docs/storage/web/handle-errors
				ui.float.error(this.gl('uploadError', err.code));
				console.error(err);
			}
		}

		this.changeStatus(0);
	},

	/*option: async function (targetEl) {
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
				var url = targetEl.style.backgroundImage;
				url = url.substr(5);
				url = url.substr(0, url.length - 2);
				photoLoader.view(url);
			}
			if (action === 'delete') {
				ui.popUp.confirm(this.gl('deleteImageConfirm'), v => {
					if (!v) return;
					this.area.removeChild(targetEl);
					this.attachments.splice(index, 1);
				});
			}
		});
	},*/

};

vipLanguage.lang['AttachmentForm'] = {
	en: {
		viewImage: 'View image',
		deleteImage: 'Delete image',
		deleteImageConfirm: 'Delete this image?',

		uploadError: p => `Failed to upload (${p})`,
	},
	id: {
		viewImage: 'Lihat gambar',
		deleteImage: 'Hapus gambar',
		deleteImageConfirm: 'Hapus gambar ini?',

		uploadError: p => `Gagal mengupload (${p})`,
	},
};