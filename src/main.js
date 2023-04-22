import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
// import vuetify from './plugins/vuetify'
import { loadFonts } from './plugins/webfontloader'
import "vuetify/styles";
// import 'material-design-icons-iconfont/dist/material-design-icons.css' // Ensure you are using css-loader
import '@mdi/font/css/materialdesignicons.css' // Ensure you are using css-loader

// Vuetify
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

const vuetify = createVuetify({
  components,
  directives,
  iconfont: 'mdi',
})

// createApp(App).use(vuetify).mount('#app')


loadFonts()

createApp(App)
  .use(router)
  .use(store)
  .use(vuetify)
  .mount('#app')
