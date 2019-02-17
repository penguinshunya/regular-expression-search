const merge = require("webpack-merge");
const common = require("./webpack.common");

module.exports = merge(common, {
  mode: "development",
  entry: {
    "popup": "./src/popup.ts",
    "option": "./src/option.ts"
  },
  devtool: "inline-source-map",
  devServer: {
    contentBase: "./dist"
  }
});
