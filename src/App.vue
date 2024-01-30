
<style lang="scss" model>

    // TODO : Property must be shared
    .v-card {
        > .v-list {
            background-color: var(--white-bg-color);
            .v-field__field {
                background-color: var(--white-bg-color);
                color: var(--font-color-label);
            }
        }
        .v-input {
            height: 78px;
            margin-left: 8px;
            margin-bottom: -20px;
            .v-input__prepend {
                //margin-right: 0;
                text-align: center;
                .v-icon {
                    color: var(--gray-icon-color);
                }
            }

            .v-input__control {
                width: 90%;
                // margin-left: 20px;
            }
        }
    }

    .v-card.list::-webkit-scrollbar {
        width: 0;  /* Masquer la barre de défilement verticale */
        height: 0; /* Masquer la barre de défilement horizontale */
    }

    .v-card.list {
        -ms-overflow-style: none;
        > .v-list {
            .v-list-item {
                .v-list-item__content {
                    color: var(--font-color-label);
                }
                .v-list-item__prepend {
                    .v-icon {
                        font-weight: bold;
                        color: var(--gray-icon-color);
                    }
                }
            }
        }
    }
    
</style>

<style lang="scss">
    
    .v-application.v-theme--light.v-layout.v-layout--full-height.v-locale--is-ltr {
        background-color: var(--bg-app-color);
        .v-application__wrap {
            background-color: var(--bg-app-color);
        }
    }
    .v-application.v-theme--dark.v-layout.v-layout--full-height.v-locale--is-ltr {
        background-color: #1a1a1a;
    }

    .text-fs26 {
        font-size: 26px !important;
    }

    * {
        -ms-overflow-style: none !important; /* pour Internet Explorer 10+ */
        scrollbar-width: none !important; /* Firefox */
        overflow: -moz-scrollbars-none m !important; // Firefox
    }

    /* Pour Chrome, Safari */
    *::-webkit-scrollbar {
        // display: none !important;
        width: 0;  /* Masquer la barre de défilement verticale */
        height: 0; /* Masquer la barre de défilement horizontale */
    }

    *::-webkit-scrollbar-track {
        background: transparent;
        display: none !important;
    }

    *::-webkit-scrollbar-thumb {
        background-color: transparent;
        display: none !important;
    }

</style>

<template>
    <v-app class="ligth-mode">
        <router-view v-if="isMobileOrSmallScreen" ref="routerViewRef"/>
        <MobileOnly v-else></MobileOnly>
        <!-- Menu Nav -->
        <BottomNav v-if="isMobileOrSmallScreen && bottomNav"/>
    </v-app>
</template>

