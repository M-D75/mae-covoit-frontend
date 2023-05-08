import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import { loadFonts } from './plugins/webfontloader'
import "vuetify/styles";
import '@mdi/font/css/materialdesignicons.css'

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
})

loadFonts();

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
   apiKey: "AIzaSyAgamj95y7vuFYoT6PrDvXfna7WxnYu1mI",
   authDomain: "mae-covoit.firebaseapp.com",
   projectId: "mae-covoit",
   storageBucket: "mae-covoit.appspot.com",
   messagingSenderId: "142464616385",
   appId: "1:142464616385:web:354806411da6cec5fb9140",
   measurementId: "G-MZRP58FWL3"
};

// Initialize Firebase
//const app = initializeApp(firebaseConfig);

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

createApp(App)
  .use(analytics)
  .use(VCalendar)
  .use(router)
  .use(store)
  .use(vuetify)
  .mount('#app')
