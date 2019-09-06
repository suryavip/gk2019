//copy storage and data for faster and offline start
window.addEventListener('firebase-signout', () => {
	localJSON.drop(fss.shadowDir);
	//clean all shadow
	window.resolveLocalFileSystemURL(fss.root, dir => {
		dir.getDirectory(fss.shadowDir, { create: false }, fileEntry => {
			fileEntry.removeRecursively(() => {
				console.log('remove shadow storage folder success');
			}, () => {
				console.error('remove shadow storage folder failed');
			});
		}, () => { });
	});
});

var fss = {
	root: 'cdvfile://localhost/temporary/',
	shadowDir: 'fss',

	util: {
		root: (success) => { window.resolveLocalFileSystemURL(fss.root, success); },
		cdBasic: (parent, targetDir, success) => {
			if (parent == null) fss.util.root((parent) => {
				parent.getDirectory(targetDir, { create: true, exclusive: false }, success);
			});
			else parent.getDirectory(targetDir, { create: true, exclusive: false }, success);
		},
		cd: (parent, targetDir, success) => {
			var split = targetDir.split('/');
			var i = 0;
			var last = split.length - 1;
			var nParent = parent;
			var nDir = split[i];
			var loop = () => {
				fss.util.cdBasic(nParent, nDir, (dir) => {
					if (last === i) {
						success(dir);
						return;
					}
					i++;
					nParent = dir;
					nDir = split[i];
					loop();
				});
			};
			loop();
		},
		fileEntry: (parent, path, create, success) => {
			var split = path.split('/');
			var fileName = split[split.length - 1];
			split.pop(); //removing file part
			fss.util.cd(parent, split.join('/'), (dir) => {
				dir.getFile(fileName, { create: create, exclusive: false }, success, (err) => {
					console.error(err);
				});
			});
		},
		writeFile: (fileEntry, dataObj, success) => {
			fileEntry.createWriter((fileWriter) => {
				fileWriter.onwriteend = success;
				fileWriter.write(dataObj);
			});
		},
	},

	get: async (refPath, callBack, dontReturnFailedLocal) => {
		//return and test local
		var localUrl = `${fss.root}${fss.shadowDir}/${refPath}?${new Date().getTime()}`;
		var localTest = document.createElement('img');
		localTest.onload = () => { callBack.apply(this, [localUrl]); };
		localTest.onerror = () => {
			if (dontReturnFailedLocal !== true) callBack.apply(this, [null]);
		};
		localTest.src = localUrl;

		//return and test online
		await firebaseAuth.waitStated();
		var url = `${app.baseAPIAddress}/storage/${refPath}?r=${firebaseAuth.userId}&d=${new Date().getTime()}`;

		try {
			var r = await fetch(url);
		}
		catch (err) {
			//connection error. just fine with local result
			return;
		}

		if (r.status === 404) {
			//check headers. if application/json and contain {"code": "not found"}: return null and delete local
			//else, just false 404
			if (r.headers.get('Content-Type') === 'application/json') try {
				var b = await r.json();
				if (b.code === 'not found') {
					console.log('FSS: requested image from server resulted NOT FOUND');
					callBack.apply(this, [null]);
					fss.delete(refPath, true);
					return;
				}
			}
			catch { }
			console.log('FSS: requested image from server resulted unexpected/false 404');
			return;
		}
		else if (r.status !== 200) {
			//server error (maybe?). just fine with local result
			return;
		}

		var localLastModified = localJSON.get(fss.shadowDir, refPath);
		var serverLastModified = r.headers.get('Last-Modified');
		if (localLastModified !== serverLastModified) {
			//newer image on server. return url and update local
			//callBack.apply(this, [url]);
			//update local
			var blob = await r.blob();
			fss.util.fileEntry(null, `${fss.shadowDir}/${refPath}`, true, (fileEntry) => {
				if (blob) fss.util.writeFile(fileEntry, blob, () => {
					callBack.apply(this, [`${fss.root}${fss.shadowDir}/${refPath}?${new Date().getTime()}`]);
					localJSON.put(fss.shadowDir, refPath, serverLastModified);
					console.log(`download from fss complete: ${fileEntry.toURL()}`);
				});
				else console.error('we didnt get an XHR response!');
			});
		}
			
	},

	delete: (refPath, setBlank) => {
		if (setBlank) localJSON.put(fss.shadowDir, refPath, 'blank');
		else localJSON.delete(fss.shadowDir, refPath);
		window.resolveLocalFileSystemURL(`${fss.root}${fss.shadowDir}`, (dir) => {
			dir.getFile(refPath, {create: false}, (fileEntry) => {
				fileEntry.remove(() => {
					console.log(`${refPath} removed from local (storage)`);
				}, () => {
					console.error(`${refPath} failed to remove from local (storage)`);
				}, () => {
					// The file doesn't exist
				});
			});
		});
	},
};