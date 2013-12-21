'use strict';
var assert = require('assert');
var fs = require('fs');
var gutil = require('gulp-util');
var traceur = require('./index');

it('should transpile with Traceur', function (cb) {
	var stream = traceur({blockBinding: true});

	stream.on('data', function (data) {
		console.log(data.contents.toString())
		assert(/require\('\.\/foo'\)\.Foo/.test(data.contents.toString()));
		cb();
	});

	stream.write(new gutil.File({contents: 'import {Foo} from \'./foo\';'}));
});
