
<style lang="scss" model>
    // .v-app {
    //     height: 100dvh !important;
    // }

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

</style>

<template>
    <v-app class="ligth-mode">
        <router-view v-if="isMobileOrSmallScreen"/>
        <MobileOnly v-else></MobileOnly>
    </v-app>
</template>

<script>

    import $ from 'jquery';
    // natif
    import { StatusBar } from '@capacitor/status-bar';
    import { SafeAreaController, SafeArea } from '@aashu-dubey/capacitor-statusbar-safe-area';
    import { PushNotifications } from '@capacitor/push-notifications';
    import { Capacitor } from '@capacitor/core';
    import { Plugins } from '@capacitor/core';

    const { LocalNotifications } = Plugins;

    import axios from 'axios';

    // const addListeners = async () => {
    //     await PushNotifications.addListener('registration', token => {
    //         console.info('Registration token: ', token.value);
    //     });

    //     await PushNotifications.addListener('registrationError', err => {
    //         console.error('Registration error: ', err.error);
    //     });

    //     await PushNotifications.addListener('pushNotificationReceived', notification => {
    //         console.log('Push notification received: ', notification);
    //     });

    //     await PushNotifications.addListener('pushNotificationActionPerformed', notification => {
    //         console.log('Push notification action performed', notification.actionId, notification.inputValue);
    //     });
    // }

    // const registerNotifications = async () => {
    //     let permStatus = await PushNotifications.checkPermissions();

    //     if (permStatus.receive === 'prompt') {
    //         permStatus = await PushNotifications.requestPermissions();
    //     }

    //     if (permStatus.receive !== 'granted') {
    //         throw new Error('User denied permissions!');
    //     }

    //     await PushNotifications.register();
    // }

    // const getDeliveredNotifications = async () => {
    //     const notificationList = await PushNotifications.getDeliveredNotifications();
    //     console.log('delivered notifications', notificationList);
    // }

    const isAndroid = Capacitor.getPlatform() === 'android';
    const isIOS = Capacitor.getPlatform() === 'ios';

    //Component
    import MobileOnly from './views/MobileOnly.vue';
    import { mapMutations, mapState, mapActions } from 'vuex';

    export default {
        name: 'App',
        components: {
            MobileOnly,
        },
        computed: {
            
            ...mapState("profil", ["darkMode", "userUid", "notification"]),
            isMobileOrSmallScreen() {
                return this.isMobile || this.isSmallScreen;
            },
        },
        data: () => ({
            // supabase: inject('supabase'),
            isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
            isSmallScreen: window.innerWidth <= 600,
        }),
        mounted(){
            
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

            console.log("-------vrrr,", this.$var_test, this.var_test);
            console.log("theme-mode:", $("#app .v-application").hasClass("dark-mode") ? "dark" : "ligth");
            
            window.addEventListener('resize', this.updateIsSmallScreen); 

            if(SafeAreaController)
                SafeAreaController.injectCSSVariables();

            if( isIOS || isAndroid ){
                PushNotifications.requestPermissions().then(result => {
                    if (result.receive === 'granted') {
                        PushNotifications.register();
                        PushNotifications.addListener('pushNotificationReceived', (notification) => {
                            // Gérer la réception de la notification
                            console.log("Notification reçu", JSON.stringify(notification));
                            this.sendNotification(notification.title, notification.body, notification.data);
                        });

                        PushNotifications.addListener('pushNotificationActionPerformed', notification => {
                            // Gérer l'action de l'utilisateur sur la notification
                            console.log("Notification action user", JSON.stringify(notification));
                        });

                        PushNotifications.addListener('registration', token => {
                            console.info('Registration token: ', token.value);
                            this.SET_REGISTER_DEVICE_TOKEN(token.value);
                            
                            const adresse = {local: "http://localhost:3001", online: window.location.protocol == 'http:' ? "http://server-mae-covoit-notif.infinityinsights.fr" : "https://server-mae-covoit-notif.infinityinsights.fr"}
                            axios.post(`${adresse.online}/registerDeviceToken`, {
                                registerDeviceToken: token.value,
                                userId: this.userUid,
                            })
                            .then(response => {
                                console.log(response.data);
                            })
                            .catch(error => {
                                console.error('Il y a eu une erreur :', error);
                            });
                        });

                        PushNotifications.addListener('registrationError', err => {
                            console.error('Registration error: ', err.error);
                        });
                    } else {
                        // Handle denial of permission
                        console.log("Autoriasation failed:");
                    }
                });

                // registerNotifications();
                // addListeners();
                // getDeliveredNotifications();
            }

            if(isAndroid || isIOS)
                StatusBar.setOverlaysWebView({ overlay: true });

            console.log("platform", isAndroid, isIOS);

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
            // window.removeEventListener('resize', this.updateIsSmallScreen);
        }
    }
</script>
