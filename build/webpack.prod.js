const { ESBuildMinifyPlugin } = require('esbuild-loader')
const configs = require('./webpack.common.js')

module.exports = configs.map(config => ({
  ...config,
  mode: 'production',
  optimization: {
    minimize: true,
    minimizer: [
      new ESBuildMinifyPlugin({
        target: 'es2021',
        css: true,
      }),
    ],
  },
}))
