// App
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import { loadFonts } from './plugins/webfontloader'
import "vuetify/styles";
import '@mdi/font/css/materialdesignicons.css'
import { aliases, mdi } from 'vuetify/iconsets/mdi'

// Icon & font
import { fa } from 'vuetify/iconsets/fa-svg'
import { library } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { fas } from '@fortawesome/free-solid-svg-icons'
import { fab } from '@fortawesome/free-brands-svg-icons'

// Calendar
import VCalendar from 'v-calendar';
import 'v-calendar/style.css';

// Vuetify
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

const vuetify = createVuetify({
    components,
    directives,
    iconfont: 'mdi',
    icons: {
        defaultSet: 'mdi',
        aliases,
        sets: {
            mdi,
            fa,
        },
    },
})

loadFonts();

// Includes needed icons
library.add(fas) 
library.add(fab)

// supabase
import supabase from '@/utils/supabaseClient.js';

createApp(App)
  .component('font-awesome-icon', FontAwesomeIcon)
  .provide('supabase', supabase)
  .use(VCalendar)
  .use(router)
  .use(store)
  .use(vuetify)
  .mount('#app')
  