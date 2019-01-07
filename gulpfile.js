// load all plugins in 'devDependencies' into the variable $
const $ = require('gulp-load-plugins')({
  pattern: ['*'],
  scope: ['devDependencies']
});

// package vars
const pkg = require('./package.json');

$.fancyLog("-> Compiling scss");


gulp.task('scss', () => {
  $.fancyLog("-> Compiling scss: " + pkg.paths.build.css + pkg.vars.scssName);
  return gulp.src(pkg.paths.src.scss + pkg.vars.scssName)
    .pipe($.plumber({ errorHandler: onError }))
    .pipe($.sourcemaps.init({loadMaps: true}))
    .pipe($.sass({
      includePaths: pkg.paths.scss
    })
    .on('error', $.sass.logError))
    .pipe($.cached('sass_compile'))
    .pipe($.autoprefixer())
    .pipe($.sourcemaps.write('./'))
    .pipe($.size({ gzip: true, showFiles: true }))
    .pipe(gulp.dest(pkg.paths.build.css));
});
