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
				el.setAttribute('data-photoRefPath', `attachment/${this.ownerId}/${a.attachmentId}.jpg`);
				el.innerHTML = `<i class="fas fa-image"></i>`;
				this.area.insertBefore(el, this.addBtn);
			}
		}

		photoLoader.autoLoad(this.area);
	},

	status: 0, //0 means idle, 1 means adding
	listenForStatus: function (callBack) {
		//useful for controlling saveBtn
		callBack(this.status);
		pg.thisPage.addEventListener(`AttachmentFormStatus`, (e) => {
			callBack(e.detail);
		});
	},
	changeStatus: function (status) {
		this.status = status;
		var ev = new CustomEvent(`AttachmentFormStatus`, { detail: this.status });
		pg.thisPage.dispatchEvent(ev);
	},

	/*add: async function () {
		var blob = await imagePicker.pick(10, 'blobOrFile');
		this.changeStatus(1);

		this.addBtn.setAttribute('data-active', this.attachments.length + blob.length < this.limit);

		var els = [];
		for (var i = 0; i < blob.length && i + this.attachments.length < this.limit; i++) {
			var el = document.createElement('div');
			el.setAttribute('onclick', `AttachmentForm.option(this)`);
			el.classList.add('smallAttachment');
			el.innerHTML = `<i class="fas fa-image"></i>`;
			this.area.insertBefore(el, this.addBtn);
			photoLoader.setSpinner(el);
			els.push(el);
		}

		for (var i = 0; i < blob.length && i + this.attachments.length < this.limit; i++) {
			var compressed = await compressorjsWrapper(blob[i], 2560, 2560, 0.6);
			if (compressed.size > 1 * 1024 * 1024) {
				this.area.removeChild(els[i]);
				ui.popUp.alert(this.gl('imageTooBig'));
				return;
			}
			this.attachments.push({
				type: 'image',
				base64: compressed.base64,
			});
			//load to el
			photoLoader.removeSpinner(els[i]);
			photoLoader.set(els[i], compressed.base64, true);
		}

		this.changeStatus(0);
	},

	option: async function (targetEl) {
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
		imageTooBig: 'Sorry, this image file size is too big',
		viewImage: 'View image',
		deleteImage: 'Delete image',
		deleteImageConfirm: 'Delete this image?',
	},
	id: {
		imageTooBig: 'Maaf, ukuran file gambar ini terlalu besar',
		viewImage: 'Lihat gambar',
		deleteImage: 'Hapus gambar',
		deleteImageConfirm: 'Hapus gambar ini?',
	},
};