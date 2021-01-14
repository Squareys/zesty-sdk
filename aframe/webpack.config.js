const path = require('path');

module.exports = {
    entry: {
        'zesty-aframe-sdk': './src/index.js',
        'zesty-wle': './src/index-wle.js',
    },
    output: {
        filename: '[name].js',
        path: path.resolve(__dirname, 'dist')
    },
    devServer: {
        contentBase: __dirname,
        publicPath: '/dist/',
        disableHostCheck: true // required for localtunnel to work (https://github.com/webpack/webpack-dev-server/issues/882)
    },
};
