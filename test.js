'use strict';
var assert = require('assert');
var fs = require('fs');
var gutil = require('gulp-util');
var traceur = require('./index');

it('should transpile with Traceur', function (cb) {
	var stream = traceur({blockBinding: true});

	stream.on('data', function (file) {
		assert(/require\('\.\/foo'\)\.Foo/.test(file.contents.toString()));
		cb();
	});

	stream.write(new gutil.File({
		contents: new Buffer('import {Foo} from \'./foo\';')
	}));
});

it('should pass syntax errors', function (cb) {
	var stream = traceur();

	stream.on('error', function (err) {
		assert(/Semi-colon expected/.test(err.message));
		cb();
	});

	stream.write(new gutil.File({
		contents: new Buffer('cons x = 1;')
	}));
});

it('should expose the Traceur runtime path', function () {
	assert(typeof traceur.RUNTIME_PATH === 'string');
	assert(traceur.RUNTIME_PATH.length > 0);
});

it('should support Source Map', function (cb) {
	var stream = traceur({sourceMap: true});

	stream.on('data', function (file) {
		if (/\.map$/.test(file.path)) {
			assert(/\"version":3/.test(file.contents.toString()));
			assert.equal(file.relative, 'fixture.js.map');
			return;
		}

		assert.equal(file.relative, 'fixture.js');
	})

	stream.on('end', cb);

	stream.write(new gutil.File({
		path: __dirname + '/fixture.js',
		contents: new Buffer('import {Foo} from \'./foo\';')
	}));

	stream.end();
});

it('should have nested dirs in module name', function (cb) {
	var stream = traceur({blockBinding: true});

	stream.on('data', function (file) {
		assert(file.contents.toString().indexOf('var __moduleName = "foo/bar/baz";') !== -1);
		cb();
	});

	stream.write(new gutil.File({
		path: __dirname + '/foo/bar/baz.js',
		contents: new Buffer('import {Foo} from \'./foo\';')
	}));
});

it('should not have nested dirs in module name', function (cb) {
	var stream = traceur({
			cwd: __dirname + '/foo/bar',
			blockBinding: true
		});

	stream.on('data', function (file) {
		assert(file.contents.toString().indexOf('var __moduleName = "baz";') !== -1);
		cb();
	});

	stream.write(new gutil.File({
		path: __dirname + '/foo/bar/baz.js',
		contents: new Buffer('import {Foo} from \'./foo\';')
	}));
});