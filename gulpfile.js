const gulp = require("gulp");
const paths = require('./config.json');
var browserSync  = require( 'browser-sync' ).create();

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
    .src(paths.styles.src + paths.styles.sassName)
    .pipe($.changed(paths.styles.build))
    .pipe($.plumber({ errorHandler: $.notify.onError('Error: <%= error.message %>') }))
    .pipe($.sourcemaps.init())
    .pipe($.sass())
    .pipe($.autoprefixer({
      browsers: ['last 2 versions'],
      cascade: false
    }))
    .pipe($.sourcemaps.write('./'))
    .pipe($.size({gzip: true, showFiles: true}))
    .pipe(gulp.dest(paths.styles.build))
}

function css(done) {
  if(process.env.NODE_ENV === 'development') {
    return gulp
      .src([
        paths.styles.build + paths.styles.cssName,
        paths.styles.build + paths.styles.cssMapName
      ])
      .pipe(gulp.dest(paths.styles.dist))
      .pipe($.browserSync.stream())
    done();

  } else if(process.env.NODE_ENV === 'production'){
    return gulp
      .src([
        paths.node.normalize,
        paths.fonts.fontello.build + paths.fonts.fontello.cssName,
        paths.styles.build + paths.styles.cssName
      ], {
        allowEmpty: true
      })
      .pipe($.plumber({ errorHandler: $.notify.onError('Error: <%= error.message %>') }))
      .pipe($.newer({dest: paths.styles.dist}))
      .pipe($.sourcemaps.init())
      .pipe($.concat("main.css"))
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
      .pipe(gulp.dest(paths.styles.dist))
      .pipe($.browserSync.stream())
    done();
  }
}

// Process data in an array synchronously, moving onto the n+1 item only after the nth item callback
function doSynchronousLoop(data, processData, done) {
    if (data.length > 0) {
        const loop = (data, i, processData, done) => {
            processData(data[i], i, () => {
                if (++i < data.length) {
                    loop(data, i, processData, done);
                } else {
                    done();
                }
            });
        };
        loop(data, 0, processData, done);
    } else {
        done();
    }
}

// Process the critical path CSS one at a time
function processCriticalCSS(url, i, callback) {
    const criticalSrc = url;
    const criticalDest = url;
    let criticalWidth = 1200;
    let criticalHeight = 1200;
    // if (element.template.indexOf("amp_") !== -1) {
    //     criticalWidth = 600;
    //     criticalHeight = 19200;
    // }
    $.fancyLog("-> Generating critical CSS: " + $.chalk.cyan(criticalSrc) + " -> " + $.chalk.greenBright(criticalDest));
    $.critical.generate({
        base: "./dist/",
        src: criticalSrc,
        dest: criticalDest,
        inline: true,
        // ignore: [],
        css: paths.styles.dist + "main.min.css",
        minify: true,
        width: criticalWidth,
        height: criticalHeight
    }, (err, output) => {
        if (err) {
            $.fancyLog($.chalk.magenta(err));
        }
        callback()
    });
}

//critical css task
function critical(callback) {
    doSynchronousLoop(paths.critical, processCriticalCSS, () => {
        // all done
        callback();
    });
};

function pug(buildHTML) {
  return gulp
    .src([
      paths.html.src + paths.html.pugName,
      "!" + paths.html.src + paths.html.includesName
    ])
    .pipe($.plumber({ errorHandler: $.notify.onError('Error: <%= error.message %>') }))
    .pipe($.pug({
      pretty: true //Indent
    }))
    .pipe(gulp.dest(paths.html.build))
}

function copyHtml(done){
  return gulp
  .src(paths.html.build + paths.html.htmlName)
  .pipe($.plumber({ errorHandler: $.notify.onError('Error: <%= error.message %>') }))
  .pipe($.htmlmin({ collapseWhitespace: true }))
  .pipe($.size({gzip: true, showFiles: true}))
  .pipe(gulp.dest(paths.html.dist))
  .pipe($.browserSync.stream());
  done();
}

function prismJs(){
  $.fancyLog("-> Building prism.min.js...");
  return gulp
    .src(paths.scripts.prismJs)
    .pipe($.plumber({ errorHandler: $.notify.onError('Error: <%= error.message %>') }))
    .pipe($.newer({dest: paths.scripts.build}))
    .pipe($.concat("prism.min.js"))
    .pipe($.uglify())
    .pipe($.size({gzip: true, showFiles: true}))
    .pipe(gulp.dest(paths.scripts.build))
    // .pipe($.browserSync.stream())
}

