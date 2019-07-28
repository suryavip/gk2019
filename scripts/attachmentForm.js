var attachmentForm = {
	numLimit: 10,
	list: [],
	/*{
		attachmentId: (required)
		filename: optional if this attachment is file
	}*/
	addBtnId: 'attachmentFormAddBtn',
	listToElement: function () {
		var attachment = this.list;

		var addBtn = pg.getEl(addBtnId);
		addBtn.setAttribute('data-active', attachment.length < this.numLimit);

		for (i in attachment) {
			if (typeof attachment[i].filename === 'string') {
				//this is file
				var el = document.createElement('div');
				el.setAttribute('onclick', `attachmentForm.option(this)`);
				el.innerHTML = `<i class="fas fa-file"></i>
				<p>${app.escapeHTML(attachment[i].filename)}</p>`;
				pg.getEl('attachments').insertBefore(el, addBtn);
			}
			else {
				//this is image
				var el = document.createElement('div');
				el.setAttribute('onclick', `attachmentForm.option(this)`);
				el.innerHTML = `<i class="fas fa-image"></i>`;
				pg.getEl('attachments').insertBefore(el, addBtn);
				photoLoader.set(el, attachment[i].base64);
			}
		}
	},
	add: async () => {
		var blob = await imagePicker(5, 'blobOrFile');
		pg.getEl('saveBtn').disabled = true;

		var attachmentAddBtn = pg.thisPage.querySelector('#attachments > .btn');

		var els = [];
		for (var i = 0; i < blob.length && i < pg.attachment.numLimit; i++) {
			var el = document.createElement('div');
			el.setAttribute('onclick', `pg.attachment.option(this)`);
			el.innerHTML = `<i class="fas fa-image"></i>`;
			pg.getEl('attachments').insertBefore(el, attachmentAddBtn);
			photoLoader.setSpinner(el);
			els.push(el);
		}
		var attachments = pg.thisPage.querySelectorAll('#attachments > div:not(.btn)');
		attachmentAddBtn.setAttribute('data-active', attachments.length < pg.attachment.numLimit);

		for (var i = 0; i < blob.length && i < pg.attachment.numLimit; i++) {
			var compressed = await compressorjsWrapper(blob[i], 2560, 2560, 0.6);
			if (compressed.size > 1 * 1024 * 1024) {
				pg.getEl('attachments').removeChild(els[i]);
				popUp.alert(gl('imageTooBig'));
				return;
			}
			pg.attachment.list.push({
				type: 'image',
				base64: compressed.base64,
			});
			//load to el
			photoLoader.removeSpinner(els[i]);
			photoLoader.set(els[i], compressed.base64, true);
		}
		pg.formControl.saveBtnStatus();
	},
};