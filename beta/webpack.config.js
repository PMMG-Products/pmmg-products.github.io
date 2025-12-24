const path = require('path');

module.exports = {
  entry: './src/main.ts',
  module: {
    rules: [{ test: /\.ts$/, use: 'ts-loader', exclude: /node_modules|main\.js/ }]
  },
  resolve: { extensions: ['.ts', '.js'],
    fallback: {
      fs: false,
      path: false,
      crypto: false
    }
   },
  output: {
    filename: 'main.js',
    path: __dirname
  },
  mode: 'development'
};