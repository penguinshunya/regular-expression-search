const path = require("path");

module.exports = {
  mode: "development",
  entry: {
    "popup": "./src/popup.js"
  },
  output: {
    filename: "js/[name].bundle.js",
    path: path.resolve(__dirname, "dist")
  }
};
