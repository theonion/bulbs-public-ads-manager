// Karma configuration
// Generated on Fri Jan 30 2015 20:47:11 GMT+0000 (UTC)

module.exports = function(config) {
  config.set({
    basePath: '../..',

    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: [
      'browserify',
      'chai',
      'mocha'
    ],

    // list of files / patterns to load in the browser
    files: [
      'resources/test/mock-ad-units.js',
      'resources/test/mock-google-tag.js',
      'src/**/*.js',
    ],

    // list of files to exclude
    exclude: [],

    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
      'src/**/*.js': ['browserify'],
    },

    plugins : [
      'karma-browserify',
      'karma-chai',
      'karma-mocha',
      'karma-phantomjs-launcher'
    ],

    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['dots'],

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
    browsers: ['PhantomJS'],

    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: false,

    browserify: {
      debug: true,
      configure: function (bundle) {
        bundle.require('./resources/test/mock-ad-units.js', {expose: 'adUnits'});
        bundle.require('./resources/test/mock-google-tag.js', {expose: 'mockGoogleTag'});
      }
    }
  });

  if (process.env.TRAVIS) {
    config.captureTimeout = 0;
    config.singleRun = true;
    config.autoWatch = false;
  }
};
