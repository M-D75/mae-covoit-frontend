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
import { far } from '@fortawesome/free-regular-svg-icons'

// Calendar
//import VCalendar from 'v-calendar';
import 'v-calendar/style.css';
import { setupCalendar, Calendar, DatePicker } from 'v-calendar';


// Vuetify
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

//Stripe
// import { StripePlugin } from '@vue-stripe/vue-stripe';

// const options = {
//   pk: process.env.VUE_APP_API_STRIPE_PK,
// //   stripeAccount: process.env.STRIPE_ACCOUNT,
// //   apiVersion: process.env.API_VERSION,
// //   locale: process.env.LOCALE,
// };

//Other
import "@/styles/global.scss";
// import "@/styles/checkout.scss";

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
library.add(far)

// supabase
import supabase from '@/utils/supabaseClient.js';

import stripe from '@/utils/stripe.js';

import VueGoogleMaps from '@fawmi/vue-google-maps'
import './registerServiceWorker'


createApp(App)
    .component('VCalendarIo', Calendar)
    .component('VDatePickerIo', DatePicker)
    .component('font-awesome-icon', FontAwesomeIcon)
    .provide('supabase', supabase)
    .provide('stripe', stripe)
    //.use(VCalendar)
    // .use(StripePlugin, options)
    .use(router)
    .use(store)
    .use(vuetify)
    .use(setupCalendar, {})
    .use(VueGoogleMaps, {
            load: {
                key: process.env.VUE_APP_API_VUE_GOOGLE_MAP,
            },
        })
    .mount('#app')


  