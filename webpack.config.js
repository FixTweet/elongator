const path = require('path');

module.exports = {
  entry: { worker: './src/server.ts' },
  target: 'webworker',
  devtool: 'source-map',
  output: {
    filename: '[name].js',
    path: path.join(__dirname, 'dist')
  },
  mode: 'production',
  resolve: {
    extensions: ['.ts', '.tsx', '.js'],
    fallback: { util: false }
  },
  optimization: { mangleExports: false },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: 'ts-loader',
        options: { transpileOnly: true }
      }
    ]
  }
};
