"use strict";

const gulp = require("gulp");
const paths = require('./package.json');
const $ = require('gulp-load-plugins')({
  pattern: ['*'],
  scope: ['devDependencies']
});

const banner = [
    "/**",
    " * @project        <%= paths.name %>",
    " * @author         <%= paths.author %>",
    " * @build          " + $.moment().format("llll") + " ET",
    " * @release        " + $.gitRevSync.long() + " [" + $.gitRevSync.branch() + "]",
    " * @copyright      Copyright (c) " + $.moment().format("YYYY") + ", <%= paths.copyright %>",
    " *",
    " */",
    ""
].join("\n");

function sass() {
  $.fancyLog("> Compiling sass");
  return gulp
    .src(paths.paths.src.sass + '*.sass')
    .pipe($.plumber({ errorHandler: $.notify.onError('Error: <%= error.message %>') }))
    .pipe($.sourcemaps.init())
    .pipe($.sass())
    .pipe($.sourcemaps.write('./'))
    .pipe($.size({gzip: true, showFiles: true}))
    .pipe(gulp.dest(paths.paths.build.css))
    .pipe($.browserSync.stream())
}

function css() {
  $.fancyLog("> Building css");
  return gulp
    .src([
      "./node_modules/normalize.css/normalize.css",
      "./build/css/*.css"
    ])
    .pipe($.plumber({ errorHandler: $.notify.onError('Error: <%= error.message %>') }))
    .pipe($.newer({dest: "./dist/css/main.min.css"}))
    .pipe($.sourcemaps.init())
    .pipe($.concat("main.min.css"))
    .pipe($.cssnano({
      discardComments: {
        removeAll: true
      },
      discardDuplicates: true,
      discardEmpty: true,
      minifyFontValues: true,
      minifySelectors: true
    }))
    .pipe($.header(banner, {paths: paths}))
    .pipe($.sourcemaps.write("./"))
    .pipe($.size({gzip: true, showFiles: true}))
    .pipe(gulp.dest("./dist/css/"))
    .pipe($.browserSync.stream())
}

function pug(buildHTML) {
  return gulp
    .src([
      paths.paths.src.pug + '**/*.pug',
      '!./src/pug/_includes{,/**}'
    ])
    .pipe($.pug({
      pretty: true //Indent
    }))
    .pipe(gulp.dest("./build/"))
    .pipe($.browserSync.stream());
}

function scripts() {
  return (gulp
    .src(paths.paths.src.js + '**/*.js')
    .pipe($.sourcemaps.init())
    .pipe($.plumber({ errorHandler: $.notify.onError('Error: <%= error.message %>') }))
    .pipe($.concat('main.js'))
    .pipe(
      $.babel({
        presets: ['@babel/env'],
      })
    )
    .pipe($.uglify())
    .pipe($.sourcemaps.write('./')) //change to variable path (ignacio example)
    .pipe(
      $.rename({
        basename: 'main',
        suffix: '.min'
      })
    )
    .pipe(gulp.dest(paths.paths.build.js))
    .pipe($.browserSync.stream())
  )
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
  gulp.watch(paths.paths.src.sass, styles);
  gulp.watch(paths.paths.src.pug, pug);
  gulp.watch(paths.paths.src.js, scripts);
}

function fonts() {
  return gulp
  .src('src/fonts/**/*')
  .pipe(gulp.dest('build/fonts/'))
}

function clean() {
  return $.del(["./build", "./dist"]);
}

