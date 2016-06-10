/**
 * Watch directories for changes and redo tasks, livereload.
 */
'use strict';

module.exports = {
  scripts: {
    files: ['src/*.js', 'templates/js/adUnits.js', 'index.html'],
    tasks: ['build']
  },
  options: {
    livereload: '<%= connect.options.livereload %>'
  }
};
