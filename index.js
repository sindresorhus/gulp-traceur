'use strict';
var gutil = require('gulp-util');
var through = require('through2');
var applySourceMap = require('vinyl-sourcemaps-apply');
var objectAssign = require('object-assign');
var traceur = require('traceur');

module.exports = function (opts) {
	var
		mergedOptions = objectAssign({ 'modules': 'commonjs' }, opts),
		compiler,
		moduleNameGenerator;

	if (typeof mergedOptions.moduleName === 'function') {
		moduleNameGenerator = mergedOptions.moduleName;
		delete mergedOptions.moduleName;

	} else {
		compiler = new traceur.NodeCompiler(mergedOptions);
	}

	return through.obj(function (file, enc, cb) {
		if (file.isNull()) {
			cb(null, file);
			return;
		}

		if (file.isStream()) {
			cb(new gutil.PluginError('gulp-traceur', 'Streaming not supported'));
			return;
		}

		try {
			var ret;
			var sourceMap = file.sourceMap && compiler.getSourceMap();
			var sourceName = file.relative;

			if (moduleNameGenerator) {
				sourceName = moduleNameGenerator(file);
				compiler = new traceur.NodeCompiler(objectAssign({ 'moduleName': sourceName }, mergedOptions));
			}

			ret = compiler.compile(file.contents.toString(), sourceName, file.relative, file.base);

			if (ret) {
				file.contents = new Buffer(ret);
			}

			if (sourceMap) {
				applySourceMap(file, sourceMap);
			}

			this.push(file);

		} catch (errs) {
			this.emit('error', new gutil.PluginError('gulp-traceur', errs ? errs.join('\n') : 'An error occured', {
				fileName: file.path,
				showStack: false
			}));
		}

		cb();
	});
};

module.exports.RUNTIME_PATH = traceur.RUNTIME_PATH;
