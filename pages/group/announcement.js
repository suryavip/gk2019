window.addEventListener('vipPagingPGInit', ev => {
	if (ev.detail.pageId !== 'group') return;

	pg['announcement'] = {
		gl: (a, b) => gl(a, b, 'group-announcement'),
		empty: () => `<div class="aPadding-30" style="text-align:center">
			<h2>${pg.announcement.gl('empty')}</h2>
			<div class="vSpace-30"></div>
			<img src="illustrations/undraw_new_message_2gfk.svg" width="200px" />
			<div class="vSpace-30"></div>
			<p>${pg.announcement.gl('emptyHint')}</p>
		</div>`,
		load: (data) => {
			var announcements = data['announcements'];

			var out = [];
			for (i in announcements) {
				var a = announcements[i];
				var aTime = moment(`${a.data.date}${a.data.time != null ? ` ${a.data.time}` : ''}`);

				var attachment = [];
				for (at in a.data.attachment) {
					attachment.push(`<div class="attachment">
						<i class="fas fa-image"></i>
					</div>`);
				}
				if (a.data.attachment.length > 0) attachment = `<div class="vSpace-20"></div>
				<div class="horizontalOverflow vipGesture-prevent">${attachment.join('')}</div>`;
				else attachment = '';

				if (a.data.creator === firebaseAuth.userId) var deleteBtn = `<div onclick="pg.announcement.delete('${a.rowId}')"><i class="fas fa-trash"></i><p>${pg.announcement.gl('deleteBtn')}</p></div>`;
				else var deleteBtn = '';

				out.push(`<div class="container-20 highlightable" id="a${a.rowId}">
					<h1>${app.escapeHTML(a.data.title)}</h1>
					<h5>${app.displayDate(aTime, false, a.data.time != null)}</h5>
					<div class="vSpace-20"></div>
					<p>${app.escapeHTML(a.data.text)}</p>
					${attachment}
					<div class="vSpace-20"></div>
					<div class="bottomAction">
						<div class="space"></div>
						${deleteBtn}
						<div onclick="go('announcementForm', '${a.rowId}')"><i class="fas fa-pen"></i><p>${pg.announcement.gl('editBtn')}</p></div>
					</div>
				</div>`);
			}

			if (announcements.length === 0) pg.getEl('announcement').innerHTML = pg.announcement.empty();
			else pg.getEl('announcement').innerHTML = out.join('');
			photoLoader.autoLoad(pg.getEl('announcement'));
			ProfileResolver.fillData(pg.getEl('announcement'));
		},
		delete: (announcementId) => {
			ui.popUp.confirm(pg.announcement.gl('deleteConfirm'), a => {
				if (!a) return;
				var success = pg.announcement.gl('deleteSuccess'); // store because notif will be showed after this page is closed
				dat.sync.groupRequest({
					type: 'announcement-delete',
					announcementId: announcementId,
					groupId: pg.groupId,
				}, () => {
					ui.float.success(success);
				}, (connectionError) => {
					if (connectionError) ui.float.error(gl('connectionError', null, 'app'));
					else ui.float.error(gl('unexpectedError', 'announcement-delete', 'app'));
				});
			});
		},
	};

	vipLanguage.lang['group-announcement'] = {
		en: {
			empty: 'There is no announcement',
			emptyHint: 'Create new with + button',

			showMore: 'Show more...',
			showLess: 'Show less...',

			editBtn: 'Edit',
			deleteBtn: 'Delete',

			deleteConfirm: 'Delete this announcement?',
			deleteSuccess: 'Announcement deleted',
		},
		id: {
			empty: 'Tidak ada pengumuman',
			emptyHint: 'Buat menggunakan tombol +',

			showMore: 'Selengkapnya...',
			showLess: 'Ringkas...',

			editBtn: 'Ubah',
			deleteBtn: 'Hapus',

			deleteConfirm: 'Hapus pengumuman ini?',
			deleteSuccess: 'Pengumuman berhasil dihapus',
		},
	};

});