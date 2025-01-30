import gulp from 'gulp';
const { src, dest, series, parallel, watch } = gulp;

import clean from 'gulp-clean';
import plumber from 'gulp-plumber';
import notify from 'gulp-notify';
import changed from 'gulp-changed';
import browserSync from 'browser-sync';

// HTML
import pug from 'gulp-pug';
import htmlmin from 'gulp-htmlmin';

// CSS
import gulpSass from 'gulp-sass';
import * as sass from 'sass';
const sassCompiler = gulpSass(sass);
import sourceMaps from 'gulp-sourcemaps';
import autoprefixer from 'gulp-autoprefixer';
import sassGlob from 'gulp-sass-glob';
import webpCSS from 'gulp-webp-css';
import groupMedia from 'gulp-group-css-media-queries';
import mincss from 'gulp-csso';

// JS
import terser from 'gulp-terser';

// IMAGES
import webp from 'gulp-webp';

const bs = browserSync.create();

function cleanDist() {
  return src('./dist', { read: false, allowEmpty: true })
    .pipe(clean());
}

const plumberNotify = (title) => {
  return {
    errorHandler: notify.onError({
      title: title,
      message: 'Error: <%= error.message %>',
      sound: false,
    }),
  };
};

function compilePug() {
  return src([
    './src/pug/*.pug',
    '!./src/pug/components/**/*.pug',
    '!./src/pug/layouts/**/*.pug'
  ])
    .pipe(plumber(plumberNotify('PUG')))
    .pipe(pug())
    .pipe(htmlmin({ collapseWhitespace: true, removeComments: true }))
    .pipe(dest('./dist'))
    .pipe(bs.stream());
}

function scss(done) {
  return src('src/scss/styles.scss', { allowEmpty: true })
    .pipe(plumber(plumberNotify('SCSS')))
    .pipe(sourceMaps.init())
    .pipe(sassGlob())
    .pipe(sassCompiler().on('error', sassCompiler.logError))
    .pipe(autoprefixer())
    .pipe(webpCSS())
    .pipe(groupMedia())
    .pipe(mincss())
    .pipe(sourceMaps.write('.'))
    .pipe(dest('dist/css'))
    .pipe(bs.stream())
    .on('end', done);
}

function js() {
  return src('./src/js/**/*.js')
    .pipe(plumber(plumberNotify('JS')))
    .pipe(terser())
    .pipe(dest('./dist/js'))
    .pipe(bs.stream());
}

function images() {
  return src('src/images/**/*', { encoding: false })
    .pipe(changed('dist/images'))
    .pipe(webp())
    .pipe(dest('dist/images'))
    .pipe(src('src/images/**/*', { encoding: false }))
    .pipe(dest('dist/images'));
}

function start(done) {
  bs.init({
    server: {
      baseDir: './dist',
      index: './index.html'
    },
    open: true,
    notify: false
  });
  done();
}

function watcher() {
  watch('src/pug/**/*.pug', compilePug);
  watch('src/scss/**/*.scss', scss);
  watch('src/images/**/*', images);
  watch('src/js/**/*', js);
}

// Экспорт задач
const build = series(cleanDist,
  parallel(compilePug, scss, js, images),
  parallel(watcher, start));

export default build;
