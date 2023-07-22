import { createRouter, createWebHistory } from 'vue-router'
import Home from '@/views/Home.vue'
import LoginSign from '@/views/LoginSign.vue'
import Profil from '@/views/Profil.vue'
import InfosPerso from '@/views/profil/InfosPerso.vue'
import Setting from '@/views/profil/Setting.vue'
import HomeSearch from '@/views/HomeSearch.vue'
import Results from '@/views/Results.vue'
import Publish from '@/views/Publish.vue'
import SelectCar from '@/views/publish/SelectCar.vue'
import HourDepOther from '@/components/publish/HourDepOther.vue'
import HourProgram from '@/components/publish/HourProgram.vue'
import Itineraire from '@/components/publish/Itineraire.vue'
import TestMap from '@/views/TestMap.vue'

const routes = [
  {
    path: '/login',
    component: LoginSign,
  },
  {
    path: '/sign',
    component: LoginSign,
  },
  {
    path: '/profil',
    component: Profil,
  },
  {
    path: '/profil/perso',
    component: InfosPerso,
  },
  {
    path: '/setting',
    component: Setting,
  },
  {
    path: '/search',
    component: HomeSearch,
  },
  {
    path: '/results/:depart/:destination/:date/:nbPassager',
    component: Results,
    props: true,
  },
  {
    path: '/publish',
    component: Publish,
  },
  {
    path: '/publish/select-car',
    component: SelectCar,
  },
  {
    path: '/hourdep',
    component: HourDepOther,
  },
  {
    path: '/hourpogram',
    component: HourProgram,
  },
  {
    path: '/itineraire',
    component: Itineraire,
  },
  {
    path: '/',
    name: 'home',
    component: Home
  },
  {
    path: '/map',
    name: 'map',
    component: TestMap
  },
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

export default router
