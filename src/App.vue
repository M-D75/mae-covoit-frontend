
<style lang="scss" model>
    // .v-app {
    //     height: 100dvh !important;
    // }
</style>

<style lang="scss">

    .ligth-mode * {
        --bg-app-color: #f5f5f5;
        --white-bg-color: #FBFBFB;
        --gray-bg-icon-color: #b1b1b1;
        --blue-color: #2E8DFF;
        --gray-icon-color: #B1B1B1;
        
        // font
        --font-color-label: #1E1F26;
        --font-size-h1: 24px;
        --font-size-h1-toolbar: 16px;
        --font-size-subtitle-toolbar: 8px;
        --box-shadow-card: 0px 2px 24px rgba(17,17,17,0.04);
        --box-shadow-card-v2: 0px 0px 16px rgba(17,17,17,0.16);
    }

    .dark-mode * {
        --bg-app-color: #1a1a1a;
        --white-bg-color: #333333;
        --gray-bg-icon-color:  #b1b1b1;
        --blue-color: #2E8DFF;
        --gray-icon-color: #B1B1B1;

        // font
        --font-color-label: #FBFBFB;
        --font-size-h1: 24px;
        --font-size-h1-toolbar: 16px;
        --font-size-subtitle-toolbar: 8px;
        --box-shadow-card: 0px 2px 24px #111;
        --box-shadow-card-v2: 0px 0px 16px #111;
    }

    * {
        --safe-top: var(--safe-area-inset-top);
        font-family: 'Rubik';
        letter-spacing: 0;
    }


    
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
    import { mapMutations, mapState } from 'vuex';

    export default {
        name: 'App',
        components: {
            MobileOnly,
        },
        computed: {
            ...mapState("profil", ["darkMode"]),
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
            console.log("isMobile:", this.isMobile);
            console.log("isSmallScreen:", this.isSmallScreen);
            if(isAndroid)
                console.log("You are on Android");
            else if(isIOS)
                console.log("You are on IOS");
            else
                console.log("You are on Web");

            
            
            if( this.darkMode ){
                $("#app .v-application").removeClass("ligth-mode");
                $("#app .v-application").addClass("dark-mode");
            }

            console.log("theme-mode:", $("#app .v-application").hasClass("dark-mode") ? "dark" : "ligth");
            
            window.addEventListener('resize', this.updateIsSmallScreen); 

            if(SafeAreaController)
                SafeAreaController.injectCSSVariables();

            if( isIOS || isAndroid ){
                PushNotifications.requestPermissions().then(result => {
                    if (result.receive === 'granted') {
                        PushNotifications.register();
                        PushNotifications.addListener('pushNotificationReceived', notification => {
                            // Gérer la réception de la notification
                            console.log("Notification reçu", JSON.stringify(notification));
                            this.sendNotification(notification.title, notification.body);
                        });

                        PushNotifications.addListener('pushNotificationActionPerformed', notification => {
                            // Gérer l'action de l'utilisateur sur la notification
                            console.log("Notification action user", JSON.stringify(notification));
                        });

                        PushNotifications.addListener('registration', token => {
                            console.info('Registration token: ', token.value);
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

            if(isAndroid)
                StatusBar.setOverlaysWebView({ overlay: true });

            console.log("platform", isAndroid, isIOS);
            
            //$("link[rel*='icon']").attr("href", "/favicon-old.ico");
        },
        methods: {
            ...mapMutations("profil", ["SET_DARKMODE"]),
            ...mapMutations("auth", ["SET_TOKEN"]),
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
            async sendNotification(title, body) {
                const permission = await LocalNotifications.requestPermissions();
               
                if( permission ){

                    await LocalNotifications.schedule({
                        notifications: [
                            {
                                id: 1,
                                title: title,
                                body: body,
                                summaryText: "sumaryText!",
                                schedule: { at: new Date(Date.now() + 2000) }, // dans 5 secondes
                                iconColor: "red",
                                smallIcon: "res://large_logo",
                                largeIcon: "res://large_logo",
                            }
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
