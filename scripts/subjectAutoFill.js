var subjectAutoFill = {

	subjects: [],
	day: [],
	time: [],
	load: async function (owner, datalist) {
		var currentPage = `${pg.thisPage.id}`;
		var schedules = await dat.db.schedule.where({ owner: owner }).toArray();
		if (pg.thisPage.id !== currentPage) return;

		this.subjects = [];

		for (i in schedules) {
			for (ii in schedules[i].data) {
				var s = schedules[i].data[ii];
				var day = schedules[i].scheduleId[schedules[i].scheduleId.length - 1];
				var exists = this.subjects.indexOf(s.subject);
				if (exists < 0) {
					this.subjects.push(s.subject);
					this.day.push(day);
					this.time.push(s.time);
				}
				else {
					//manage recommended day and time to the nearest
					var tomorrow = moment().add(1, 'days').format('d');
					var oldDistance = this.day[exists] - tomorrow;
					var newDistance = day - tomorrow;
					if (oldDistance < 0) oldDistance += 7;
					if (newDistance < 0) newDistance += 7;
					if (newDistance < oldDistance) {
						this.day[exists] = day;
						this.time[exists] = s.time;
					}
				}
			}
		}

		var subjects = this.subjects.slice();
		subjects.sort();
		var out = '';
		for (i in subjects) out += `<option value="${app.escapeHTML(subjects[i])}">`;
		datalist.innerHTML = out;
	},
	getRecommendedDate: function (subject) {
		var index = this.subjects.indexOf(subject);
		if (index < 0) return undefined;
		var d = moment();
		d.add(1, 'days');
		while (d.format('d') != this.day[index]) d.add(1, 'days');
		return d;
	},
	getRecommendedTime: function (subject) {
		var index = this.subjects.indexOf(subject);
		if (index < 0) return undefined;
		return this.time[index];
	},
};