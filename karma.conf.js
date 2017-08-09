// Karma configuration
// Generated on Fri Jan 30 2015 20:47:11 GMT+0000 (UTC)

module.exports = function (config) {
  config.set({
    basePath: '',

    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: [
      'browserify',
      'chai',
      'mocha',
      'sinon'
    ],

    // list of files / patterns to load in the browser
    files: [
      'node_modules/jquery/dist/jquery.min.js',
      'node_modules/js-cookie/src/js.cookie.js',
      'resources/test/test_helper.js',
      'src/*.spec.js'
    ],

    // list of files to exclude
    exclude: [],

    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
      'src/*.spec.js': 'browserify'
    },

    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['html', 'progress'],

    client: {
      mocha: {
        reporter: 'html',
        ui: 'bdd'
      }
    },

    // web server port
    port: 9876,

    // enable / disable colors in the output (reporters and logs)
    colors: true,

    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,

    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,

    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: ['Chrome'],

    customLaunchers: {
      Chrome_travis_ci: {
        base: 'Chrome',
        flags: ['--no-sandbox']
      }
    },

    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: false,

    browserify: {
      debug: true,
      configure: function (bundle) {
        bundle.on('prebundle', function (bundle) {
          bundle.require('./resources/test/mock-google-tag', {expose: 'mock_google_tag'});
        });
      }
    }
  });

  if (process.env.TRAVIS) {
    config.captureTimeout = 0;
    config.singleRun = true;
    config.autoWatch = false;
    config.browsers = ['Chrome_travis_ci'];
  }
};
