// Simplified version of mantle's jest config

const path = require('path');

module.exports = {
  collectCoverageFrom: [
    '**/*.{js}'
  ],
  // An array of file extensions we use
  moduleFileExtensions: ['js', 'json'],
  // The glob patterns Jest uses to detect test files.
  testMatch: [
    '**/?(*.)(spec.jest).js'
  ],
  // A list of paths to directories that Jest should use to search for files in.
  roots: [
    '<rootDir>/src'
  ],
  projects: [
    '<rootDir>'
  ],
  // The paths to modules that run some code to configure or set up the testing environment before each test.
  // Since every test runs in its own environment, these scripts will be executed
  // in the testing environment immediately before executing the test code itself.
  setupFiles: [
    '<rootDir>/resources/test/setupTest.js'
  ]
};
