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
import MapGoogle from '@/views/MapGoogle.vue'
import CreateAccount from '@/views/CreateAccount.vue'
import CropperAvatar from '@/components/profile/CropperAvatar.vue'
import Trip from '@/views/trip/Trip.vue'
import Chat from '@/views/trip/Chat.vue'
import ProfilMember from '@/views/profil/ProfilMember.vue'

// import store from '../store'; // Chemin d'accès à votre fichier store

const routes = [
    {
        path: '/trip',
        name: 'trip',
        component: Trip,
        meta: { requiresAuth: true },
    },
    {
        path: '/message',
        name: 'chat',
        component: Chat,
        meta: { requiresAuth: true },
    },
    {
        path: '/cropper',
        name: 'cropper',
        component: CropperAvatar,
        meta: { requiresAuth: false },
    },
    {
        path: '/login',
        name: 'login',
        component: LoginSign,
        meta: { requiresAuth: false },
    },
    {
        path: '/sign',
        name: 'sign',
        component: LoginSign,
        meta: { requiresAuth: false },
    },
    {
        path: '/account-info',
        name: 'account-info',
        component: CreateAccount,
        meta: { requiresAuth: true },
    },
    {
        path: '/member',
        component: ProfilMember,
        meta: { requiresAuth: true },
    },
    {
        path: '/profil',
        component: Profil,
        meta: { requiresAuth: true },
    },
    {
        path: '/profil/perso',
        component: InfosPerso,
        meta: { requiresAuth: true },
    },
    {
        path: '/setting',
        component: Setting,
        meta: { requiresAuth: true },
    },
    {
        path: '/search',
        component: HomeSearch,
        meta: { requiresAuth: true },
    },
    {
        path: '/results/:depart/:destination/:date/:nbPassenger',
        component: Results,
        props: true,
        meta: { requiresAuth: true },
    },
    {
        path: '/publish',
        component: Publish,
        meta: { requiresAuth: true },
    },
    {
        path: '/publish/select-car',
        component: SelectCar,
        meta: { requiresAuth: true },
    },
    {
        path: '/hourdep',
        component: HourDepOther,
        meta: { requiresAuth: true },
    },
    {
        path: '/hourpogram',
        component: HourProgram,
        meta: { requiresAuth: true },
    },
    {
        path: '/itineraire',
        component: Itineraire,
        meta: { requiresAuth: true },
    },
    {
        path: '/',
        name: 'home',
        component: Home,
        meta: { requiresAuth: false },
    },
    {
        path: '/map',
        name: 'map',
        component: TestMap,
        meta: { requiresAuth: false },
    },
    {
        path: '/map2',
        name: 'map2',
        component: MapGoogle,
        meta: { requiresAuth: false },
    },
]

const router = createRouter({
    history: createWebHistory(process.env.BASE_URL),
    routes
});

// router.beforeEach(async (to, from, next) => {
//     // const requiresAuth = to.meta.requiresAuth;
//     // const isUserAuthenticated = store.getters['auth/isAuthenticated'];
    
//     // console.log("beforeEach...")
//     // console.log("to.name", to.name)
//     // console.log("isUserAuthenticated", isUserAuthenticated)
//     // if ( requiresAuth && !isUserAuthenticated ) {
//     //     next('/login');
//     // }
//     // else if ( requiresAuth && isUserAuthenticated ) {
//     //     const tokenCloseToExpiry = (store.state.auth.tokenExpiry - new Date().getTime()) < (5 * 60 * 1000); // 5 minutes, par exemple

//     //     console.log("close-to-expire:", tokenCloseToExpiry, store.state.auth.tokenExpiry, new Date(store.state.auth.tokenExpiry))
//     //     // if (tokenCloseToExpiry) {
//     //     //     await store.dispatch('auth/refreshToken');
//     //     // }
//     //     next();
//     // }
//     // else{
//     //     next();
//     // }
// });

export default router
