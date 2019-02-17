const path = require("path");

module.exports = {
  mode: "development",
  entry: {
    "popup": ["./src/analytics.js", "./src/popup.js"],
    "option": ["./src/option.js"]
  },
  devtool: 'inline-source-map',
  output: {
    filename: "js/[name].bundle.js",
    path: path.resolve(__dirname, "dist")
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [
          "style-loader",
          "css-loader"
        ]
      },
      {
        test: /\.(png|svg|jpg|gif)$/,
        use: [
          'file-loader'
        ]
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/,
        use: [
          'file-loader'
        ]
      }
    ]
  }
};
