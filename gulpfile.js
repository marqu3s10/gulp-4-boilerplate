"use strict";

const gulp = require("gulp");
const pkg = require('./package.json');
const $ = require('gulp-load-plugins')({
  pattern: ['*'],
  scope: ['devDependencies']
});

function sass() {
  return gulp
    .src(pkg.paths.src.sass + '**/*.sass')
    .pipe($.sass())
    .pipe(gulp.dest(pkg.paths.build.css))
    .pipe($.browserSync.stream());
}

function pug(buildHTML) {
  return gulp
  .src([
    pkg.paths.src.pug + '**/*.pug',
    '!./src/pug/_includes{,/**}'
  ])
  .pipe($.pug({
    pretty: true //Indent
  }))
  .pipe(gulp.dest("./build/"))
  .pipe($.browserSync.stream());
}

function browserSync(done) {
  $.browserSync.init({
    server: {
      baseDir: "./build/"
    },
    port: 3000
  });
  done();
}

function watchFiles() {
  gulp.watch(pkg.paths.src.sass, sass);
  gulp.watch(pkg.paths.src.pug, pug);
}

const watch = gulp.series(sass, pug, gulp.parallel(watchFiles, browserSync));

exports.watch = watch;






// gulp.task('sass', () => {
//   $.fancyLog("-> Compiling scss: " + pkg.paths.build.css + pkg.vars.scssName);
//   return gulp.src(pkg.paths.src.scss + pkg.vars.scssName)
//     .pipe($.plumber({ errorHandler: onError }))
//     .pipe($.sourcemaps.init({loadMaps: true}))
//     .pipe($.sass({
//       includePaths: pkg.paths.scss
//     })
//     .on('error', $.sass.logError))
//     .pipe($.cached('sass_compile'))
//     .pipe($.autoprefixer())
//     .pipe($.sourcemaps.write('./'))
//     .pipe($.size({ gzip: true, showFiles: true }))
//     .pipe(gulp.dest(pkg.paths.build.css))
//     .pipe(browserSync.reload({
//       stream: true
//     }))
// });
//
// gulp.task('browserSync', function(){
//   $.browserSync.init({
//     server: {
//       baseDir: 'app'
//     }
//   })
// });


// gulp.task('watch', ['browserSync', 'sass'], function(){
//   gulp.watch(pkg.paths.src.build.scss, ['sass']);
// });
