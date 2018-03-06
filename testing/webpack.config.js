const webpack = require('webpack');
const Minify = require('babel-minify-webpack-plugin');
const path = require('path');

module.exports = {
  devtool: 'inline-source-map',
  entry: path.join(__dirname, 'entry.js'),
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'script.js',
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            plugins: [],
          }
        }
      }
    ]
  },
  plugins: [
    // new Minify(),
  ]
}