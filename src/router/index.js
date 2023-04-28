import { createRouter, createWebHistory } from 'vue-router'
import Home from '@/views/Home.vue'
import LoginSign from '@/views/LoginSign.vue'
import Profil from '@/views/Profil.vue'
import HomeSearch from '@/views/HomeSearch.vue'
import Results from '@/views/Results.vue'
import Publish from '@/views/Publish.vue'


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
    path: '/search',
    component: HomeSearch,
  },
  {
    path: '/results',
    component: Results,
  },
  {
    path: '/publish',
    component: Publish,
  },
  {
    path: '/',
    name: 'home',
    component: Home
  },
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

export default router
