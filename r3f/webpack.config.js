const path = require('path');

module.exports = {
    entry: {
        'zesty-r3f-sdk': './src/ZestyAd.js',
    },
    output: {
        filename: '[name].js',
        path: path.resolve(__dirname, 'dist'),
        libraryTarget: 'umd'
    },
    devServer: {
        contentBase: __dirname,
        publicPath: '/dist/',
        disableHostCheck: true // required for localtunnel to work (https://github.com/webpack/webpack-dev-server/issues/882)
    },
    devtool: 'source-map',
    module: {
        rules: [
            {
                test: /\.m?js$/,
                exclude: /(node_modules|bower_components)/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: [
                            '@babel/preset-env', 
                            ['@babel/preset-react', { "runtime": "automatic" }]
                        ],
                        plugins: ['@babel/plugin-transform-runtime']
                    }
                }
            }
        ]
    },
    externals: {
        "react": "react",
        "react-dom": "react-dom",
        "@react-three/fiber": "@react-three/fiber",
        "@react-three/xr": "@react-three/xr",
        "three": "three"
    }
};
