const path = require("path");
const webpack = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  mode: "development",
  entry: {
    "page": ["./src/page.ts"],
    "background": ["./src/background.ts"],
    "popup": ["./src/popup.ts", "./src/analytics.js"],
    "option": ["./src/option.ts", "./src/analytics.js"]
  },
  devtool: 'inline-source-map',
  output: {
    filename: "js/[name].bundle.js",
    path: path.resolve(__dirname, "dist")
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: "ts-loader",
        exclude: /node_modules/
      },
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
  resolve: {
    extensions: [ '.tsx', '.ts', '.js' ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      filename: "popup.html",
      template: "./src/html/popup.html",
      chunks: ["popup"],
    }),
    new HtmlWebpackPlugin({
      filename: "option.html",
      template: "./src/html/option.html",
      chunks: ["option"],
    }),
    new webpack.ProvidePlugin({
      $: "jquery",
      jQuery: "jquery",
      "window.jQuery": "jquery",
      "window.$": "jquery"
    }),
    new CopyPlugin([
      { from: "./src/other", to: "./" }
    ])
  ]
};
