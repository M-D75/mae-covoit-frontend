const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
    transpileDependencies: true,
    pwa: {
        name: "Shima-GoGoGo",
        themeColor: '#08A0EC',
        msTileColor: '#000000',
        appleMobileWebAppCapable: 'yes',
        appleMobileWebAppStatusBarStyle: 'black',
        
    },
    pluginOptions: {
        vuetify: {
                // https://github.com/vuetifyjs/vuetify-loader/tree/next/packages/vuetify-loader
            }
    }
})
