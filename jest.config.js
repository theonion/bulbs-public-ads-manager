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
  ]
};
