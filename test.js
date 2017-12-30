/* eslint-env mocha */
'use strict';
const assert = require('assert');
const path = require('path');
const sourceMaps = require('gulp-sourcemaps');
const Vinyl = require('vinyl');
const traceur = require('.');

const fixtures = {
	'fixture.js': 'import {Foo} from \'./foo\';',
	'errored.js': 'cons x = 1;',
	'calc.js': 'import {a, b} from "util/constants";\nimport {add} from "calc/add";\nconsole.log(add(a, b));',
	'util/constants.js': 'export var a = 5;\nexport var b = 3;',
	'calc/add.js': 'export function add (...args) {\n\treturn args.reduce((sum, val) => sum + val, 0);\n};'
};

function getFixtureFile(name) {
	return new Vinyl({
		cwd: __dirname,
		base: path.join(__dirname, 'fixture' + name.substring(0, name.lastIndexOf('/'))),
		path: path.join(__dirname, 'fixture', name),
		contents: Buffer.from(fixtures[name])
	});
}

it('should transpile with Traceur', cb => {
	const stream = traceur({blockBinding: true});

	stream.on('data', file => {
		assert(/Foo/.test(file.contents.toString()));
		cb();
	});

	stream.write(getFixtureFile('fixture.js'));
});

it('should generate source maps', cb => {
	const init = sourceMaps.init();
	const write = sourceMaps.write();
	init
		.pipe(traceur())
		.pipe(write);

	write.on('data', file => {
		assert.equal(file.sourceMap.sources[0], 'fixture.js');
		const contents = file.contents.toString();
		assert(/function/.test(contents));
		assert(/sourceMappingURL=data:application\/json;charset=utf8;base64/.test(contents));
		assert.strictEqual((contents.match(/sourceMappingURL/g) || []).length, 1, 'should be one sourceMappingURL in the content');
		cb();
	});

	init.write(new Vinyl({
		cwd: __dirname,
		base: path.join(__dirname, 'fixture'),
		path: path.join(__dirname, 'fixture/fixture.js'),
		contents: Buffer.from('[].map(v => v + 1)'),
		sourceMap: ''
	}));

	init.end();
});

it('should pass syntax errors', cb => {
	const stream = traceur();

	stream.on('error', err => {
		assert(/Semi-colon expected/.test(err.message));
		cb();
	});

	stream.write(getFixtureFile('errored.js'));
});

it('should expose the Traceur runtime path', () => {
	assert(typeof traceur.RUNTIME_PATH === 'string');
	assert(traceur.RUNTIME_PATH.length > 0);
});

it('should keep folder in module names with cjs modules', cb => {
	// Cjs is default module implementation
	const stream = traceur();

	stream.on('data', file => {
		const content = file.contents.toString();
		const name = path.relative(path.join(__dirname, 'fixture'), file.path);
		switch (name) {
			case 'calc.js':
				assert(/require\("util\/constants"\)/.test(content), 'calc.js does not require constants');
				assert(/require\("calc\/add"\)/.test(content), 'calc.js does not require add');
				break;
			case path.join('util', 'constants.js'):
			case path.join('calc', 'add.js'):
				// Just check that files have right names
				break;
			default:
				cb(`unexpected compiled file: ${name}`);
		}
	});

	stream.on('end', cb);

	for (const name of ['calc.js', 'util/constants.js', 'calc/add.js']) {
		stream.write(getFixtureFile(name));
	}

	stream.end();
});

// TODO: update this test for latest Traceur
it.skip('should keep folder in module names with register modules', cb => {
	const stream = traceur({modules: 'register', moduleName: true});

	stream.on('data', file => {
		const content = file.contents.toString();
		const name = path.relative(path.join(__dirname, 'fixture'), file.path);
		let fileName;
		switch (name) {
			case 'calc.js':
				assert(/System\.get\("util\/constants"\)/.test(content), 'calc.js does not require constants');
				assert(/System\.get\("calc\/add"\)/.test(content), 'calc.js does not require add');
				break;
			case path.join('util', 'constants.js'):
			case path.join('calc', 'add.js'):
				fileName = file.relative.replace(new RegExp(`\\${path.sep}`, 'g'), '/').replace('.js', '');
				assert(new RegExp(`System\\.registerModule\\("${fileName}.js"`).test(content), `${fileName} does not contains its filename`);
				break;
			default:
				cb(`unexpected compiled file: ${file.relative}`);
		}
	});

	stream.on('end', cb);

	for (const name of ['calc.js', 'util/constants.js', 'calc/add.js']) {
		stream.write(getFixtureFile(name));
	}

	stream.end();
});
