import { createRouter, createWebHistory } from 'vue-router'
import Home from '@/views/Home.vue'
import LoginSign from '@/views/LoginSign.vue'
import HomeSearch from '@/views/HomeSearch.vue'
import Reservation from '@/views/Reservation.vue'


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
    path: '/search',
    component: HomeSearch,
  },
  {
    path: '/reserve',
    component: Reservation,
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
