const merge = require("webpack-merge");
const common = require("./webpack.common");

module.exports = merge(common, {
  mode: "production",
  entry: {
    "popup": ["./src/popup.ts", "./src/analytics.js"],
    "option": ["./src/option.ts", "./src/analytics.js"]
  },
});
