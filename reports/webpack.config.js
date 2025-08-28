const path = require('path');

module.exports = {
  entry: './src/main.ts',
  module: {
    rules: [{ test: /\.ts$/, use: 'ts-loader', exclude: /node_modules|main\.js/ }]
  },
  resolve: { extensions: ['.ts', '.js'] },
  output: {
    filename: 'main.js',
    path: __dirname
  },
  mode: 'development'
};