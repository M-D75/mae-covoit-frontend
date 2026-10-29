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
import Test from '@/views/Test.vue'
import StripeCheckout from '@/views/StripeCheckout.vue'
import Rating from '@/views/Rating.vue'
import RoadAlerts from '@/views/RoadAlerts.vue'
import AuthCallback from '@/views/AuthCallback.vue'


const routes = [
    {
        path: '/rating',
        name: 'rating',
        component: Rating,
        meta: { requiresAuth: true },
    },
    {
        path: '/checkout',
        name: 'checkout',
        component: StripeCheckout,
        meta: { requiresAuth: true },
    },
    {
        path: '/test',
        name: 'test',
        component: Test,
        meta: { requiresAuth: true },
    },
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
        meta: { requiresAuth: true },
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
        meta: { requiresAuth: true, allowMissingAccount: true },
    },
    {
        path: '/auth/callback',
        name: 'auth-callback',
        component: AuthCallback,
        meta: { requiresAuth: false },
    },
    {
        path: '/member',
        component: ProfilMember,
        meta: { requiresAuth: true },
    },
    {
        path: '/profil',
        component: Profil,
        meta: { requiresAuth: true, bottomNav: true },
    },
    {
        path: '/profil/:action',
        component: Profil,
        meta: { requiresAuth: true, bottomNav: true },
    },
    {
        path: '/profil/perso',
        component: InfosPerso,
        meta: { requiresAuth: true, bottomNav: true },
    },
    {
        path: '/profil/perso/:action',
        component: InfosPerso,
        meta: { requiresAuth: true, bottomNav: true },
    },
    {
        path: '/setting',
        component: Setting,
        meta: { requiresAuth: true },
    },
    {
        path: '/search',
        component: HomeSearch,
        meta: { requiresAuth: true, bottomNav: true },
    },
    {
        path: '/road-alerts',
        name: 'road-alerts',
        component: RoadAlerts,
        meta: { requiresAuth: true, bottomNav: true },
    },
    {
        path: '/results/:depart/:destination/:date/:nbPassenger',
        component: Results,
        props: true,
        meta: { requiresAuth: true },
    },
    {
        path: '/results/shared/:user_uid/:ids',
        component: Results,
        props: true,
        meta: { requiresAuth: true },
    },
    {
        path: '/publish',
        component: Publish,
        meta: { requiresAuth: true, bottomNav: true },
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


import { FirebaseMessaging } from '@capacitor-firebase/messaging';
import { Capacitor } from '@capacitor/core';



import supabase from '@/utils/supabaseClient.js';
import {
    fetchAuthProfileState,
    resolveAuthGuardRedirect,
} from '@/services/authProfile.js';
import store from '../store'; 
import { getDefaultAuthPath, rememberAuthEntry } from '@/services/authEntry.js';




const isAndroid = Capacitor.getPlatform() === 'android';
const isIOS = Capacitor.getPlatform() === 'ios';

import { installTripNotifications } from '@/services/tripNotifications.js';

router.beforeEach(async (to, from, next) => {
    console.log("[index.js] from", from);

    if (to.meta.requiresAuth) {
        const authProfile = await fetchAuthProfileState(supabase);
        const hasAccount = Boolean(authProfile.account);
        if (authProfile.authenticated) rememberAuthEntry();

        store.commit('auth/SET_LOGGED_IN', authProfile.authenticated);
        store.commit('auth/SET_ACCOUNT_CREATED', hasAccount);
        store.commit('profil/SET_USER_UID', authProfile.user?.id || '');
        store.state.profil.userId = authProfile.account?.id || null;

        if(authProfile.profileError){
            console.error('[router] Account profile check failed:', authProfile.profileError);
        }

        const authRedirect = resolveAuthGuardRedirect({
            requiresAuth: Boolean(to.meta.requiresAuth),
            allowMissingAccount: Boolean(to.meta.allowMissingAccount),
            fullPath: to.fullPath,
            requestedPath: to.query.redirect,
            authenticated: authProfile.authenticated,
            hasAccount,
            unauthenticatedPath: getDefaultAuthPath(),
        });
        if(authRedirect){
            return next(authRedirect);
        }
    }

    if ( to.path === '/search' ) {

        // Rating is voluntary and opened explicitly from trip history. A
        // pending booking must never hijack navigation after launch or back.
        // ----------------------------- ------------------------------
        if(isIOS||isAndroid){
            const permission=await FirebaseMessaging.requestPermissions();
            if(permission.receive==='granted')installTripNotifications(store,router).catch(()=>{});
        }
    }
    if(to.meta.requiresAuth && (isIOS||isAndroid))installTripNotifications(store,router).catch(()=>{});
    if(to.path==='/trip' && to.query.tripId && Number(store.state.trip.tripSelected?.id)!==Number(to.query.tripId)){
        await Promise.all([store.dispatch('profil/getTravels'),store.dispatch('profil/getPublish')]);
        const profile=store.state.profil.profil;
        const selected=[...(profile.myTravels||[]),...(profile.myPublish||[])].flatMap(day=>day.infos||[]).find(t=>Number(t.id)===Number(to.query.tripId));
        if(!selected)return next('/profil');
        store.commit('trip/SET_TRIP_SELECTED',selected);
    }

    return next();
    // const requiresAuth = to.meta.requiresAuth;
    // const isUserAuthenticated = store.getters['auth/isAuthenticated'];
    
    // console.log("[index.js] beforeEach...")
    // console.log("[index.js] to.name", to.name)
    // console.log("[index.js] isUserAuthenticated", isUserAuthenticated)
    // if ( requiresAuth && !isUserAuthenticated ) {
    //     next('/login');
    // }
    // else if ( requiresAuth && isUserAuthenticated ) {
    //     const tokenCloseToExpiry = (store.state.auth.tokenExpiry - new Date().getTime()) < (5 * 60 * 1000); // 5 minutes, par exemple

    //     console.log("[index.js] close-to-expire:", tokenCloseToExpiry, store.state.auth.tokenExpiry, new Date(store.state.auth.tokenExpiry))
    //     // if (tokenCloseToExpiry) {
    //     //     await store.dispatch('auth/refreshToken');
    //     // }
    //     next();
    // }
    // else{
    //     next();
    // }
});

export default router
