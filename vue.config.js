const { defineConfig } = require('@vue/cli-service')
const sassEmbedded = require('sass-embedded')

module.exports = defineConfig({
    transpileDependencies: true,
    css: {
        loaderOptions: {
            sass: {
                implementation: sassEmbedded,
            },
            scss: {
                implementation: sassEmbedded,
            },
        },
    },
    pwa: {
        name: "Shima-GoGoGo",
        themeColor: '#1a1a1a',
        msTileColor: '#000000',
        appleMobileWebAppCapable: 'yes',
        appleMobileWebAppStatusBarStyle: 'black',
        
    },
    pluginOptions: {
        vuetify: {
            // https://github.com/vuetifyjs/vuetify-loader/tree/next/packages/vuetify-loader
        }
    },
    // css: {
    //     loaderOptions: {
    //         sass: {
    //             prependData: `@import '@/styles/global.scss';`,
    //         }
    //     }
    // }
    // chainWebpack: (config) => {
    //     config.optimization.delete('splitChunks');
    //     config
    //       .plugin('limitSplitChunks')
    //       .use(webpack.optimize.LimitChunkCountPlugin, [{ maxChunks: 1 }]);
    // },
    devServer: {
        host: '0.0.0.0',
        allowedHosts: 'all',
        /* your settings */
    },
})
