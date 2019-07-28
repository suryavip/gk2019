var MembersOfGroup = {
	doManage: function (successMsg) {
		var param = this.param;
		vipLoading.add('manage');
		dat.sync.groupRequest({
			type: param.type,
			groupId: param.groupId,
			userId: param.userId,
		}, () => {
			vipLoading.remove('manage');
			ui.float.success(successMsg);
			if (param.callBack != null) param.callBack();
		}, (connectionError) => {
			vipLoading.remove('manage');
			if (connectionError) ui.float.error(gl('connectionError', null, 'app'));
			else ui.float.error(gl('unexpectedError', param.type, 'app'));
		});
	},
	manage: function (param) {
		//param: userId, type, callBack, name, byLevel (if admin-delete)
		this.param = param;
		var confirmMsg = gl(`${param.type}-confirm`, param.name, 'MembersOfGroup');
		var successMsg = gl(`${param.type}-success`, param.name, 'MembersOfGroup');

		if (param.userId === firebaseAuth.userId) {
			if (param.type === 'pending-delete') {
				confirmMsg = gl(`${param.type}-self-confirm`, null, 'MembersOfGroup');
				successMsg = gl(`${param.type}-self-success`, null, 'MembersOfGroup');
			}
			if (param.type === 'member-delete') {
				confirmMsg = gl(`${param.type}-self-confirm`, null, 'MembersOfGroup');
				successMsg = gl(`${param.type}-self-success`, null, 'MembersOfGroup');
			}
		}

		if (param.type === 'admin-delete') {
			if (param.byLevel['admin'].length === 1 && param.byLevel['member'].length > 0) {
				//need to set other member as admin first
				ui.popUp.alert(gl(`${param.type}-reject`, null, 'MembersOfGroup'));
				return;
			}
		}

		if (param.type === 'pending-new') {
			this.doManage(successMsg);
			return;
		}

		ui.popUp.confirm(confirmMsg, v => {
			if (!v) return;
			this.doManage(successMsg);
		});
	},
};

vipLanguage.lang['MembersOfGroup'] = {
	en: {
		'pending-new-success': `Join request sent`,

		'pending-delete-self-confirm': `Cancel join request?`,
		'pending-delete-self-success': `Join request canceled`,

		'pending-delete-confirm': p => `Reject ${p} from joining this group?`,
		'pending-delete-success': p => `${p} rejected from joining`,

		'member-new-confirm': p => `Accept ${p} to join this group?`,
		'member-new-success': p => `${p} is now a member`,

		'member-delete-confirm': p => `Remove ${p} from group?`,
		'member-delete-success': p => `${p} is removed from group`,

		'member-delete-self-confirm': 'Leave this group?',
		'member-delete-self-success': 'No longer in group',

		'admin-delete-confirm': 'Leave this group?',
		'admin-delete-success': 'No longer in group',
		'admin-delete-reject': 'Before leaving, please set another member as admin',

		'admin-new-confirm': p => `Set ${p} as admin?`,
		'admin-new-success': p => `${p} is now admin`,

		'admin-stop-confirm': 'Stop from being admin?',
		'admin-stop-success': 'You have stop from being admin',
	},
	id: {
		'pending-new-success': `Permintaan bergabung terkirim`,

		'pending-delete-self-confirm': `Batalkan permintaan bergabung?`,
		'pending-delete-self-success': `Permintaan bergabung dibatalkan`,

		'pending-delete-confirm': p => `Tolak ${p} untuk bergabung?`,
		'pending-delete-success': p => `${p} ditolak untuk bergabung`,

		'member-new-confirm': p => `Terima ${p} untuk bergabung?`,
		'member-new-success': p => `${p} telah menjadi anggota`,

		'member-delete-confirm': p => `Yakin ingin mengeluarkan ${p} dari grup?`,
		'member-delete-success': p => `${p} berhasil dikeluarkan dari grup`,

		'member-delete-self-confirm': 'Yakin ingin keluar dari grup ini?',
		'member-delete-self-success': 'Berhasil keluar dari grup',

		'admin-delete-confirm': 'Yakin ingin keluar dari grup ini?',
		'admin-delete-success': 'Berhasil keluar dari grup',
		'admin-delete-reject': 'Sebelum keluar, jadikan anggota lain sebagai admin',

		'admin-new-confirm': p => `Jadikan ${p} sebagai admin?`,
		'admin-new-success': p => `${p} berhasil dijadikan admin`,

		'admin-stop-confirm': 'Berhenti menjadi admin?',
		'admin-stop-success': 'Berhasil berhenti menjadi admin',
	},
};