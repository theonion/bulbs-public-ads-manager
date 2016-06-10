/**
 * Main entrypoint for grunt.
 */
'use strict';

module.exports = function(grunt) {
  require('./package.json');

  var config = grunt.util._.extend(
    require('load-grunt-config')(grunt, {
      configPath: require('path').join(process.cwd(), 'tasks/options'),
      init: false
    })
  );

  grunt.initConfig(config);

  grunt.loadTasks('tasks');

  grunt.registerTask('build', function() {
    grunt.task.run([
      'browserify'
    ]);
  });

  grunt.registerTask('serve', ['build', 'connect:livereload', 'watch']);

  grunt.registerTask('default', ['serve']);
};