function babelJs(){
  $.fancyLog("-> Transpiling Javascript via Babel...");
  return gulp
    .src(paths.scripts.src)
    .pipe($.sourcemaps.init())
    .pipe($.plumber({ errorHandler: $.notify.onError('Error: <%= error.message %>') }))
    .pipe($.newer({dest: paths.scripts.build}))
    .pipe($.concat('main.js'))
    .pipe($.babel({presets: ['@babel/env']}))
    .pipe($.size({gzip: true, showFiles: true}))
    .pipe(gulp.dest(paths.scripts.build))
    // .pipe($.browserSync.stream())
}

function inlineJs() {
  $.fancyLog("-> Copying inline js");
  return gulp.src(paths.scripts.inlineJs)
    .pipe($.plumber({ errorHandler: $.notify.onError('Error: <%= error.message %>') }))
    .pipe($.if(["*.js", "!*.min.js"],
      $.newer({dest: paths.scripts.templates + "_inlinejs", ext: ".min.js"}),
      $.newer({dest: paths.scripts.templates + "_inlinejs"})
    ))
    .pipe($.if(["*.js", "!*.min.js"],
      $.uglify()
    ))
    .pipe($.if(["*.js", "!*.min.js"],
      $.rename({suffix: ".min"})
    ))

    .pipe($.size({gzip: true, showFiles: true}))
    .pipe(gulp.dest(paths.scripts.templates + "_inlinejs"))
    // .pipe($.browserSync.stream())
}

function js(){
  $.fancyLog("-> Building js");
  return gulp.src(paths.scripts.build + paths.scripts.jsName)
    .pipe($.sourcemaps.init())
    .pipe($.plumber({ errorHandler: $.notify.onError('Error: <%= error.message %>') }))
    .pipe($.if(["*.js", "!*.min.js"],
      $.newer({dest: paths.scripts.dist, ext: ".min.js"}),
      $.newer({dest: paths.scripts.dist})
    ))
    .pipe($.if(["*.js", "!*.min.js"],
      $.uglify()
    ))
    .pipe($.sourcemaps.write("./"))
    .pipe($.if(["*.js", "!*.min.js"],
      $.rename({suffix: ".min"})
    ))
    .pipe($.header(banner, {paths: paths}))
    .pipe($.size({gzip: true, showFiles: true}))
    .pipe(gulp.dest(paths.scripts.dist))
    // .pipe($.browserSync.stream())
}

function favicons() {
    $.fancyLog("-> Generating favicons");
    return gulp.src("./src/images/site/favicon.png")
    .pipe($.favicons({
      // appName: paths.name,
      // appDescription: paths.description,
      // developerName: paths.author,
      // developerURL: paths.urls.live,
      background: "#FFFFFF",
      path: "assets/images/site/",
      // url: paths.site_url,
      display: "standalone",
      orientation: "portrait",
      // version: paths.version,
      logging: false,
      online: false,
      html: "../../../../src/pug/_includes/head/favicons.html",
      pipeHTML: true,
      replace: true,
      icons: {
        android: false, // Create Android homescreen icon. `boolean`
        appleIcon: true, // Create Apple touch icons. `boolean`
        appleStartup: false, // Create Apple startup images. `boolean`
        coast: true, // Create Opera Coast icon. `boolean`
        favicons: true, // Create regular favicons. `boolean`
        firefox: true, // Create Firefox OS icons. `boolean`
        opengraph: false, // Create Facebook OpenGraph image. `boolean`
        twitter: false, // Create Twitter Summary Card image. `boolean`
        windows: true, // Create Windows 8 tile icons. `boolean`
        yandex: true // Create Yandex browser icon. `boolean`
      }
    }))
    .pipe($.size({gzip: true, showFiles: true}))
    .pipe(gulp.dest("./dist/assets/images/site/"));
}

function browserSyncc() {
  browserSync.init({
    server: {
      baseDir: paths.dist,
    },
    // ghostMode: false,
    // online: true,
  });
}

function reload(done) {
  browserSync.reload();
  done();
}

function watchFiles() {
  gulp.watch(paths.styles.src, gulp.series(styles, reload));
  gulp.watch(paths.html.src, gulp.series(html, reload));
}

function fontello() {
  return gulp.src(paths.fonts.fontello.src + paths.fonts.fontello.configName)
    .pipe($.fontello({font: "fonts"}))
    .pipe(gulp.dest(paths.fonts.fontello.build))
}

