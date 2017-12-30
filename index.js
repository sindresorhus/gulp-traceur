'use strict';
const through = require('through2');
const applySourceMap = require('vinyl-sourcemaps-apply');
const traceur = require('traceur');
const PluginError = require('plugin-error');

module.exports = options => {
	return through.obj(function (file, enc, cb) {
		if (file.isNull()) {
			cb(null, file);
			return;
		}

		if (file.isStream()) {
			cb(new PluginError('gulp-traceur', 'Streaming not supported'));
			return;
		}

		options = Object.assign({
			modules: 'commonjs',
			inputSourceMap: file.sourceMap
		}, options);

		try {
			const compiler = new traceur.NodeCompiler(options);
			const ret = compiler.compile(file.contents.toString(), file.relative, file.relative, file.base);
			const sourceMap = file.sourceMap && compiler.getSourceMap();

			if (ret) {
				file.contents = Buffer.from(ret);
			}

			if (sourceMap) {
				applySourceMap(file, sourceMap);
			}

			this.push(file);
		} catch (err) {
			const msg = Array.isArray(err) ? err.join('\n') : err;
			this.emit('error', new PluginError('gulp-traceur', msg, {
				fileName: file.path,
				showStack: false
			}));
		}

		cb();
	});
};

module.exports.RUNTIME_PATH = traceur.RUNTIME_PATH;
