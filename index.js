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
			cb(null, file);
			return;
		}

		if (file.isStream()) {
			cb(new gutil.PluginError('gulp-traceur', 'Streaming not supported'));
			return;
		}

		var ret;

		var fileOptions = objectAssign({}, options);

		if (file.sourceMap) {
			fileOptions.sourceMaps = true;
		}

		try {
      var sourceName = path.relative(file.base, file.path);
			ret = traceur.compile(file.contents.toString(), fileOptions, sourceName);

			if (ret.js) {
				file.contents = new Buffer(ret.js);
			}

			if (ret.generatedSourceMap && file.sourceMap) {
				applySourceMap(file, ret.generatedSourceMap);
			}

			if (ret.errors.length > 0) {
				cb(new gutil.PluginError('gulp-traceur', '\n' + ret.errors.join('\n'), {
					fileName: file.path,
					showStack: false
				}));
			} else {
				cb(null, file);
			}
		} catch (err) {
			cb(new gutil.PluginError('gulp-traceur', err, {
				fileName: file.path
			}));
		}
	});
};

module.exports.RUNTIME_PATH = traceur.RUNTIME_PATH;