function copyFonts() {
  return gulp.src([
    paths.fonts.src + paths.fonts.fontsName,
    "!" + paths.fonts.fontello.src,
    paths.fonts.fontello.build + paths.fonts.fontsName
  ])
  .pipe(gulp.dest(paths.fonts.dist))
}

function clear() {
  return $.del(["./build", "./dist", "./craft"]);
}

function svg() {
  return gulp.src(paths.svg.src)
    .pipe($.svgmin())
    .pipe(gulp.dest(paths.svg.dist));
}

function images() {
  return gulp
  .src(paths.images.src)
  .pipe($.newer(paths.images.dist))
  .pipe($.plumber({ errorHandler: $.notify.onError('Error: <%= error.message %>') }))
  // .pipe(
  //   $.responsive(
  //     {
  //       '*.png': [
  //         {
  //           // -small.webp is 320 pixels wide
  //           width: 320,
  //           rename: {
  //             suffix: '-small',
  //             extname: '.jpg',
  //           },
  //         },
  //         {
  //           // -small@2x.webp is 640 pixels wide
  //           width: 320 * 2,
  //           rename: {
  //             suffix: '-small@2x',
  //             extname: '.jpg',
  //           },
  //         },
  //         {
  //           // -small@3x.webp is 960 pixels wide
  //           width: 320 * 3,
  //           rename: {
  //             suffix: '-small@3x',
  //             extname: '.jpg',
  //           },
  //         },
  //         {
  //           // -medium.webp is 768 pixels wide
  //           width: 768,
  //           rename: {
  //             suffix: '-medium',
  //             extname: '.jpg',
  //           },
  //         },
  //         {
  //           // -medium@2x.webp is 1.536 pixels wide
  //           width: 768 * 2,
  //           rename: {
  //             suffix: '-medium@2x',
  //             extname: '.jpg',
  //           },
  //         },
  //         {
  //           // -medium@3x.webp is 2.304 pixels wide
  //           width: 768 * 3,
  //           rename: {
  //             suffix: '-medium@3x',
  //             extname: '.jpg',
  //           },
  //         },
  //         {
  //           // -large.webp is 1.280 pixels wide
  //           width: 1280,
  //           rename: {
  //             suffix: '-large',
  //             extname: '.jpg',
  //           },
  //         },
  //         {
  //           // -large@2x.webp is 2.560 pixels wide
  //           width: 1280 * 2,
  //           rename: {
  //             suffix: '-large@2x',
  //             extname: '.jpg',
  //           },
  //         },
  //         {
  //           // -large@3x.webp is 3.840 pixels wide
  //           width: 1280 * 3,
  //           rename: {
  //             suffix: '-large@3x',
  //             extname: '.jpg',
  //           },
  //         },
  //         {
  //           // -extralarge.webp is 1.440 pixels wide
  //           width: 1440,
  //           rename: {
  //             suffix: '-extralarge',
  //             extname: '.jpg',
  //           },
  //         },
  //         {
  //           // -extralarge@2x.webp is 2.880 pixels wide
  //           width: 1440 * 2,
  //           rename: {
  //             suffix: '-extralarge@2x',
  //             extname: '.jpg',
  //           },
  //         },
  //         {
  //           // -extralarge@3x.webp is 4.320 pixels wide
  //           width: 1440 * 3,
  //           rename: {
  //             suffix: '-extralarge@3x',
  //             extname: '.jpg',
  //           },
  //         },
  //         {
  //           // -small.webp is 320 pixels wide
  //           width: 320,
  //           rename: {
  //             suffix: '-small',
  //             extname: '.webp',
  //           },
  //         },
  //         {
  //           // -small@2x.webp is 640 pixels wide
  //           width: 320 * 2,
  //           rename: {
  //             suffix: '-small@2x',
  //             extname: '.webp',
  //           },
  //         },
  //         {
  //           // -small@3x.webp is 960 pixels wide
  //           width: 320 * 3,
  //           rename: {
  //             suffix: '-small@3x',
  //             extname: '.webp',
  //           },
  //         },
  //         {
  //           // -medium.webp is 768 pixels wide
  //           width: 768,
  //           rename: {
  //             suffix: '-medium',
  //             extname: '.webp',
  //           },
  //         },
  //         {
  //           // -medium@2x.webp is 1.536 pixels wide
  //           width: 768 * 2,
  //           rename: {
  //             suffix: '-medium@2x',
  //             extname: '.webp',
  //           },
  //         },
  //         {
  //           // -medium@3x.webp is 2.304 pixels wide
  //           width: 768 * 3,
  //           rename: {
  //             suffix: '-medium@3x',
  //             extname: '.webp',
  //           },
  //         },
  //         {
  //           // -large.webp is 1.280 pixels wide
  //           width: 1280,
  //           rename: {
  //             suffix: '-large',
  //             extname: '.webp',
  //           },
  //         },
  //         {
  //           // -large@2x.webp is 2.560 pixels wide
  //           width: 1280 * 2,
  //           rename: {
  //             suffix: '-large@2x',
  //             extname: '.webp',
  //           },
  //         },
  //         {
  //           // -large@3x.webp is 3.840 pixels wide
  //           width: 1280 * 3,
  //           rename: {
  //             suffix: '-large@3x',
  //             extname: '.webp',
  //           },
  //         },
  //         {
  //           // -extralarge.webp is 1.440 pixels wide
  //           width: 1440,
  //           rename: {
  //             suffix: '-extralarge',
  //             extname: '.webp',
  //           },
  //         },
  //         {
  //           // -extralarge@2x.webp is 2.880 pixels wide
  //           width: 1440 * 2,
  //           rename: {
  //             suffix: '-extralarge@2x',
  //             extname: '.webp',
  //           },
  //         },
  //         {
  //           // -extralarge@3x.webp is 4.320 pixels wide
  //           width: 1440 * 3,
  //           rename: {
  //             suffix: '-extralarge@3x',
  //             extname: '.webp',
  //           },
  //         },
  //       ],
  //       '*.jpg': [
  //         {
  //           // -small.webp is 320 pixels wide
  //           width: 320,
  //           rename: {
  //             suffix: '-small',
  //             extname: '.jpg',
  //           },
  //         },
  //         {
  //           // -small@2x.webp is 640 pixels wide
  //           width: 320 * 2,
  //           rename: {
  //             suffix: '-small@2x',
  //             extname: '.jpg',
  //           },
  //         },
  //         {
  //           // -small@3x.webp is 960 pixels wide
  //           width: 320 * 3,
  //           rename: {
  //             suffix: '-small@3x',
  //             extname: '.jpg',
  //           },
  //         },
  //         {
  //           // -medium.webp is 768 pixels wide
  //           width: 768,
  //           rename: {
  //             suffix: '-medium',
  //             extname: '.jpg',
  //           },
  //         },
  //         {
  //           // -medium@2x.webp is 1.536 pixels wide
  //           width: 768 * 2,
  //           rename: {
  //             suffix: '-medium@2x',
  //             extname: '.jpg',
  //           },
  //         },
  //         {
  //           // -medium@3x.webp is 2.304 pixels wide
  //           width: 768 * 3,
  //           rename: {
  //             suffix: '-medium@3x',
  //             extname: '.jpg',
  //           },
  //         },
  //         {
  //           // -large.webp is 1.280 pixels wide
  //           width: 1280,
  //           rename: {
  //             suffix: '-large',
  //             extname: '.jpg',
  //           },
  //         },
  //         {
  //           // -large@2x.webp is 2.560 pixels wide
  //           width: 1280 * 2,
  //           rename: {
  //             suffix: '-large@2x',
  //             extname: '.jpg',
  //           },
  //         },
  //         {
  //           // -large@3x.webp is 3.840 pixels wide
  //           width: 1280 * 3,
  //           rename: {
  //             suffix: '-large@3x',
  //             extname: '.jpg',
  //           },
  //         },
  //         {
  //           // -extralarge.webp is 1.440 pixels wide
  //           width: 1440,
  //           rename: {
  //             suffix: '-extralarge',
  //             extname: '.jpg',
  //           },
  //         },
  //         {
  //           // -extralarge@2x.webp is 2.880 pixels wide
  //           width: 1440 * 2,
  //           rename: {
  //             suffix: '-extralarge@2x',
  //             extname: '.jpg',
  //           },
  //         },
  //         {
  //           // -extralarge@3x.webp is 4.320 pixels wide
  //           width: 1440 * 3,
  //           rename: {
  //             suffix: '-extralarge@3x',
  //             extname: '.jpg',
  //           },
  //         },
  //         {
  //           // -small.webp is 320 pixels wide
  //           width: 320,
  //           rename: {
  //             suffix: '-small',
  //             extname: '.webp',
  //           },
  //         },
  //         {
  //           // -small@2x.webp is 640 pixels wide
  //           width: 320 * 2,
  //           rename: {
  //             suffix: '-small@2x',
  //             extname: '.webp',
  //           },
  //         },
  //         {
  //           // -small@3x.webp is 960 pixels wide
  //           width: 320 * 3,
  //           rename: {
  //             suffix: '-small@3x',
  //             extname: '.webp',
  //           },
  //         },
  //         {
  //           // -medium.webp is 768 pixels wide
  //           width: 768,
  //           rename: {
  //             suffix: '-medium',
  //             extname: '.webp',
  //           },
  //         },
  //         {
  //           // -medium@2x.webp is 1.536 pixels wide
  //           width: 768 * 2,
  //           rename: {
  //             suffix: '-medium@2x',
  //             extname: '.webp',
  //           },
  //         },
  //         {
  //           // -medium@3x.webp is 2.304 pixels wide
  //           width: 768 * 3,
  //           rename: {
  //             suffix: '-medium@3x',
  //             extname: '.webp',
  //           },
  //         },
  //         {
  //           // -large.webp is 1.280 pixels wide
  //           width: 1280,
  //           rename: {
  //             suffix: '-large',
  //             extname: '.webp',
  //           },
  //         },
  //         {
  //           // -large@2x.webp is 2.560 pixels wide
  //           width: 1280 * 2,
  //           rename: {
  //             suffix: '-large@2x',
  //             extname: '.webp',
  //           },
  //         },
  //         {
  //           // -large@3x.webp is 3.840 pixels wide
  //           width: 1280 * 3,
  //           rename: {
  //             suffix: '-large@3x',
  //             extname: '.webp',
  //           },
  //         },
  //         {
  //           // -extralarge.webp is 1.440 pixels wide
  //           width: 1440,
  //           rename: {
  //             suffix: '-extralarge',
  //             extname: '.webp',
  //           },
  //         },
  //         {
  //           // -extralarge@2x.webp is 2.880 pixels wide
  //           width: 1440 * 2,
  //           rename: {
  //             suffix: '-extralarge@2x',
  //             extname: '.webp',
  //           },
  //         },
  //         {
  //           // -extralarge@3x.webp is 4.320 pixels wide
  //           width: 1440 * 3,
  //           rename: {
  //             suffix: '-extralarge@3x',
  //             extname: '.webp',
  //           },
  //         },
  //       ],
  //     },
  //     {
  //       // Global configuration for all images
  //       // The output quality for JPEG, WebP and TIFF output formats
  //       quality: 75,
  //       // Use progressive (interlace) scan for JPEG and PNG output
  //       progressive: true,
  //       // Strip all metadata
  //       withMetadata: false,
  //       // Do not emit the error when image is enlarged.
  //       errorOnEnlargement: false,
  //     }
  //   )
  // )
  .pipe(gulp.dest(paths.images.dist))
  .pipe($.notify({ message: '> Images task finished!', onLast: true }));
}

