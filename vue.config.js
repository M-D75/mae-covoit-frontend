const { defineConfig } = require('@vue/cli-service')
const sassEmbedded = require('sass-embedded')
require('./scripts/check-release.cjs')
const release=require('./release.json')

module.exports = defineConfig({
    transpileDependencies: true,
    configureWebpack: {plugins:[{apply(compiler){compiler.hooks.thisCompilation.tap('CoviaRelease',compilation=>{
        compilation.hooks.processAssets.tap({name:'CoviaRelease',stage:compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONAL},()=>{
            compilation.emitAsset('release.json',new compiler.webpack.sources.RawSource(JSON.stringify({version:release.web.version,build:release.web.build,protocol:release.protocol})));
        });
    });}}]},
    pages: {
        index: {
            entry: 'src/main.js',
            template: 'public/index.html',
            title: 'Covia',
        },
    },
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
        name: "Covia",
        workboxOptions:{skipWaiting:false,clientsClaim:true},
        assetsVersion: 'covia-20261026',
        iconPaths: {
            faviconSVG: null, favicon32: 'icons/covia-256.png', favicon16: null,
            appleTouchIcon: 'icons/covia-256.png', maskIcon: null, msTileImage: 'icons/covia-256.png',
        },
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
