# [gulp](http://gulpjs.com)-traceur [![Build Status](https://travis-ci.org/sindresorhus/gulp-traceur.svg?branch=master)](https://travis-ci.org/sindresorhus/gulp-traceur)

> [Traceur](https://github.com/google/traceur-compiler) is a JavaScript.next to JavaScript-of-today compiler

*Issues with the output should be reported on the Traceur [issue tracker](https://github.com/google/traceur-compiler/issues).*


## Install

```bash
$ npm install --save-dev gulp-traceur
```


## Usage

```js
var gulp = require('gulp');
var traceur = require('gulp-traceur');

gulp.task('default', function () {
	return gulp.src('src/app.js')
		.pipe(traceur({sourceMap: true}))
		.pipe(gulp.dest('dist'));
});
```


## API

### traceur(options)

[Options](https://github.com/google/traceur-compiler/issues/584) are passed through to Traceur, except for `options.filename` which is set for you.

#### options

##### sourceMap

Type: `boolean`  
Default: `false`

##### modules

Type: `string`  
Default: `commonjs`  
Values: see [traceur `modules` option](https://github.com/google/traceur-compiler/wiki/Options-for-Compiling#options-for-modules)

By default, gulp-traceur treats all files as modules. This allows use of the `export`, `module` and `import` syntax. In this way the transformer can be used to compile ES6 for AMD or Node.js environments.

### traceur.RUNTIME_PATH

Absolute path to the Traceur runtime.js file.


## License

[MIT](http://opensource.org/licenses/MIT) © [Sindre Sorhus](http://sindresorhus.com)
