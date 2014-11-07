'use strict';
var gutil = require('gulp-util');
var through = require('through2');
var traceur = require('traceur');
var traceurNodeApi = require('traceur/src/node/api');
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

		var fileOptions = objectAssign({ modules: 'commonjs' }, options);

		if (file.sourceMap) {
			fileOptions.sourceMaps = true;
		}

		try {
			var compiler = new traceurNodeApi.NodeCompiler(fileOptions);
			var ret = compiler.compile(file.contents.toString(), file.relative, file.relative, file.base);
			var generatedSourceMap = compiler.getSourceMap();

			if (ret) {
				file.contents = new Buffer(ret);
			}

			if (generatedSourceMap && file.sourceMap) {
				applySourceMap(file, generatedSourceMap);
			}

			cb(null, file);
		} catch (e) {
			cb(new gutil.PluginError('gulp-traceur', String(e), {
				fileName: file.path,
				showStack: false
			}));
		}
	});
};

module.exports.RUNTIME_PATH = traceur.RUNTIME_PATH;
