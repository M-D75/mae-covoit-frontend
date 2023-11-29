const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
    transpileDependencies: true,
    pwa: {
        name: "Shima-GoGoGo",
        themeColor: '#1a1a1a',
        msTileColor: '#000000',
        appleMobileWebAppCapable: 'yes',
        appleMobileWebAppStatusBarStyle: 'black',
        iconPaths: {
            favicon32: './assets/logo.png',
            favicon16: './assets/logo.png',
            appleTouchIcon: './assets/logo.png',
            maskIcon: './assets/logo.png',
            msTileImage: './assets/logo.png'
        }
    },
    pluginOptions: {
        vuetify: {
            // https://github.com/vuetifyjs/vuetify-loader/tree/next/packages/vuetify-loader
        }
    }
})
