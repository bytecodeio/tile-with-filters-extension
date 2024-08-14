const commonConfig = require("./webpack.config");
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
  ...commonConfig,
  mode: "production",
  optimization: {
    minimize: true,
    minimizer: [new TerserPlugin({
      terserOptions: {
        compress: {
          drop_console: true, // Remove console logs
          drop_debugger: true, // Remove debugger statements
        },
        output: {
          comments: false, // Remove comments
        },
      },
      extractComments: false, // Do not extract comments to a separate file
    })],
  },
};
