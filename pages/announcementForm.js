vipPaging.pageTemplate['announcementForm'] = {
	preopening: () => firebaseAuth.authCheck(true),
	opening: () => {
		ui.btnLoading.install();

		app.listenForChange(['title', 'text'], () => {
			pg.getEl('btn').disabled = pg.getEl('title').value === '' ||
				pg.getEl('text').value === '';
		});

		//text auto height
		var text = pg.getEl('text');
		var scrollHeightChanged = 0; //ignore if this 0 and 1
		app.listenForChange(['text'], () => {
			var scrollBody = pg.thisPage.querySelector('.body > div');
			var s = scrollBody.scrollTop;
			var sh = scrollBody.scrollHeight;

			text.style.height = 'auto';
			text.style.height = (text.scrollHeight) + 'px';

			if (scrollHeightChanged > 1) scrollBody.scrollTop = s + (scrollBody.scrollHeight - sh);
			//only change scrollTop if scrollHeightChanged is > 1 (means its not on initial state)
			scrollHeightChanged++;
		});
		text.setAttribute('style', `height: ${text.scrollHeight}px; overflow-y:hidden;`);

		pg.groupId = app.activeGroup.get();
		if (pg.groupId === 'empty') {
			window.history.go(-1);
			return;
		}

		if (typeof pg.parameter === 'string') {
			//load data
			pg.loadData();
		}
		else {
			//new
			pg.getEl('title').focus();
		}
	},
	innerHTML: d => `
<div class="vipPaging-vLayout">
	<div class="head"><div>
		<div class="actionBar">
			<div class="button" onclick="window.history.go(-1)"><i class="fas fa-arrow-left"></i></div>
			<div class="title">${gl(typeof d.parameter === 'string' ? 'editTitle' : 'createTitle')}</div>
		</div>
	</div></div>
	<div class="body"><div><div class="maxWidthWrap-480 aPadding-30">

		<div class="inputLabel">${gl('title')}</div>
		<input id="title" type="text" maxlength="100" placeholder="${gl('titlePlaceholder')}" />

		<div class="inputLabel">${gl('text')}</div>
		<textarea id="text" maxlength="500" placeholder="${gl('textPlaceholder')}" rows="4"></textarea>
		
		<div class="horizontalOverflow vSpace-10" id="attachments">
			<div id="attachmentFormAddBtn" class="smallAttachment" onclick="pg.attachment.add()">
				<i class="fas fa-plus"></i>
				<p>${gl('addAttachment')}</p>
			</div>
		</div>

		<div class="inputLabel" style="margin-top: 25px">${gl('dateTime')}</div>
		<h6 class="inputHint">${gl('dateTimeHint')}</h6>
		<input id="date" type="text" readonly onclick="ui.popUp.date.picker(this.getAttribute('data-date'), pg.datePicked)" data-date="${moment().format('YYYY-MM-DD')}" value="${app.displayDate()}"/>
		<div class="vSpace-10"></div>
		<div class="inputWithButton">
			<div><input id="time" type="text" readonly onclick="ui.popUp.timePicker(this.value, pg.timePicked)" placeholder="${gl('timePlaceholder')}"/></div>
			<div class="activable" id="clearTimeBtn" onclick="pg.clearTime()"><i class="fas fa-times"></i></div>
		</div>

		<div class="vSpace-30"></div>
		<button id="btn" class="primary" onclick="pg.done()">${gl('done')}</button>

	</div></div></div>
</div>
`,
	functions: {
		loadData: async () => {
			var currentPage = `${pg.thisPage.id}`;
			var announcement = await dat.db.saved.where({ rowId: pg.parameter }).first();
			if (pg.thisPage.id !== currentPage) return;
			if (announcement == null) {
				window.history.go(-1);
				return;
			}

			pg.getEl('title').value = announcement.data.title;
			pg.getEl('text').value = announcement.data.text;
			pg.getEl('date').setAttribute('data-date', announcement.data.date);
			pg.getEl('date').value = app.displayDate(announcement.data.date);
			if (announcement.data.time == null) {
				pg.getEl('time').value = '';
				pg.getEl('clearTimeBtn').setAttribute('data-active', false);
			}
			else {
				pg.getEl('time').value = announcement.data.time;
				pg.getEl('clearTimeBtn').setAttribute('data-active', true);
			}
		},
		done: async () => {
			var title = pg.getEl('title');
			var text = pg.getEl('text');
			var date = pg.getEl('date').getAttribute('data-date');
			if (pg.getEl('time').value === '') var time = null;
			else var time = pg.getEl('time').value;

			ui.btnLoading.on(pg.getEl('btn'));

			var data = {
				groupId: pg.groupId,
				type: 'announcement-new',
				title: title.value,
				text: text.value,
				date: date,
				time: time,
			};
			var success = gl('created');

			if (typeof pg.parameter === 'string') {
				data['announcementId'] = pg.parameter;
				data['type'] = 'announcement-edit';
				success = gl('saved');
			}

			dat.sync.groupRequest(data, () => {
				ui.float.success(success);
				window.history.go(-1);
			}, (connectionError) => {
				ui.btnLoading.off(pg.getEl('btn'));
				if (connectionError) ui.float.error(gl('connectionError', null, 'app'));
				else ui.float.error(gl('unexpectedError', data['type'], 'app'));
			});
		},
		datePicked: d => {
			//apply selected date to form
			if (d == null) return;
			var date = pg.getEl('date');
			date.value = app.displayDate(d);
			date.setAttribute('data-date', d);
		},
		clearTime: () => {
			pg.getEl('time').value = '';
			pg.getEl('clearTimeBtn').setAttribute('data-active', false);
		},
		timePicked: t => {
			//apply selected time to form
			if (t == null) return;
			pg.getEl('time').value = t;
			pg.getEl('clearTimeBtn').setAttribute('data-active', true);
		},
		attachment: {
			numLimit: 10,
			list: [],
			/*
			{
				type: 'image' | 'file', //future file
				base64: '',
			}
			*/
			listToElement: () => {
				var attachment = pg.attachment.list;
				console.log(attachment);

				pg.getEl('attachments').innerHTML = pg.formControl.attachmentBtn(attachment.length < pg.attachment.numLimit);
				var attachmentAddBtn = pg.thisPage.querySelector('#attachments > .btn');
				for (i in attachment) {
					if (attachment[i].type === 'image') {
						//add new el
						var el = document.createElement('div');
						el.setAttribute('onclick', `pg.attachment.option(this)`);
						el.innerHTML = `<i class="fas fa-image"></i>`;
						pg.getEl('attachments').insertBefore(el, attachmentAddBtn);
						//load to el
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
			option: async (targetEl) => {
				//find index
				var attachments = pg.thisPage.querySelectorAll('#attachments > div:not(.btn)');
				var index = 0;
				for (var i = 0; i < attachments.length; i++) {
					if (attachments[i] == targetEl) index = i;
				}
				console.log(`image at index ${index}`);

				var options = [];
				options.push({
					title: gl('viewImage'),
					icon: 'fas fa-eye',
					callBackParam: 'view',
				});
				options.push({
					title: gl('deleteImage'),
					icon: 'fas fa-trash',
					callBackParam: 'delete',
				});
				popUp.option(options, (action) => {
					if (typeof action !== 'string') return;
					if (action === 'view') {
						var url = targetEl.style.backgroundImage;
						url = url.substr(5);
						url = url.substr(0, url.length - 2);
						photoswipeController.show(url);
					}
					if (action === 'delete') {
						popUp.confirm(gl('deleteImageConfirm'), v => {
							if (!v) return;
							var targetEl = pg.thisPage.querySelectorAll('#attachments > div')[index];
							pg.getEl('attachments').removeChild(targetEl);
							pg.attachment.list.splice(index, 1);
						});
					}
				});
			},
		},
	},
	lang: {
		en: {
			createTitle: 'Create Announcement',
			editTitle: 'Edit Announcement',

			title: 'Title:',
			titlePlaceholder: 'Title...',

			text: 'Content:',
			textPlaceholder: 'You can write up to 500 character...',
			addAttachment: 'Add attachment',

			dateTime: 'Date &amp; time:',
			dateTimeHint: 'When this announcement will come in effect',
			timePlaceholder: 'Choose time (optional)',

			done: 'Save',
			created: 'New announcement created',
			saved: 'Changes are saved',
		},
		id: {
			createTitle: 'Buat Pengumuman',
			editTitle: 'Ubah Pengumuman',

			title: 'Judul:',
			titlePlaceholder: 'Judul pengumuman...',

			text: 'Isi:',
			textPlaceholder: 'Bisa sampai 500 karakter...',
			addAttachment: 'Tambah sisipan',

			dateTime: 'Waktu:',
			dateTimeHint: 'Kapan hal yang diumumkan akan berlaku',
			timePlaceholder: 'Pilih waktu (opsional)',

			done: 'Simpan',
			created: 'Pengumuman berhasil dibuat',
			saved: 'Perubahan tersimpan',
		},
	},
};