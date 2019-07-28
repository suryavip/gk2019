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
	root: 'cdvfile://localhost/persistent/',
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

	get: async (refPath, callBack) => {
		await firebaseAuth.waitStated();
		var ref = firebase.storage().ref(refPath);
		var localUpdateTime = localJSON.get(fss.shadowDir, refPath);

		if (localUpdateTime === 'blank') callBack.apply(this, [null]);
		else if (localUpdateTime != null) callBack.apply(this, [`${fss.root}${fss.shadowDir}/${refPath}?${new Date().getTime()}`]);

		var errorHandler = error => {
			console.error(error);
			callBack.apply(this, [null]);
			fss.delete(refPath, true);
		};

		var metadata, downloadURL;
		var whenBothCollected = () => {
			if (metadata == null || downloadURL == null) return;
			if (metadata.updated == localUpdateTime) return;

			fss.util.fileEntry(null, `${fss.shadowDir}/${refPath}`, true, (fileEntry) => {
				var oReq = new XMLHttpRequest();
				oReq.open('GET', downloadURL, true);
				oReq.responseType = 'blob';
				oReq.onload = (oEvent) => {
					var blob = oReq.response;
					if (blob) fss.util.writeFile(fileEntry, blob, () => {
						callBack.apply(this, [`${fss.root}${fss.shadowDir}/${refPath}?${new Date().getTime()}`]);
						localJSON.put(fss.shadowDir, refPath, metadata.updated);
						console.log(`download from fss complete: ${fileEntry.toURL()}`);
					});
					else console.error('we didnt get an XHR response!');
				};
				oReq.send(null);
			});
		};

		ref.getMetadata().then(m => {
			metadata = m;
			whenBothCollected();
		}).catch(errorHandler);
		ref.getDownloadURL().then(d => {
			downloadURL = d;
			whenBothCollected();
		}).catch(errorHandler);
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