function images() {
  return gulp
  .src(config.images.src)
  .pipe($.changed(config.images.src))
  .pipe($.plumber({ errorHandler: notify.onError('Error: <%= error.message %>') }))
  .pipe(
    $.responsive(
      {
        '*.png': [
          {
            // -small.webp is 320 pixels wide
            width: 320,
            rename: {
              suffix: '-small',
              extname: '.jpg',
            },
          },
          {
            // -small@2x.webp is 640 pixels wide
            width: 320 * 2,
            rename: {
              suffix: '-small@2x',
              extname: '.jpg',
            },
          },
          {
            // -small@3x.webp is 960 pixels wide
            width: 320 * 3,
            rename: {
              suffix: '-small@3x',
              extname: '.jpg',
            },
          },
          {
            // -medium.webp is 768 pixels wide
            width: 768,
            rename: {
              suffix: '-medium',
              extname: '.jpg',
            },
          },
          {
            // -medium@2x.webp is 1.536 pixels wide
            width: 768 * 2,
            rename: {
              suffix: '-medium@2x',
              extname: '.jpg',
            },
          },
          {
            // -medium@3x.webp is 2.304 pixels wide
            width: 768 * 3,
            rename: {
              suffix: '-medium@3x',
              extname: '.jpg',
            },
          },
          {
            // -large.webp is 1.280 pixels wide
            width: 1280,
            rename: {
              suffix: '-large',
              extname: '.jpg',
            },
          },
          {
            // -large@2x.webp is 2.560 pixels wide
            width: 1280 * 2,
            rename: {
              suffix: '-large@2x',
              extname: '.jpg',
            },
          },
          {
            // -large@3x.webp is 3.840 pixels wide
            width: 1280 * 3,
            rename: {
              suffix: '-large@3x',
              extname: '.jpg',
            },
          },
          {
            // -extralarge.webp is 1.440 pixels wide
            width: 1440,
            rename: {
              suffix: '-extralarge',
              extname: '.jpg',
            },
          },
          {
            // -extralarge@2x.webp is 2.880 pixels wide
            width: 1440 * 2,
            rename: {
              suffix: '-extralarge@2x',
              extname: '.jpg',
            },
          },
          {
            // -extralarge@3x.webp is 4.320 pixels wide
            width: 1440 * 3,
            rename: {
              suffix: '-extralarge@3x',
              extname: '.jpg',
            },
          },
          {
            // -small.webp is 320 pixels wide
            width: 320,
            rename: {
              suffix: '-small',
              extname: '.webp',
            },
          },
          {
            // -small@2x.webp is 640 pixels wide
            width: 320 * 2,
            rename: {
              suffix: '-small@2x',
              extname: '.webp',
            },
          },
          {
            // -small@3x.webp is 960 pixels wide
            width: 320 * 3,
            rename: {
              suffix: '-small@3x',
              extname: '.webp',
            },
          },
          {
            // -medium.webp is 768 pixels wide
            width: 768,
            rename: {
              suffix: '-medium',
              extname: '.webp',
            },
          },
          {
            // -medium@2x.webp is 1.536 pixels wide
            width: 768 * 2,
            rename: {
              suffix: '-medium@2x',
              extname: '.webp',
            },
          },
          {
            // -medium@3x.webp is 2.304 pixels wide
            width: 768 * 3,
            rename: {
              suffix: '-medium@3x',
              extname: '.webp',
            },
          },
          {
            // -large.webp is 1.280 pixels wide
            width: 1280,
            rename: {
              suffix: '-large',
              extname: '.webp',
            },
          },
          {
            // -large@2x.webp is 2.560 pixels wide
            width: 1280 * 2,
            rename: {
              suffix: '-large@2x',
              extname: '.webp',
            },
          },
          {
            // -large@3x.webp is 3.840 pixels wide
            width: 1280 * 3,
            rename: {
              suffix: '-large@3x',
              extname: '.webp',
            },
          },
          {
            // -extralarge.webp is 1.440 pixels wide
            width: 1440,
            rename: {
              suffix: '-extralarge',
              extname: '.webp',
            },
          },
          {
            // -extralarge@2x.webp is 2.880 pixels wide
            width: 1440 * 2,
            rename: {
              suffix: '-extralarge@2x',
              extname: '.webp',
            },
          },
          {
            // -extralarge@3x.webp is 4.320 pixels wide
            width: 1440 * 3,
            rename: {
              suffix: '-extralarge@3x',
              extname: '.webp',
            },
          },
        ],
        '*.jpg': [
          {
            // -small.webp is 320 pixels wide
            width: 320,
            rename: {
              suffix: '-small',
              extname: '.jpg',
            },
          },
          {
            // -small@2x.webp is 640 pixels wide
            width: 320 * 2,
            rename: {
              suffix: '-small@2x',
              extname: '.jpg',
            },
          },
          {
            // -small@3x.webp is 960 pixels wide
            width: 320 * 3,
            rename: {
              suffix: '-small@3x',
              extname: '.jpg',
            },
          },
          {
            // -medium.webp is 768 pixels wide
            width: 768,
            rename: {
              suffix: '-medium',
              extname: '.jpg',
            },
          },
          {
            // -medium@2x.webp is 1.536 pixels wide
            width: 768 * 2,
            rename: {
              suffix: '-medium@2x',
              extname: '.jpg',
            },
          },
          {
            // -medium@3x.webp is 2.304 pixels wide
            width: 768 * 3,
            rename: {
              suffix: '-medium@3x',
              extname: '.jpg',
            },
          },
          {
            // -large.webp is 1.280 pixels wide
            width: 1280,
            rename: {
              suffix: '-large',
              extname: '.jpg',
            },
          },
          {
            // -large@2x.webp is 2.560 pixels wide
            width: 1280 * 2,
            rename: {
              suffix: '-large@2x',
              extname: '.jpg',
            },
          },
          {
            // -large@3x.webp is 3.840 pixels wide
            width: 1280 * 3,
            rename: {
              suffix: '-large@3x',
              extname: '.jpg',
            },
          },
          {
            // -extralarge.webp is 1.440 pixels wide
            width: 1440,
            rename: {
              suffix: '-extralarge',
              extname: '.jpg',
            },
          },
          {
            // -extralarge@2x.webp is 2.880 pixels wide
            width: 1440 * 2,
            rename: {
              suffix: '-extralarge@2x',
              extname: '.jpg',
            },
          },
          {
            // -extralarge@3x.webp is 4.320 pixels wide
            width: 1440 * 3,
            rename: {
              suffix: '-extralarge@3x',
              extname: '.jpg',
            },
          },
          {
            // -small.webp is 320 pixels wide
            width: 320,
            rename: {
              suffix: '-small',
              extname: '.webp',
            },
          },
          {
            // -small@2x.webp is 640 pixels wide
            width: 320 * 2,
            rename: {
              suffix: '-small@2x',
              extname: '.webp',
            },
          },
          {
            // -small@3x.webp is 960 pixels wide
            width: 320 * 3,
            rename: {
              suffix: '-small@3x',
              extname: '.webp',
            },
          },
          {
            // -medium.webp is 768 pixels wide
            width: 768,
            rename: {
              suffix: '-medium',
              extname: '.webp',
            },
          },
          {
            // -medium@2x.webp is 1.536 pixels wide
            width: 768 * 2,
            rename: {
              suffix: '-medium@2x',
              extname: '.webp',
            },
          },
          {
            // -medium@3x.webp is 2.304 pixels wide
            width: 768 * 3,
            rename: {
              suffix: '-medium@3x',
              extname: '.webp',
            },
          },
          {
            // -large.webp is 1.280 pixels wide
            width: 1280,
            rename: {
              suffix: '-large',
              extname: '.webp',
            },
          },
          {
            // -large@2x.webp is 2.560 pixels wide
            width: 1280 * 2,
            rename: {
              suffix: '-large@2x',
              extname: '.webp',
            },
          },
          {
            // -large@3x.webp is 3.840 pixels wide
            width: 1280 * 3,
            rename: {
              suffix: '-large@3x',
              extname: '.webp',
            },
          },
          {
            // -extralarge.webp is 1.440 pixels wide
            width: 1440,
            rename: {
              suffix: '-extralarge',
              extname: '.webp',
            },
          },
          {
            // -extralarge@2x.webp is 2.880 pixels wide
            width: 1440 * 2,
            rename: {
              suffix: '-extralarge@2x',
              extname: '.webp',
            },
          },
          {
            // -extralarge@3x.webp is 4.320 pixels wide
            width: 1440 * 3,
            rename: {
              suffix: '-extralarge@3x',
              extname: '.webp',
            },
          },
        ],
      },
      {
        // Global configuration for all images
        // The output quality for JPEG, WebP and TIFF output formats
        quality: 85,
        // Use progressive (interlace) scan for JPEG and PNG output
        progressive: true,
        // Strip all metadata
        withMetadata: false,
        // Do not emit the error when image is enlarged.
        errorOnEnlargement: false,
      }
    )
  )
  .pipe(gulp.dest(config.images.dist))
  .pipe(notify({ message: '> Images task finished!', onLast: true }));
}

const styles = gulp.series(sass, css);

const watch = gulp.series(
  gulp.parallel(scripts, styles, pug),
  gulp.parallel(watchFiles, browserSync)
);

exports.default = watch;
exports.scripts = scripts;

exports.styles = styles;

exports.images = images;
exports.clean = clean
