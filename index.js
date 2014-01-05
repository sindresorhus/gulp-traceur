'use strict';
var path = require('path');
var gutil = require('gulp-util');
var map = require('map-stream');
var traceur = require('traceur');

module.exports = function (options) {
	return map(function (file, cb) {
		var ret;

		options = options || {};
		options.filename = path.basename(file.path);

		try {
			ret = traceur.compile(file.contents.toString(), options);
		} catch (err) {
			err.message = 'gulp-traceur: ' + err.message;
			return cb(err);
		}

		if (ret.errors.length > 0) {
			return cb(new Error(gutil.colors.red('\n' + ret.errors.map(function (el) {
				return 'gulp-traceur: ' + el;
			}).join('\n'))));
		}

		file.contents = new Buffer(ret.js);
		cb(null, file);
	});
};
