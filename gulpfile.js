const gulp = require('gulp');
const browserSync = require('browser-sync').create();
const stylus = require('gulp-stylus');
const nib = require('nib');

// Static server
gulp.task('server', function() {
    browserSync.init({
        server: {
            baseDir: "./"
        },
        port: 9000
    });
    gulp.watch('css/*.styl', ['styles'])
    gulp.watch('./index.html', ['sync'])
});

gulp.task('sync', function() {
    browserSync.reload();
});

gulp.task('styles', function() {
    return gulp.src('css/*.styl')
        .pipe(stylus({ use: nib() }))
        .pipe(gulp.dest('./css/build/'))
        .pipe(browserSync.stream());
});

gulp.task('default', ['styles', 'server'])