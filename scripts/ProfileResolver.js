var ProfileResolver = {
	emptyUser: {
		name: '...',
		school: null,
	},
	lastResolveOnline: 0,
	resolve: async function (userIds, callBack) {
		this.currentPage = `${pg.thisPage.id}`;

		//fill what cache able to offer
		var cache = localJSON.get('ProfileResolver');
		var fromCache = {};
		var notFullFilled = 0;
		for (i in userIds) {
			var userId = userIds[i];
			var user = cache[userId];
			if (user == null) {
				user = this.emptyUser;
				notFullFilled++;
			}
			fromCache[userId] = user;
		}
		if (this.currentPage !== pg.thisPage.id) return;
		callBack(fromCache);

		var now = new Date().getTime();
		if (notFullFilled < 1 && now - this.lastResolveOnline < 10000) {
			//no need to get from server. all user data has been fullfilled and last resolve is 10s ago
			console.log('no need to return profile from server');
			return;
		}

		//load online data
		var url = `${app.baseAPIAddress}/profiles?`;
		var args = []
		for (i in userIds) args.push(`userId=${userIds[i]}`);
		url += args.join('&');
		var f = await jsonFetch.doWithIdToken(url);

		this.lastResolveOnline = now;

		if (f.status === 200) {
			//fill what online result able to offer
			var fromOnline = {};
			for (i in userIds) {
				var userId = userIds[i];
				var user = f.b[userId];
				if (user == null) user = this.emptyUser;
				fromOnline[userId] = user;
				cache[userId] = user;
			}
			//save what online return to cache
			localJSON.reSet('ProfileResolver', cache);

			if (this.currentPage !== pg.thisPage.id) return;
			if (JSON.stringify(fromCache) === JSON.stringify(fromOnline)) return;
			callBack(fromOnline);
		}
		else {
			/*if (f.status === 'connectionError') {
				ui.float.error(gl('connectionError', null, 'app'));
			}
			else {
				ui.float.error(gl('unexpectedError', `${f.status}: ${f.b.code}`, 'app'));
			}*/
		}
	},
	fillData: function (scope) {
		//get what userIds needed
		if (scope == null) scope = pg.thisPage;
		var spaces = scope.querySelectorAll('[data-profile]');
		var userIds = [];
		for (var i = 0; i < spaces.length; i++) {
			var userId = spaces[i].getAttribute('data-profile');
			userIds.push(userId);
		}

		if (userIds.length < 1) return;

		this.resolve(userIds, users => {
			for (userId in users) {
				var user = users[userId];
				var target = scope.querySelectorAll(`[data-profile="${userId}"] [data-profileData]`);
				for (var i = 0; i < target.length; i++) {
					var col = target[i].getAttribute('data-profileData');
					var data = user[col];
					if (data == null) {
						if (col === 'school') target[i].classList.add('activable');
						continue;
					}
					target[i].textContent = data;
					if (col === 'school') target[i].classList.remove('activable');
				}
			}
		});
	},
};