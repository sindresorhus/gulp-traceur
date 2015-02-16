'use strict';
var assert = require('assert');
var gutil = require('gulp-util');
var path = require('path');
var sourceMaps = require('gulp-sourcemaps');
var traceur = require('./');

var fixtures = {
	'fixture.js': 'import {Foo} from \'./foo\';',
	'errored.js': 'cons x = 1;',
	'calc.js': 'import {a, b} from "util/constants";\nimport {add} from "calc/add";\nconsole.log(add(a, b));',
	'util/constants.js': 'export var a = 5;\nexport var b = 3;',
	'calc/add.js': 'export function add (...args) {\n\treturn args.reduce((sum, val) => sum + val, 0);\n};'
};

var fixturesModules = {
	'calc.js': 'import {a, b} from "app/fixture/util/constants";\nimport {add} from "app/fixture/calc/add";\nconsole.log(add(a, b));',
	'util/constants.js': 'export var a = 5;\nexport var b = 3;',
	'calc/add.js': 'export function add (...args) {\n\treturn args.reduce((sum, val) => sum + val, 0);\n};'
};

function getFixtureFile (name) {
	return new gutil.File({
		cwd: __dirname,
		base: __dirname + '/fixture' + name.substring(0, name.lastIndexOf('/')),
		path: __dirname + '/fixture/' + name,
		contents: new Buffer(fixtures[name])
	});
}

function getFixtureFileForModule (name) {
	return new gutil.File({
		cwd: __dirname,
		base: __dirname + '/fixture' + name.substring(0, name.lastIndexOf('/')),
		path: __dirname + '/fixture/' + name,
		contents: new Buffer(fixturesModules[name])
	});
}

it('should transpile with Traceur', function (cb) {
	var stream = traceur({blockBinding: true});

	stream.on('data', function (file) {
		assert(/Foo/.test(file.contents.toString()));
		cb();
	});

	stream.write(getFixtureFile('fixture.js'));
});

it('should generate source maps', function (cb) {
	var init = sourceMaps.init();
	var write = sourceMaps.write();
	init
		.pipe(traceur())
		.pipe(write);

	write.on('data', function (file) {
		assert.equal(file.sourceMap.sources[0], 'fixture.js');
		var contents = file.contents.toString();
		assert(/function/.test(contents));
		assert(/sourceMappingURL=data:application\/json;base64/.test(contents));
		assert.strictEqual((contents.match(/sourceMappingURL/g) || []).length, 1, 'should be one sourceMappingURL in the content');
		cb();
	});

	init.write(new gutil.File({
		cwd: __dirname,
		base: __dirname + '/fixture',
		path: __dirname + '/fixture/fixture.js',
		contents: new Buffer('[].map(v => v + 1)'),
		sourceMap: ''
	}));

	init.end();
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
				assert(new RegExp('System\\.registerModule\\("' + fileName + '.js"').test(content), fileName + ' does not contains its filename');
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

it('should use the module name function to register modules', function (cb) {
	var stream = traceur({ 'experimental': true, 'modules': 'instantiate', 'moduleName': function (file) {
		var relativePath = path.normalize(path.relative(__dirname, file.path));
		return 'app' + path.sep + relativePath.substr(0, relativePath.length - 3);
	}});

	stream.on('data', function (file) {
		var content = file.contents.toString();

		switch (path.basename(file.path)) {
			case 'calc.js':
				assert(/System\.register\("app\/fixture\/calc"/.test(content), 'calc.js have to be registered !');
				break;
			case 'constants.js':
				assert(/System\.register\("app\/fixture\/util\/constants"/.test(content), 'constants.js have to be registered !');
				break;
			case 'add.js':
				assert(/System\.register\("app\/fixture\/calc\/add"/.test(content), 'add.js have to be registered !');
				break;
			default:
				cb('unexpected compiled file: ' + file.relative);
		}
	});

	stream.on('end', cb);

	['calc.js', 'util/constants.js', 'calc/add.js'].forEach(function (name) {
		stream.write(getFixtureFileForModule(name));
	});

	stream.end();
});
