module.exports = {
  browserify: {
    files: {
      'templates/dist/module.js': ['templates/js/ads.browserify.js']
    },
    options: {
      alias: {
        'bulbs.ads.units': './templates/js/adUnits.js',
        'bulbs.ads.manager': './src/manager.js'
      }
    }
  }
}
