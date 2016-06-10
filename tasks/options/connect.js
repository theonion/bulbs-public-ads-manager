/**
 * Configurations for static web server.
 */
'use strict';

module.exports = {
  options: {
    port: 9000,
    hostname: 'localhost',
    livereload: 35729
  },
  livereload: {
    options: {
      open: true,
      port: 9000,
      hostname: 'localhost',
      base: {
        path: './templates',
        options: {
          index: 'index.html',
          maxAge: 300000
        }
      }
    }
  }
};
