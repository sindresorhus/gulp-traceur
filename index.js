'use strict';
var gutil = require('gulp-util');
var through = require('through2');
var traceur = require('traceur');
var applySourceMap = require('vinyl-sourcemaps-apply');
var objectAssign = require('object-assign');

module.exports = function (options) {
	options = options || {};

	return through.obj(function (file, enc, cb) {
		if (file.isNull()) {
			this.push(file);
			cb();
			return;
		}

		if (file.isStream()) {
			this.emit('error', new gutil.PluginError('gulp-traceur', 'Streaming not supported'));
			cb();
			return;
		}

		var ret;

		var fileOptions = objectAssign({}, options);
		fileOptions.filename = file.relative;

		if (file.sourceMap) {
			fileOptions.sourceMaps = true;
		}

		try {
			ret = traceur.compile(file.contents.toString(), fileOptions);

			if (ret.js) {
				file.contents = new Buffer(ret.js);
			}

			if (ret.generatedSourceMap && file.sourceMap) {
				applySourceMap(file, ret.generatedSourceMap);
			}

			if (ret.errors.length > 0) {
				this.emit('error', new gutil.PluginError('gulp-traceur', '\n' + ret.errors.join('\n'), {
					fileName: file.path,
					showStack: false
				}));
			} else {
				this.push(file);
			}
		} catch (err) {
			this.emit('error', new gutil.PluginError('gulp-traceur', err, {
				fileName: file.path
			}));
		}

		cb();
	});
};

module.exports.RUNTIME_PATH = traceur.RUNTIME_PATH;
