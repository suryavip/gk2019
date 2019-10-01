if (typeof ui === 'undefined') var ui = {};
ui.popUp = {

	option: function (options, callBack) {
		var id = vipPaging.popUp.show('option', (id, options) => {
			var out = `<div>`;
			for (var i = 0; i < options.length; i++) {
				//callBack param is string. use JSON.stringify if you want to send object/array
				out += `<div class="list feedback" onclick="vipPaging.popUp.close('${options[i].callBackParam}')">`;

				if (options[i].photo != null) out += `<div class="photo"><div data-photoRefPath="${options[i].photo}"><i class="fas fa-user"></i></div></div>`;

				if (options[i].icon != null) out += `<div class="icon"><i class="${options[i].icon}"></i></div>`;

				out += `<div class="content"><h4>${options[i].title}</h4></div>`;
				out += `</div>`;
			}
			out += `</div>`;
			return out;
		}, options, callBack);
		photoLoader.autoLoad(document.querySelector(`#vipPaging-popUp-${id}`));
	},
	confirm: function (message, callBack) {
		vipPaging.popUp.show('confirm', (id, message) => {
			return `<div>
			<div class="vSpace-10"></div>
			<h4>${message}</h4>
			<div class="vSpace-30"></div>
			<div class="table dual-10">
				<div><button onclick="window.history.go(-1)">${gl('cancel', null, 'ui-popUp')}</button></div>
				<div><button onclick="vipPaging.popUp.close(true)" class="primary">${gl('ok', null, 'ui-popUp')}</button></div>
			</div>
		</div>`;
		}, message, callBack);
	},
	alert: function (message, callBack) {
		vipPaging.popUp.show('alert', (id, message) => {
			return `<div>
			<div class="vSpace-10"></div>
			<h4>${message}</h4>
			<div class="vSpace-30"></div>
			<button onclick="window.history.go(-1)" class="primary">${gl('ok', null, 'ui-popUp')}</button>
		</div>`;
		}, message, callBack);
	},
	prompt: function (message, inputDetails, afterBuild, callBack) {
		var inputAttr = [];
		for (var i in inputDetails) {
			inputAttr.push(`${i}="${inputDetails[i]}"`);
		}
		var id = vipPaging.popUp.show('prompt', (id, p) => {
			return `<div>
			<div class="inputLabel">${p.message}</div>
			<input ${p.inputAttr.join(' ')}/>
			<div class="vSpace-20"></div>
			<div class="table dual-10">
				<div><button onclick="window.history.go(-1)">${gl('cancel', null, 'ui-popUp')}</button></div>
				<div><button onclick="vipPaging.popUp.close(document.querySelector('#vipPaging-popUp-${id} input').value)" class="primary">${gl('ok', null, 'ui-popUp')}</button></div>
			</div>
		</div>`;
		}, { message: message, inputAttr: inputAttr }, callBack);
		var theInput = document.querySelector(`#vipPaging-popUp-${id} input`);
		theInput.focus();
		theInput.select();
		app.listenForEnterKey([theInput], () => {
			vipPaging.popUp.close(theInput.value);
		});
		if (afterBuild != null) afterBuild(theInput);
	},

	date: {
		selected: null,
		month: null,
		id: null,
		picker: function (selectedDate, callBack) {
			//selectedDate format is everything that can be put into moment()
			//string YYYY-MM-DD
			//integer for timestamp
			//null for default
			//callback will bring result as first param. result is YYYY-MM-DD string
			if (selectedDate === null) selectedDate = undefined;
			else if (!isNaN(selectedDate)) selectedDate = parseInt(selectedDate);
			this.selected = moment(selectedDate);
			this.month = moment(selectedDate);

			this.id = vipPaging.popUp.show('datePicker', () => ``, null, callBack, true);
			this.generate();
		},
		generate: function (adjustment) {
			if (typeof adjustment === 'number') this.month.add(adjustment, 'months');

			if (this.month.year() === moment().year()) var monthDisplay = this.month.format('MMMM');
			else var monthDisplay = this.month.format('MMMM YYYY');

			var dayName = gl('dayName', null, 'ui-popUp');
			var head = `<div class="calendarRow dayName"><div>${dayName.join('</div><div>').toUpperCase()}</div></div>`;

			var body = '';
			var d = moment(this.month);
			d.set('date', 1);
			var thisMonth = d.month();
			var today = moment().format('YYYY-MM-DD');
			while (d.day() > 0) d.subtract(1, 'days');
			for (var row = 0; row < 6; row++) {
				body += `<div class="calendarRow">`;
				for (var col = 0; col < 7; col++) {
					body += `<div onclick="vipPaging.popUp.close('${d.format('YYYY-MM-DD')}')"><div`;
					if (this.selected.format('YYYY-MM-DD') === d.format('YYYY-MM-DD')) body += ` class="selected"`;
					else if (today === d.format('YYYY-MM-DD')) body += ` class="today"`;
					if (d.month() !== thisMonth) body += ` style="opacity:.5"`;
					body += `>${d.date()}</div></div>`;
					d.add(1, 'days');
				}
				body += `</div>`
			}

			document.querySelector(`#vipPaging-popUp-${this.id}`).innerHTML = `<div>
				<div class="calendarHead">
					<div onclick="ui.popUp.date.generate(-1)"><i class="fas fa-chevron-left"></i></div>
					<div class="title"><h3>${monthDisplay}</h3></div>
					<div onclick="ui.popUp.date.generate(1)"><i class="fas fa-chevron-right"></i></div>
				</div>
				${head}${body}
				<div class="aPadding-10">
					<button onclick="window.history.go(-1)" class="neutral">${gl('cancel', null, 'ui-popUp')}</button>
				</div>
			</div>`;
		},
	},

	timePicker: function (initialValue, callBack) {
		//accepted initialValue is in HH:mm string format
		if (initialValue == null || moment(initialValue, 'HH:mm').format('HH:mm') !== initialValue) initialValue = moment().format('HH:00');
		initialValue = initialValue.split(':');

		var initH = [];
		var initM = [];
		for (var i = -2; i <= 2; i++) {
			var h = parseInt(initialValue[0]) + i;
			if (h < 0) h += 24;
			else if (h >= 24) h -= 24;
			if (h < 10) h = `0${h}`;
			initH.push(`<div>${h}</div>`);

			var m = parseInt(initialValue[1]) + i;
			if (m < 0) m += 60;
			else if (m >= 60) m -= 60;
			if (m < 10) m = `0${m}`;
			initM.push(`<div>${m}</div>`);
		}

		var id = vipPaging.popUp.show('timePicker', (id, p) => {
			return `<div>
				<div class="timePickerScroll">
					<div><div class="hourScroll">${p.initH.join('')}</div></div>
					<div><h1>:</h1></div>
					<div><div class="minuteScroll">${p.initM.join('')}</div></div>
				</div>
				<div class="vSpace-20"></div>
				<div class="table dual-10">
					<div><button onclick="window.history.go(-1)">${gl('cancel', null, 'ui-popUp')}</button></div>
					<div><button onclick="
					vipPaging.popUp.close([
						document.querySelector('#vipPaging-popUp-${id} .hourScroll > div:nth-child(3)').textContent,
						document.querySelector('#vipPaging-popUp-${id} .minuteScroll > div:nth-child(3)').textContent
					].join(':'))" class="primary">${gl('ok', null, 'ui-popUp')}</button></div>
				</div>
			</div>`;
		}, { initH: initH, initM: initM }, callBack);
		var hourScroll = document.querySelector(`#vipPaging-popUp-${id} .hourScroll`);
		var minuteScroll = document.querySelector(`#vipPaging-popUp-${id} .minuteScroll`);
		this.timePickerScroller(hourScroll, 'h');
		this.timePickerScroller(minuteScroll, 'm');
	},
	timePickerScroller: function (el, mode) {
		var startY;
		var mouseStarted = false;

		var step = function (direction) {
			if (direction == -1) var curVal = parseInt(el.firstElementChild.textContent);
			else if (direction == 1) var curVal = parseInt(el.lastElementChild.textContent);

			var newVal = curVal + direction;
			upperLimit = mode === 'h' ? 24 : 60;
			if (newVal < 0) newVal += upperLimit;
			else if (newVal >= upperLimit) newVal -= upperLimit;
			if (newVal < 10) newVal = `0${newVal}`;

			var newNum = document.createElement('div');
			newNum.textContent = newVal;

			if (direction == -1) {
				el.removeChild(el.lastElementChild);
				el.insertBefore(newNum, el.firstElementChild);
			}
			else if (direction == 1) {
				el.removeChild(el.firstElementChild);
				el.appendChild(newNum);
			}
			vipTransitor.setTransform({
				element: el,
				value: `translate3d(0, 0, 0)`,
			});
		};

		var touchstart = function (e) {
			startY = e.changedTouches[0].pageY;
		};

		var touchmove = function (e) {
			var distanceY = e.changedTouches[0].pageY - startY;

			if (distanceY >= 40) {
				step(-1);
				startY += distanceY;
			}
			else if (distanceY <= -40) {
				step(1);
				startY += distanceY;
			}
			else {
				vipTransitor.setTransform({
					element: el,
					value: `translate3d(0, ${distanceY}px, 0)`,
				});
			}
		};

		var touchend = function (e) {
			var distanceY = e.changedTouches[0].pageY - startY;
			if (distanceY < -20) {
				step(1);
			}
			else {
				vipTransitor.setTransform({
					element: el,
					value: `translate3d(0, 0, 0)`,
				});
			}
		};

		el.addEventListener('touchstart', touchstart, { passive: true });
		el.addEventListener('touchmove', touchmove, { passive: true });
		el.addEventListener('touchend', touchend, { passive: true });

		el.addEventListener('mousedown', e => {
			mouseStarted = true;
			touchstart({ changedTouches: [{ pageY: e.clientY }] });
		}, { passive: true });
		window.addEventListener('mousemove', e => {
			if (!mouseStarted) return;
			touchmove({ changedTouches: [{ pageY: e.clientY }] });
		}, { passive: true });
		window.addEventListener('mouseup', e => {
			if (!mouseStarted) return;
			touchend({ changedTouches: [{ pageY: e.clientY }] });
			mouseStarted = false;
		}, { passive: true });

		el.addEventListener('wheel', e => { step(Math.sign(e.deltaY)); }, { passive: true });
	},

};
window.addEventListener('vipLanguageInit', () => {
	vipLanguage.lang['ui-popUp'] = {
		en: {
			cancel: 'Cancel',
			ok: 'Okay',
			dayName: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
		},
		id: {
			cancel: 'Batal',
			ok: 'Oke',
			dayName: ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'],
		},
	};
});