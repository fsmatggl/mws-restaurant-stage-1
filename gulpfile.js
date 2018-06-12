var gulp = require('gulp');
var concat = require('gulp-concat');
var imagemin = require('gulp-imagemin');
var pngquant = require('imagemin-pngquant');
var uglify = require('gulp-uglify');
var babel = require('gulp-babel');
const webp = require('gulp-webp');

/* Add the new tasks `copy-image` and `copy-html` to the default taks */
gulp.task('default', ['copy-html', 'copy-images', 'scripts-dist'], function() {
    // gulp.watch('/index.html', ['copy-html']); // Keep the dist/index.html updated
});

gulp.task('copy-html', function() {
    gulp.src('*.html')
    .pipe(gulp.dest('./dist'));
});

gulp.task('copy-images', function() {
    gulp.src('img_sized/*')
    .pipe(imagemin({
        progressive: true,
        use: [pngquant()]
    }))
    .pipe(webp())
    .pipe(gulp.dest('dist/img'));
});

gulp.task('scripts-dist', function() {
    gulp.src('js/*.js')
    .pipe(babel())
    .pipe(concat('index.js'))
    .pipe(gulp.dest('dist/js'));
});

gulp.task('copy-lib', function() {
    gulp.src('js/lib/*.js')
    .pipe(gulp.dest('dist/js/lib'));
})