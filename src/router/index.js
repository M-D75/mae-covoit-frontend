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
// import store from '../store'; // Chemin d'accès à votre fichier store

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
        path: '/results/:depart/:destination/:date/:nbPassenger',
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
import axios from 'axios';
// import store from '../store'; 

import { Plugins } from '@capacitor/core';

// import stripe from '@/utils/stripe.js'

const { LocalNotifications } = Plugins;


const isAndroid = Capacitor.getPlatform() === 'android';
const isIOS = Capacitor.getPlatform() === 'ios';

async function sendNotification(title, body, data) {
    const permission = await LocalNotifications.requestPermissions();
   
    if( permission && this.notification ){

        let option = {
            id: 1,
            title: title,
            body: body,
            summaryText: "!",
            schedule: { at: new Date(Date.now() + 2000) }, // dans 5 secondes
            iconColor: "red",
            smallIcon: "res://icon",
            largeIcon: "res://icon",
        };

        if( data.largeBody != undefined )
            option["largeBody"] = data.largeBody;

        await LocalNotifications.schedule({
            notifications: [
                option,
            ]
        });
    }
    else{
        console.log("permission non accordé");
    }
}

let initFireBase = false;
router.beforeEach(async (to, from, next) => {
    console.log("from", from);
    if (to.path === '/search') {

        // if(store.state.trip.rating){

        // }
        
        if( (isIOS || isAndroid) && !initFireBase ){
            initFireBase = true;
            FirebaseMessaging.requestPermissions().then(result => {
                console.log("FirebaseMessaging Access :", result.receive);
                if ( result.receive === 'granted' ) { 
                    const addTokenReceivedListener = async () => {
                        await FirebaseMessaging.addListener('tokenReceived', event => {
                            console.log('tokenReceived', { event }, event.token);

                            this.SET_REGISTER_DEVICE_TOKEN(event.token);
                        
                            const adresse = {local: "http://localhost:3001", online: window.location.protocol == 'http:' ? "http://server-mae-covoit-notif.infinityinsights.fr" : "https://server-mae-covoit-notif.infinityinsights.fr"}
                            axios.post(`${adresse.online}/registerDeviceToken`, {
                                registerDeviceToken: event.token,
                                userId: this.userUid,
                            })
                            .then(response => {
                                console.log(response.data);
                            })
                            .catch(error => {
                                console.error('Il y a eu une erreur :', error);
                            });
                        });
                    };

                    addTokenReceivedListener();

                    const addNotificationReceivedListener = async () => {
                        await FirebaseMessaging.addListener('notificationReceived', async (event) => {
                            console.log('notificationReceived', { event });
                            await sendNotification(event.notification.title, event.notification.body, event.notification.data);
                        });
                    };

                    addNotificationReceivedListener();

                    const addNotificationActionPerformedListener = async () => {
                        await FirebaseMessaging.addListener('notificationActionPerformed', event => {
                            console.log('notificationActionPerformed', { event });

                            // actions:
                            if( event.notification.data.actions != undefined ){

                                // go to path ex: open mes trajets
                                if( event.notification.data.actions.goTo != undefined ){
                                    // next(event.notification.data.actions.goTo);
                                    router.replace(event.notification.data.actions.goTo);
                                }
                            }
                        });
                    };

                    addNotificationActionPerformedListener();
                }
                else {
                    console.log("Autoriasation Messaging failed:");
                }
            });
        }
    }

    next();
    // const requiresAuth = to.meta.requiresAuth;
    // const isUserAuthenticated = store.getters['auth/isAuthenticated'];
    
    // console.log("beforeEach...")
    // console.log("to.name", to.name)
    // console.log("isUserAuthenticated", isUserAuthenticated)
    // if ( requiresAuth && !isUserAuthenticated ) {
    //     next('/login');
    // }
    // else if ( requiresAuth && isUserAuthenticated ) {
    //     const tokenCloseToExpiry = (store.state.auth.tokenExpiry - new Date().getTime()) < (5 * 60 * 1000); // 5 minutes, par exemple

    //     console.log("close-to-expire:", tokenCloseToExpiry, store.state.auth.tokenExpiry, new Date(store.state.auth.tokenExpiry))
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
