'use strict';
var path = require('path');
var gutil = require('gulp-util');
var through = require('through2');
var traceur = require('traceur');

module.exports = function (options) {
    if(typeof(options) !== 'undefined' && typeof(options.module) !== 'undefined' && options.module === 'inline') {
        traceur.compiler.compileToSingleFile(options.out, options.includes, options.sourceMap);
        return through.obj(function (file, enc, cb) {});
    }

	return through.obj(function (file, enc, cb) {
		if (file.isNull()) {
			this.push(file);
			return cb();
		}

		if (file.isStream()) {
			this.emit('error', new gutil.PluginError('gulp-traceur', 'Streaming not supported'));
			return cb();
		}

		var ret;

		options = options || {};
		options.filename = path.basename(file.path);

		try {
			ret = traceur.compile(file.contents.toString(), options);

			if (ret.js) {
				if (ret.sourceMap) {
					ret.js += '\n//# sourceMappingURL=' + options.filename + '.map';
				}

				file.contents = new Buffer(ret.js);
			}

			if (ret.sourceMap) {
				this.push(new gutil.File({
					cwd: file.cwd,
					base: file.base,
					path: file.path + '.map',
					contents: new Buffer(ret.sourceMap)
				}));
			}
		} catch (err) {
			this.emit('error', new gutil.PluginError('gulp-traceur', err, {
				fileName: file.path
			}));
		}

		if (ret.errors.length > 0) {
			this.emit('error', new gutil.PluginError('gulp-traceur', '\n' + ret.errors.join('\n'), {
				fileName: file.path,
				showStack: false
			}));
		}

		this.push(file);
		cb();
	});
};

module.exports.RUNTIME_PATH = traceur.RUNTIME_PATH;
