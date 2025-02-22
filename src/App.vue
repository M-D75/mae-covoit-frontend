
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
    <!-- ligth-mode or dark-mode init ligth-mode -->
    <v-app class="ligth-mode"> 
        <router-view ref="routerViewRef"/>
        <!-- Menu Nav -->
        <BottomNav v-if="isMobileOrSmallScreen && bottomNav"/>
    </v-app>
</template>

<script>

    import $ from 'jquery';
    
    // nativ
    import { StatusBar } from '@capacitor/status-bar';
    import { SafeAreaController } from '@aashu-dubey/capacitor-statusbar-safe-area';
    import { Capacitor } from '@capacitor/core';
    import { Plugins } from '@capacitor/core';
    import { App } from '@capacitor/app';

    // TODO : à supprimé quand eddine aura finit
    // import stripe from '@/utils/stripe.js'

    const { LocalNotifications } = Plugins;

    //import axios from 'axios';
    import { mapMutations, mapState, mapActions } from 'vuex';

    const isAndroid = Capacitor.getPlatform() === 'android';
    const isIOS = Capacitor.getPlatform() === 'ios';

    //Component
    import BottomNav from './components/menus/BottomNav.vue';

    export default {
        name: 'App',
        components: {
            BottomNav,
        },
        computed: {
            ...mapState("profil", ["darkMode", "userUid", "notification", "profil"]),
            ...mapState("search", ["villages"]),
            isMobileOrSmallScreen() {
                return this.isMobile || this.isSmallScreen;
            },
            bottomNav() {
                return this.$route.meta.bottomNav;
            },
        },
        data: () => ({
            isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
            isSmallScreen: window.matchMedia("(max-width: 600px)").matches,
        }),
        beforeMount(){
            // console.log("[App] beforeMount")
        },
        async mounted(){
            App.addListener('appStateChange', this.handleAppStateChange);
            // const account = await stripe.accounts.retrieve('acct_1OUWQcI3Nt412vf3');

            // await stripe.charges.create({
            //     amount: 2000, // Montant en centimes (ex. 2000 pour 20 EUR/USD)
            //     currency: 'eur', // ou 'usd', etc.
            //     source: 'tok_bypassPending', // ou un autre token de carte de test approprié
            //     description: 'Charge de test pour augmenter le solde',
            // });


            // const balance = await stripe.balance.retrieve();
            // console.log("balance", balance);

            // // const balanceTransactions = await stripe.balanceTransactions.list({
            // //     type: 'transfer',
            // // });

            // //tr_1PDsKTIKwmrDLewYoqwuJF8s

            // const transfer = await stripe.transfers.retrieve('tr_1PDsKTIKwmrDLewYoqwuJF8s');

            // txn_3PFmEnIKwmrDLewY0WtIybgR ; txn_3PSO18IKwmrDLewY0dCzve4W
            // const balanceTransaction = await stripe.balanceTransactions.retrieve(
            //     'txn_3PSO18IKwmrDLewY0dCzve4W'
            // );

            // console.log("balanceTransaction------------", balanceTransaction);

            // const charge = await stripe.charges.retrieve(balanceTransaction.source);
            // console.log("charge", charge);


            // const balanceTransaction = await stripe.balanceTransactions.retrieve(
            //     transfer.balance_transaction
            // );

            // console.log(":::balanceTransaction", balanceTransaction);

            // //acct_1OUWQcI3Nt412vf3

            // const person = await stripe.accounts.retrieve('acct_1OUWQcI3Nt412vf3');
            
            // console.log("person:", person);

            // const balanceConnect = await stripe.balance.retrieve({
            //     stripeAccount: 'acct_1OUWQcI3Nt412vf3',
            // });

            // console.log("balanceConnect", balanceConnect);

            // console.log("balanceTransactions", balanceTransactions);

            // const charge = await stripe.charges.retrieve('ch_3PBQT6IKwmrDLewY158XpEE4');


            // const balanceTransaction = await stripe.balanceTransactions.retrieve(
            //     charge.balance_transaction,
            // );


            // console.log("balanceTransaction==",balanceTransaction);

            //ch_3PBQT6IKwmrDLewY158XpEE4

            // const account = await stripe.accounts.update(
            //     'acct_1OUWQcI3Nt412vf3',
            //     {
            //         payouts_enabled: true
            //     }
            // );

            // const capability = await stripe.accounts.retrieveCapability(
            //     'acct_1OUWQcI3Nt412vf3',
            // );

            // console.log("capability", capability);

            // const account = await stripe.accounts.retrieve('acct_1OXTqiI6Y77Tw8qo');
            // console.log("accout-app", account );

            // const transfert = await stripe.payouts.create({
            //     amount: 8 * 100,
            //     currency: 'eur',
            //     destination: "ba_1OVNzwI3Nt412vf3MIzXCITe",
            // });

            // console.log("tra-", transfert);

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
            
            console.log("[App] isMobile:", this.isMobile, window.location);
            console.log("[App] isSmallScreen:", this.isSmallScreen);
            if(isAndroid)
                console.log("[App] You are on Android");
            else if(isIOS)
                console.log("[App] You are on IOS");
            else
                console.log("[App] You are on Web");

            this.SET_IS_NATIVE(isIOS || isAndroid);

            if( this.darkMode ){
                $("#app .v-application").removeClass("ligth-mode");
                $("#app .v-application").addClass("dark-mode");
            }

            console.log("[App] theme-mode:", $("#app .v-application").hasClass("dark-mode") ? "dark" : "ligth");
            
            window.addEventListener('resize', this.updateIsSmallScreen); 

            if(SafeAreaController)
                SafeAreaController.injectCSSVariables();

            if(isAndroid || isIOS)
                StatusBar.setOverlaysWebView({ overlay: true });

            console.log("[App] Platforme", isAndroid ? 'isAndroid': 'isNotAndroid', isIOS ? 'isIOS' : 'isNotIOS');

            console.log("[App] END : mounted App.vue\n\n");
        },
        beforeUnmount() {
            window.removeEventListener('resize', this.updateIsSmallScreen);
            App.removeListener('appStateChange', this.handleAppStateChange);
        },
        methods: {
            ...mapActions("search", ["getOwnTrajetsEk", "getTrajetsEk", "getVillages"]),
            ...mapMutations("profil", ["SET_DARKMODE"]),
            ...mapMutations("auth", ["SET_TOKEN", "SET_REGISTER_DEVICE_TOKEN"]),
            ...mapMutations("general", ["SET_IS_NATIVE", "SET_APP_IS_ACTIVE"]),
            handleAppStateChange(state) {
                if (state.isActive) {
                    console.log("L'application est au premier plan");
                    this.SET_APP_IS_ACTIVE({app: state.isActive});
                } 
                else {
                    console.log("[App] L'application est en arrière-plan");
                    this.SET_APP_IS_ACTIVE({app: state.isActive, search: false});
                }
            },
            updateIsSmallScreen() {
                this.isSmallScreen = window.innerWidth <= 600;
            },
            async hideStatusBar(){
                await StatusBar.hide();
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
                    console.log("[App] permission non accordé");
                }
            },
        },
        

    }
</script>
