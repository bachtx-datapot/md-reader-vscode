const configs = require('./webpack.common.js')

module.exports = configs.map(config => ({
  ...config,
  mode: 'development',
  devtool: 'inline-source-map',
  watch: true,
  watchOptions: {
    ignored: ['**/node_modules'],
  },
}))
