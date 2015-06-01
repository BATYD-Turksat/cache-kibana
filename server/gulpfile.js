var gulp = require('gulp');
var jshint = require('gulp-jshint');
var browserify = require('gulp-browserify');
var minifyJS   = require('gulp-uglify');
var minifyCSS  = require('gulp-minify-css');

gulp.task('jshint', function () {
    gulp.src('./app/**/*.js')
        .pipe(jshint())
        .pipe(jshint.reporter('default'));
});

// Browserify
gulp.task('jsbuild', function() {
    gulp.src('./app/fe/control/token.js')
        .pipe(browserify({
            insertGlobals : true,
            debug : !gulp.env.production
        }))
        .pipe(gulp.dest('./../src/vendor/browserify/build'))
});

gulp.task('watch', function () {
    gulp.watch('./app/**/*.js', ['jshint']);
    gulp.watch('./app/fe/control/**/*.js', ['jsbuild']);
});

gulp.task('minifyJS', function() {
    gulp.src('./../src/vendor/browserify/build/*.js')
        .pipe(minifyJS())
        .pipe(gulp.dest('./../src/vendor/browserify/build'));
});

gulp.task('minifyCSS', function() {
    gulp.src('./../src/vendor/browserify/build/*.css')
        .pipe(minifyCSS())
        .pipe(gulp.dest('./../src/vendor/browserify/build'));
});

gulp.task('build',
    ['jsbuild']);

gulp.task('product', ['minifyJS', 'minifyCSS']);