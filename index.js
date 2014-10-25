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

		var contents, compiler, generator, parser, ret, source, sourceMapConfig, tree;

		var fileOptions = objectAssign({ modules: 'commonjs' }, options);
		fileOptions.filename = file.relative;

		var sourceName = undefined;
		if (options.moduleName === true) {
			sourceName = fileOptions.filename;
		}

		try {
			compiler = new traceur.Compiler(fileOptions);

			try {
				contents = file.contents.toString();
				ret = compiler.compile(contents, sourceName);
				file.contents = new Buffer(ret);

				if (options.sourceMaps === true) {
					source = new traceur.syntax.SourceFile(fileOptions.filename, contents);
					parser = new traceur.syntax.Parser(source);
					tree = parser.parseModule();
					tree.moduleName = fileOptions.filename;
					sourceMapConfig = {file: fileOptions.filename};
					generator = new traceur.outputgeneration.SourceMapGenerator(sourceMapConfig);
					sourceMapConfig = {sourceMapGenerator: generator};
					traceur.outputgeneration.TreeWriter.write(tree, sourceMapConfig, fileOptions.filename);
					applySourceMap(file, sourceMapConfig.generatedSourceMap);
				}

				cb(null, file);
			} catch (e) {
				cb(new gutil.PluginError('gulp-traceur', String(e), {
					fileName: file.path,
					showStack: false
				}));
			}
		} catch (err) {
			cb(new gutil.PluginError('gulp-traceur', err, {
				fileName: file.path
			}));
		}
	});
};

module.exports.RUNTIME_PATH = traceur.RUNTIME_PATH;
