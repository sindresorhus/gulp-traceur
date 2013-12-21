'use strict';
var path = require('path');
var es = require('event-stream');
var gutil = require('gulp-util');
var traceur = require('traceur');

module.exports = function (options) {
	return es.map(function (file, cb) {
		options = options || {};
		options.filename = path.basename(file.path);

		var ret = traceur.compile(file.contents.toString(), options);

		if (ret.errors.length > 0) {
			return cb(new Error(gutil.colors.red('\n' + ret.errors.map(function (el) {
				return 'gulp-traceur: ' + el;
			}).join('\n'))));
		}

		file.contents = new Buffer(ret.js);
		cb(null, file);
	});
};
