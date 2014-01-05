'use strict';
var assert = require('assert');
var fs = require('fs');
var gutil = require('gulp-util');
var traceur = require('./index');

it('should transpile with Traceur', function (cb) {
	var stream = traceur({blockBinding: true});

	stream.on('data', function (data) {
		assert(/require\('\.\/foo'\)\.Foo/.test(data.contents.toString()));
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
