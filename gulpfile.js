var autoprefixer = require('autoprefixer')
var config = require('node-config')
var cors = require('cors')
var del = require('del')
var dirname = require('path').dirname
var express = require('express')
var gulp = require('gulp')
var neat = require('node-neat').includePaths
var plugins = require('gulp-load-plugins')()
var pngquant = require('imagemin-pngquant')
var read = require('fs').readFileSync
var readdir = require('fs').readdirSync
var run = require('run-sequence')
var spawn = require('child_process').spawn
var through2 = require('through2')
var NODE_VERSION = require('./package.json').engines.node

if ('v' + NODE_VERSION !== process.version) {
  console.error('\n \x1b[31m Error: You are running node %s, please switch to %s\n', process.version, NODE_VERSION)
  process.exit(1)
}

gulp.task('clean:dist', function (done) {
  return del('dist')
})

gulp.task('clean:sass', function () {
  return del('app/css/*')
})

gulp.task('clean:cache', function (done) {
  return plugins.cache.clearAll(done)
});

gulp.task('clean:npm', function (done) {
  del('node_modules', done)
})

gulp.task('clean', function (done) {
  run(['clean:dist', 'clean:sass'], done)
})

gulp.task('setenv:dist', function () {
  process.env.BUILD_ENV = process.env.BUILD_ENV || 'dist'
})

gulp.task('config', function () {
  config.basePath = __dirname + '/app'

  if ('ci' === process.env.BUILD_ENV) {
    config.base = ''
    config.root = '/dist'
  } else if ('dist' === process.env.BUILD_ENV) {
    config.base = '/dist'
    config.root = ''
  } else {
    config.base = '/app'
    config.root = ''
  }
})

gulp.task('sass', function () {
  return gulp.src([
    'app/scss/*.scss',
    '!app/scss/_*.scss'
  ], { base: 'app/scss' })
    .pipe(plugins.sourcemaps.init())
    .pipe(plugins.sass({ includePaths: ['styles'].concat(neat) }))
    .on('error', plugins.sass.logError)
    .pipe(plugins.postcss([ autoprefixer({ browsers: ['last 2 version'] }) ]))
    .pipe(plugins.sourcemaps.write())
    .pipe(gulp.dest('app/css'))
})

gulp.task('ejs', function () {
  return gulp.src(['app/**/*.ejs', '!app/_includes/*'])
    .pipe(plugins.ejs(config, { ext: '' }))
      .on('error', function (err) {
        plugins.util.log('ejs error', err.message)
        plugins.util.log('ejs error', err.stack)
        plugins.util.beep()
      })
    .pipe(through2.obj(function (file, enc, done) {
      var html = file.contents.toString()
      html = html.replace(/( *)<pre ([^>]+)>([\s\S]*?)<\/pre>/g, function (match, indent, attrs, content) {
        content = content.replace(/^\n/g, '')
        content = content.replace(new RegExp(`^${indent}  `, 'mg'), '')
        content = content.replace(new RegExp(`\n${indent}$`, 'g'), '')
        return `${indent}<pre ${attrs}>${content}</pre>`
      })
      file.contents = new Buffer(html)
      done(null, file)
    }))
    .pipe(gulp.dest('app'))
})

gulp.task('copy:images', function () {
  return gulp.src('app/images/**/*', { base: 'app' })
    .pipe(gulp.dest('dist'))
})

gulp.task('copy:fonts', function () {
  return gulp.src('app/fonts/**/*')
    .pipe(gulp.dest('dist/fonts'))
})

gulp.task('useref', function () {
  return gulp.src('app/**/*.html')
    .pipe(plugins.useref())
    .pipe(plugins.rename(function (path) {
      path.dirname = path.dirname.replace(/^dist\//, '')
    }))
    .pipe(gulp.dest('dist'))
})

gulp.task('inline:css', function () {
  return gulp.src('dist/css/*')
    .pipe(plugins.cssBase64({
      maxWeightResource: 512000,
      extensionsAllowed: ['.gif', '.jpg', '.png', '.svg']
    }))
    .pipe(gulp.dest('dist/css'))
})

gulp.task('inline:html', function () {
  return gulp.src('dist/**/*.html')
    .pipe(plugins.cache(plugins.inlineSource({
      svgAsImage: true,
      rootpath: process.cwd() + '/dist'
    })))
    .pipe(gulp.dest('dist'))
})

gulp.task('minify:js', function () {
  return gulp.src('dist/scripts/*')
    .pipe(plugins.cache(plugins.uglify()))
    .pipe(gulp.dest('dist/scripts/'))
})

gulp.task('minify:css', function () {
  return gulp.src('dist/css/*.css')
    .pipe(plugins.cache(plugins.minifyCss({
      keepSpecialComments: 0,
      keepBreaks: true
    })))
    .pipe(gulp.dest('dist/css/'))
})

gulp.task('minify:html', function () {
  return gulp.src('dist/**/*.html')
    .pipe(plugins.cache(plugins.minifyHtml({
      conditionals: true,
      quotes: true
    })))
    .pipe(gulp.dest('dist/'))
})

gulp.task('minify:images', function () {
  return gulp.src('dist/images/**/*')
    .pipe(plugins.cache(plugins.imagemin({
        progressive: true,
        svgoPlugins: [{ removeViewBox: false }],
        use: [pngquant()]
    })))
    .pipe(gulp.dest('dist/images'));
})

gulp.task('serve', ['build:app'], function (done) {
  gulp.watch('app/scss/*', ['sass'])
  gulp.watch('app/**/*.ejs', ['ejs'])

  plugins.livereload({ start: true })

  gulp.watch([
    'app/**/*',
    '!app/**/*.ejs',
    '!app/scss/*',
  ]).on('change', function (file) {
    plugins.livereload.changed(file.path)
  })

  var PORT = process.env.PORT || 3000
  var server = express()
  server.use(cors())

  ;[
    '/app',
    '/dist',
    '/bower_components',
    '/node_modules'
  ].forEach(function (folder) {
    server.use(folder, express.static(__dirname + folder, { etag: false }))
  })

  server.listen(PORT, function () {
    plugins.util.log('Express server listening at http://localhost:' + PORT + '/app')
    done()
  })
})

gulp.task('serve:dist', ['build:dist'], function (done) {
  var PORT = process.env.PORT || 3000
  var server = express()
  server.use(cors())
  server.use(config.base, express.static(__dirname + config.base, { etag: false }))
  server.listen(PORT, function () {
    plugins.util.log('Express server listening at http://localhost:' + PORT + config.base)
    done()
  })
})

gulp.task('build:app', function (done) {
  run(
    'config',
    'clean:sass',
    [
      'sass',
      'ejs'
    ],
    done
  )
})

gulp.task('build:dist', function (done) {
  run(
    'setenv:dist',
    [
      'build:app',
      'clean:dist'
    ],
    [
      'copy:images',
      'copy:fonts',
      'useref'
    ],
    [
      'minify:js',
      'minify:css',
      'minify:html',
      // 'minify:images',
    ],
    done
  )
})

gulp.task('default', ['build:dist'])
