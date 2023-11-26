const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
    transpileDependencies: true,
    pwa: {
        name: "Shima-GoGoGo",
        themeColor: '#08A0EC',
        msTileColor: '#000000',
        appleMobileWebAppCapable: 'yes',
        appleMobileWebAppStatusBarStyle: 'black',
        iconPaths: {
            favicon32: 'src/assets/logo.png',
            favicon16: 'src/assets/logo.png',
            appleTouchIcon: 'src/assets/logo.png',
            maskIcon: 'src/assets/logo.png',
            msTileImage: 'src/assets/logo.png'
        }
    },
    pluginOptions: {
        vuetify: {
            // https://github.com/vuetifyjs/vuetify-loader/tree/next/packages/vuetify-loader
        }
    }
})
