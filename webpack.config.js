const path = require("path");
const webpack = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
  mode: "development",
  entry: {
    "page": ["./src/page.js"],
    "background": ["./src/background.js"],
    "popup": ["./src/popup.js", "./src/analytics.js"],
    "option": ["./src/option.js", "./src/analytics.js"]
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
        loader: "file-loader",
        options: {
          outputPath: "asset/image/"
        }
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/,
        loader: "file-loader",
        options: {
          outputPath: "asset/font/"
        }
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      inject: false,
      filename: "popup.html",
      template: "./src/html/popup.html",
    }),
    new HtmlWebpackPlugin({
      inject: false,
      filename: "option.html",
      template: "./src/html/option.html",
    }),
    new webpack.ProvidePlugin({
      $: "jquery",
      jQuery: "jquery",
      "window.jQuery": "jquery",
      "window.$": "jquery"
    })
  ]
};
