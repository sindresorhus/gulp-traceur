'use strict';
var gutil = require('gulp-util');
var through = require('through2');
var applySourceMap = require('vinyl-sourcemaps-apply');
var objectAssign = require('object-assign');
var traceur = require('traceur');

module.exports = function (opts) {
	var compiler = new traceur.NodeCompiler(objectAssign({modules: 'commonjs'}, opts));

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
			var ret = compiler.compile(file.contents.toString(), file.relative, file.relative, file.base);
			var sourceMap = file.sourceMap && compiler.getSourceMap();

			if (ret) {
				file.contents = new Buffer(ret);
			}

			if (sourceMap) {
				applySourceMap(file, sourceMap);
			}

			this.push(file);
		} catch (errs) {
			this.emit('error', new gutil.PluginError('gulp-traceur', errs.join('\n'), {
				fileName: file.path,
				showStack: false
			}));
		}

		cb();
	});
};

module.exports.single = function(fileName, options) {
    options = options || {};

    var basePath;
    var files = {};

    function onFile(file, enc, next) {
        if (file.isNull())
            return next();

        if (!file.isBuffer())
            throw new Error('streaming not supported');

        basePath = basePath || file.base;
        files[file.path] = file;

        next();
    }

    function onFlush() {
        var elements = [];

        var loaderCompiler = new traceur.runtime.InlineLoaderCompiler(elements);

        var save = function() {
            var tree = loaderCompiler.toTree(basePath, elements);
            var compiler = new traceur.NodeCompiler({});
            var contents = compiler.write(tree, 'app.js');
            var sourceMap = compiler.getSourceMap();
            var file = new gutil.File({
                base: basePath,
                path: basePath + fileName,
                contents: new Buffer(contents),
                sourceMap: sourceMap
            });

            this.push(file);
            this.emit('end');
        }.bind(this);

        var fileLoader = {
            load: function(url, callback, errback) {
                if (!(url in files))
                    errback(new Error('file not found: '+url));

                callback(files[url].contents.toString('utf8'));
            }
        };

        var loader = new traceur.runtime.TraceurLoader(fileLoader, basePath, loaderCompiler);

        var loadOptions = {
            referrerName: undefined,
            metadata: { traceurOptions: options }
        };

        function appendEvaluateModule(name, referrerName) {
            var normalizedName = traceur.ModuleStore.normalize(name, referrerName);
            var moduleModule = traceur.codegeneration.module;
            var tree = moduleModule.createModuleEvaluationStatement(normalizedName);
            elements.push(tree);
        }

        function load(paths) {
            var path = paths.pop();
            if (!path)
                return save();

            var file = files[path];
            var name = file.path.replace(file.base, '').replace(/\.js$/, '');

            loader.import(name, loadOptions).then(function() {
                if (!options.modules || options.modules === 'register')
                    appendEvaluateModule(name, '');

                load(paths);
            });
        }

        load(Object.keys(files));
    }
    
    return through.obj(onFile, onFlush);
};

module.exports.RUNTIME_PATH = traceur.RUNTIME_PATH;