function sprite() {
  var spriteData = gulp.src(paths.sprites.src)
  .pipe($.spritesmith({
    imgName: 'sprite.png',
    cssName: 'sprite.sass'
  }));
  return spriteData.pipe(gulp.dest(paths.sprites.build));
}
// set the node environment to development
function setDevEnv(done) {
  $.fancyLog("-> Setting NODE_ENV to " + $.chalk.blue("DEVELOPMENT"));
  process.env.NODE_ENV = "development";
  done();
};

// set the node environment to production
function setProdEnv(done) {
  $.fancyLog("-> Setting NODE_ENV to " + $.chalk.blue("PRODUCTION"));
  process.env.NODE_ENV = "production";
  done();
};

const html = gulp.series(pug, copyHtml);
const styles = gulp.series(sass, css);
const scripts = gulp.series(babelJs, js);
const fonts = gulp.series(fontello, copyFonts);

const watch = gulp.series(
  fonts, setDevEnv,
  gulp.parallel(scripts, styles, html),
  gulp.parallel(browserSyncc, watchFiles)
);

const build = gulp.series(
  gulp.parallel(setProdEnv, clear),
  gulp.parallel(images, favicons, fonts, svg),
  gulp.parallel(html, styles, scripts),
  critical
);

exports.default = watch;

exports.build = build;
exports.html = html;
exports.styles = styles;
exports.scripts = scripts;
exports.fonts = fonts;

exports.images = images;
exports.svg = svg;
exports.sprity = sprite;
exports.favicons = favicons;
exports.clear = clear;

exports.prismJs = prismJs;
exports.babelJs = babelJs;
exports.inlineJs = inlineJs;
exports.js = js;

exports.critical = critical;
