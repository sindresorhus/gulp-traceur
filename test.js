'use strict';
var assert = require('assert');
var fs = require('fs');
var gutil = require('gulp-util');
var traceur = require('./index');
var path = require('path');

var fixtures = {
	'fixture.js': 'import {Foo} from \'./foo\';',
	'errored.js': 'cons x = 1;',
	'calc.js': 'import {a, b} from "util/constants";\nimport {add} from "calc/add";\nconsole.log(add(a, b));',
	'util/constants.js': 'export var a = 5;\nexport var b = 3;',
	'calc/add.js': 'export function add (...args) {\n\treturn args.reduce((sum, val) => sum + val, 0);\n};'
};

function getFixtureFile (name) {
	return new gutil.File({
		cwd: __dirname,
		base: __dirname + '/fixture' + name.substring(0, name.lastIndexOf('/')),
		path: __dirname + '/fixture/' + name,
		contents: new Buffer(fixtures[name])
	})
}

it('should transpile with Traceur', function (cb) {
	var stream = traceur({blockBinding: true});

	stream.on('data', function (file) {
		assert(/Foo/.test(file.contents.toString()));
		cb();
	});

	stream.write(getFixtureFile('fixture.js'));
});

it('should pass syntax errors', function (cb) {
	var stream = traceur();

	stream.on('error', function (err) {
		assert(/Semi-colon expected/.test(err.message));
		cb();
	});

	stream.write(getFixtureFile('errored.js'));
});

it('should expose the Traceur runtime path', function () {
	assert(typeof traceur.RUNTIME_PATH === 'string');
	assert(traceur.RUNTIME_PATH.length > 0);
});
<<<<<<< HEAD
=======
<<<<<<< HEAD
=======

it('should support Source Map', function (cb) {
	var stream = traceur({sourceMap: true});

	var name = 'fixture.js'
	stream.on('data', function (file) {
		if (/\.map$/.test(file.path)) {
			assert(/\"version":3/.test(file.contents.toString()));
			assert.equal(file.relative, name + '.map');
			return;
		}

		assert(new RegExp('sourceMappingURL=' + name + '\.map').test(file.contents.toString()));
		assert.equal(file.relative, name);
	})

	stream.on('end', cb);

	stream.write(getFixtureFile(name));

	stream.end();
});
>>>>>>> Use vynil's relative attribute as module filename

it('should keep folder in module names with cjs modules', function (cb) {
	// cjs is default module implementation
	var stream = traceur();

	stream.on('data', function (file) {
		var content = file.contents.toString();
		var name = path.relative(__dirname + '/fixture', file.path);
		switch (name) {
			case 'calc.js':
				assert(/require\("util\/constants"\)/.test(content), 'calc.js does not require constants');
				assert(/require\("calc\/add"\)/.test(content), 'calc.js does not require add');
				break;
			case path.join('util', 'constants.js'):
			case path.join('calc', 'add.js'):
				// just check that files have right names
				break;
			default:
				cb('unexpected compiled file: ' + name);
		}
	});

	stream.on('end', cb);

	['calc.js', 'util/constants.js', 'calc/add.js'].forEach(function (name) {
		stream.write(getFixtureFile(name));
	});

	stream.end();
});

it('should keep folder in module names with register modules', function (cb) {
	var stream = traceur({modules: 'register', moduleName: true});

	stream.on('data', function (file) {
		var content = file.contents.toString();
		var name = path.relative(__dirname + '/fixture', file.path);
		switch (name) {
			case 'calc.js':
				assert(/System\.get\("util\/constants"\)/.test(content), 'calc.js does not require constants');
				assert(/System\.get\("calc\/add"\)/.test(content), 'calc.js does not require add');
				break;
			case path.join('util', 'constants.js'):
			case path.join('calc', 'add.js'):
				var fileName = file.relative.replace(new RegExp('\\' + path.sep, 'g'), '/').replace('.js', '');
				assert(new RegExp('System\\.register\\("' + fileName + '"').test(content), fileName + ' does not contains its filename');
				break;
			default:
				cb('unexpected compiled file: ' + file.relative);
		}
	});

	stream.on('end', cb);

	['calc.js', 'util/constants.js', 'calc/add.js'].forEach(function (name) {
		stream.write(getFixtureFile(name));
	});

	stream.end();
});