<script>

    import $ from 'jquery';
    // natif
    import { StatusBar } from '@capacitor/status-bar';
    import { SafeAreaController, SafeArea } from '@aashu-dubey/capacitor-statusbar-safe-area';
    // import { PushNotifications } from '@capacitor/push-notifications';
    import { Capacitor } from '@capacitor/core';
    import { Plugins } from '@capacitor/core';

    // import stripe from '@/utils/stripe.js'

    const { LocalNotifications } = Plugins;

    // import { FirebaseMessaging } from '@capacitor-firebase/messaging';

    // import axios from 'axios';
    import { mapMutations, mapState, mapActions } from 'vuex';

    const isAndroid = Capacitor.getPlatform() === 'android';
    const isIOS = Capacitor.getPlatform() === 'ios';

    //Component
    import MobileOnly from './views/MobileOnly.vue';
    import BottomNav from './components/menus/BottomNav.vue';

    export default {
        name: 'App',
        components: {
            MobileOnly,
            BottomNav,
        },
        computed: {
            ...mapState("profil", ["darkMode", "userUid", "notification", "profil"]),
            isMobileOrSmallScreen() {
                return this.isMobile || this.isSmallScreen;
            },
            bottomNav() {
                return this.$route.meta.bottomNav;
            },
        },
        data: () => ({
            isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
            isSmallScreen: window.innerWidth <= 600,
        }),
        async mounted(){

            // const account = await stripe.accounts.retrieve('acct_1OUWQcI3Nt412vf3');

            // await stripe.charges.create({
            //     amount: 2000, // Montant en centimes (ex. 2000 pour 20 EUR/USD)
            //     currency: 'eur', // ou 'usd', etc.
            //     source: 'tok_bypassPending', // ou un autre token de carte de test approprié
            //     description: 'Charge de test pour augmenter le solde',
            // });


            // const balance = await stripe.balance.retrieve();
            // console.log("balance", balance);

            // const accountLink = await stripe.accountLinks.create({
            //     account: 'acct_1OUWQcI3Nt412vf3', // ID du compte Stripe de l'utilisateur
            //     refresh_url: 'http://localhost:8080/reauth',
            //     return_url: 'http://localhost:8080/dashboard',
            //     type: 'account_onboarding',
            // });

            // window.location.href = accountLink.url;

            // if(this.profil.infos_perso.email){
            //     // const account = await stripe.accounts.create({
            //     //     type: 'standard',
            //     //     country: 'FR',
            //     //     email: this.profil.infos_perso.email,
            //     // });

            //     // console.log("account-bank", account);

            //     // const external = await stripe.accounts.createExternalAccount(
            //     //     account.id,
            //     //     {
            //     //         external_account: "btok_1NAiJy2eZvKYlo2Cnh6bIs9c",
            //     //     }
            //     // );

            //     // console.log("external-account-ok", external );

            //     const transfert = await stripe.transfers.create({
            //         amount: 1000, // montant en centimes
            //         currency: 'eur',
            //         destination: account.id,
            //         // Autres paramètres du transfert
            //     });

            //     console.log("transfer-ok",transfert );
            // }
            // await stripe.paymentIntents.update(
            //     'pi_3OSuTRIKwmrDLewY15HDSoMz',
            //     {
            //         setup_future_usage: 'on_session'
            //     }
            // );

            // stripe.paymentMethods.list({
            //     customer: 'cus_PGIn2BjIiMbn3j', // Remplacez par l'ID du client
            //     type: 'card',
            // }, function(err, paymentMethods) {
            //     if (err) {
            //         // Gérer l'erreur
            //         console.error(err);
            //     } else {
            //         // Traiter les méthodes de paiement (cartes)
            //         console.log("paymentMethods", paymentMethods);
            //     }
            // });

            // const customer = await stripe.customers.retrieve('cus_P9EoaH2vfbFG6a');
            // console.log("retricve-customer:", customer);


            // const paymentIntents = await stripe.paymentIntents.list({
            //     limit: 30,
            // });

            // for (let index = 0; index < paymentIntents.data.length; index++) {
            //     const paymentIntent = paymentIntents.data[index];
            //     console.log("paymentIntent.amount_received", paymentIntent.amount_received);
            //     if(paymentIntent.amount_received == 0 && paymentIntent.status == "requires_payment_method"){
            //         // const paymentIntentC = await stripe.paymentIntents.cancel(
            //         //     paymentIntent.id
            //         // );

            //         const paymentIntentC = await stripe.paymentIntents.confirm(
            //             paymentIntent.id,
            //             {
            //                 payment_method: 'pm_card_visa',
            //                 return_url: 'http://localhost:8080',
            //             }
            //         );

            //         console.log("paymentIntentC", paymentIntentC, paymentIntent.id);
            //     }
                
            // }

            // console.log("all payments Intens", paymentIntents);

            // const customer = await stripe.customers.create({
            //     name: 'Jenny Rosen',
            //     email: 'jennyrosen@example.com',
            // });

            // const card = await stripe.customers.createSource(
            //     'cus_P9EoaH2vfbFG6a',
            //     {
            //         source: 'tok_mastercard',
            //     }
            // );

            // const customers = await stripe.customers.list({
            //     limit: 10,
            // });

            // console.log("customer", customers, card);
            
            console.log("isMobile:", this.isMobile, window.location);
            console.log("isSmallScreen:", this.isSmallScreen);
            if(isAndroid)
                console.log("You are on Android");
            else if(isIOS)
                console.log("You are on IOS");
            else
                console.log("You are on Web");

            this.SET_IS_NATIVE(isIOS || isAndroid);

            if( this.darkMode ){
                $("#app .v-application").removeClass("ligth-mode");
                $("#app .v-application").addClass("dark-mode");
            }

            console.log("theme-mode:", $("#app .v-application").hasClass("dark-mode") ? "dark" : "ligth");
            
            window.addEventListener('resize', this.updateIsSmallScreen); 

            if(SafeAreaController)
                SafeAreaController.injectCSSVariables();

            // if( isIOS || isAndroid ){
            //     // PushNotifications.requestPermissions().then(result => {
            //     //     console.log("requestPermissions Pusg [OK]");
            //     //     if (result.receive === 'granted') {
            //     //         console.log("in-register");
            //     //         PushNotifications.register();
            //     //         PushNotifications.addListener('pushNotificationReceived', (notification) => {
            //     //             // Gérer la réception de la notification
            //     //             console.log("Notification reçu", JSON.stringify(notification));
            //     //             this.sendNotification(notification.title, notification.body, notification.data);
            //     //         });

            //     //         PushNotifications.addListener('pushNotificationActionPerformed', notification => {
            //     //             // Gérer l'action de l'utilisateur sur la notification
            //     //             console.log("Notification action user", JSON.stringify(notification));
            //     //         });

            //     //         PushNotifications.addListener('registration', token => {
            //     //             console.info('Registration token: ', token.value);
            //     //             this.SET_REGISTER_DEVICE_TOKEN(token.value);
                            
            //     //             const adresse = {local: "http://localhost:3001", online: window.location.protocol == 'http:' ? "http://server-mae-covoit-notif.infinityinsights.fr" : "https://server-mae-covoit-notif.infinityinsights.fr"}
            //     //             axios.post(`${adresse.online}/registerDeviceToken`, {
            //     //                 registerDeviceToken: token.value,
            //     //                 userId: this.userUid,
            //     //             })
            //     //             .then(response => {
            //     //                 console.log(response.data);
            //     //             })
            //     //             .catch(error => {
            //     //                 console.error('Il y a eu une erreur :', error);
            //     //             });
            //     //         });

            //     //         PushNotifications.addListener('registrationError', err => {
            //     //             console.error('Registration error: ', err.error);
            //     //         });
            //     //     } 
            //     //     else {
            //     //         console.log("Autoriasation failed:");
            //     //     }
            //     // });

            //     FirebaseMessaging.requestPermissions().then(result => {
            //         console.log("FirebaseMessaging Access :", result.receive);
            //         if ( result.receive === 'granted' ) {
            //             // const getToken = async () => {
            //             //     const result = await FirebaseMessaging.getToken();
            //             //     return result.token;
            //             // };

            //             // getToken();
                        
            //             const addTokenReceivedListener = async () => {
            //                 await FirebaseMessaging.addListener('tokenReceived', event => {
            //                     console.log('tokenReceived', { event }, event.token);

            //                     this.SET_REGISTER_DEVICE_TOKEN(event.token);
                            
            //                     const adresse = {local: "http://localhost:3001", online: window.location.protocol == 'http:' ? "http://server-mae-covoit-notif.infinityinsights.fr" : "https://server-mae-covoit-notif.infinityinsights.fr"}
            //                     axios.post(`${adresse.online}/registerDeviceToken`, {
            //                         registerDeviceToken: event.token,
            //                         userId: this.userUid,
            //                     })
            //                     .then(response => {
            //                         console.log(response.data);
            //                     })
            //                     .catch(error => {
            //                         console.error('Il y a eu une erreur :', error);
            //                     });
            //                 });
            //             };

            //             addTokenReceivedListener();

            //             const addNotificationReceivedListener = async () => {
            //                 await FirebaseMessaging.addListener('notificationReceived', event => {
            //                     console.log('notificationReceived', { event });
            //                     this.sendNotification(event.notification.title, event.notification.body, event.notification.data);
            //                 });
            //             };

            //             addNotificationReceivedListener();

            //             const addNotificationActionPerformedListener = async () => {
            //                 await FirebaseMessaging.addListener('notificationActionPerformed', event => {
            //                     console.log('notificationActionPerformed', { event });
            //                 });
            //             };

            //             addNotificationActionPerformedListener();
            //         }
            //         else {
            //             console.log("Autoriasation Messaging failed:");
            //         }
            //     });
            // }

            if(isAndroid || isIOS)
                StatusBar.setOverlaysWebView({ overlay: true });

            console.log("Platforme", isAndroid ? 'isAndroid': 'isNotAndroid', isIOS ? 'isIOS' : 'isNotIOS');

            // cordova.plugins.notification.local.schedule([
            //     { id: 1, title: 'My first notification' },
            //     { id: 2, title: 'My firstss notification' }
            // ]);

            // LocalNotifications.schedule({
            //     id: 15,
            //     title: 'Chat with Irish',
            //     icon: 'http://climberindonesia.com/assets/icon/ionicons-2.0.1/png/512/android-chat.png',
            //     text: [
            //         { message: 'I miss you' },
            //         { person: 'Irish', message: 'I miss you more!' },
            //         { message: 'I always miss you more by 10%' }
            //     ]
            // });
            // if(isAndroid || isIOS)
            //     LocalNotifications.schedule({
            //         notifications: [
            //             {
            //                 id: 1,
            //                 title: "title",
            //                 body: "body",
            //                 largeBody: "Incenderat autem audaces usque ad insaniam homines ad haec, quae nefariis egere conatibus, Luscus quidam curator urbis subito visus: eosque ut heiulans baiolorum praecentor ad expediendum quod orsi sunt incitans vocibus crebris. qui haut longe postea ideo vivus exustus est.",
            //                 summaryText: "sumaryText!",
            //                 schedule: { at: new Date(Date.now() + 2000) }, // dans 5 secondes
            //                 iconColor: "red",
            //                 smallIcon: "res://icon",
            //                 largeIcon: "res://icon",
            //             }
            //         ]
            //     });
            
            //$("link[rel*='icon']").attr("href", "/favicon-old.ico");
        },
        methods: {
            ...mapActions("search", ["getOwnTrajetsEk", "getTrajetsEk"]),
            ...mapMutations("profil", ["SET_DARKMODE"]),
            ...mapMutations("auth", ["SET_TOKEN", "SET_REGISTER_DEVICE_TOKEN"]),
            ...mapMutations("general", ["SET_IS_NATIVE"]),
            updateIsSmallScreen() {
                this.isSmallScreen = window.innerWidth <= 600;
            },
            async hideStatusBar(){
                await StatusBar.hide();
            },
            async getStatusBarHeight() {
                const { height } = await SafeArea.getStatusBarHeight();
                return height; // Ex. 29.090909957885742
            },
            async getSafeAreaInsets () {
                const insets = await SafeArea.getSafeAreaInsets();
                return insets; // Ex. { "bottom":34, "top":47, "right":0, "left":0 }
            },
            async sendNotification(title, body, data) {
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
            },
        },
        beforeUnmount() {
            window.removeEventListener('resize', this.updateIsSmallScreen);
        }
    }
</script>
