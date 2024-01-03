
<style lang="scss" model>
    /*.v-input .v-input__control .v-text-field .v-field--prepended.v-field--variant-solo.v-theme--light {
        box-shadow: none !important;
        background-color: white !important;
    }*/

    .login-sign.ligth-mode * {
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

    .v-field--variant-solo {
        box-shadow: none !important;
        background-color: white !important;
        border-radius: 50px;
    }

    .v-main {
        width: 100%;
    }

    .v-snackbar {
        .v-snackbar__content{
            display: flex;
            i {
                margin-right: 5px;
            }
            span {
                text-align: left;
                color: white;
            }
        }
    }
</style>


<!-- scss -->
<style lang="scss" scoped>
    .v-application {
        background-color: #eee;
        overflow: visible;
    }

    .v-container {
        margin: auto;
        width: 100%;
        .bloc-part{
            margin: 50px auto;
        }

        .v-snackbar {
            .v-snackbar__content{
                display: flex;
                span {
                    color: white;
                }
            }
        }
        
    }

    .v-field--variant-solo {
        box-shadow: none !important;
        // background-color: white !important;
    }


    a, span {
        text-decoration: none;
        color: gray;
        text-align:center; 
        display: block; 
        width:100%;
        cursor: pointer;
    }

    .foot-part {
        height: 100px;
        position: absolute;
        bottom: 0px;
        width: 100%;
    }

    .line-p {
        width: 100%;
        height: 0px;
        margin: auto;
    }

    .bloc-btn-social-media {
        margin-top: 20px;
        margin-bottom: 20px;
        width: 100%;
    }

    .v-btn{
        color: var(--font-color-label);
    }
</style>

    
<!--  -->
<template>
    <v-app class="ligth-mode login-sign">
        <v-container >
            <!-- From Sign/Connexion -->
            <v-row class="bloc-part">
                <v-col>
                    <v-form>
                        <v-text-field
                            v-model="email"
                            :error-messages="emailErrors"
                            label="E-mail"
                            type="email"
                            required
                            variant="solo"
                        ></v-text-field>

                        <v-text-field
                            v-if="!passwordForgetMode"
                            variant="solo"
                            v-model="password"
                            type="password"
                            :error-messages="passwordErrors"
                            :rules="[rules.required, rules.min]"
                            label="Mot de passe"
                            required
                        ></v-text-field>

                        <v-row>
                            <v-col>
                                <v-btn
                                    v-if="!passwordForgetMode"
                                    class="mr-4 text-none"
                                    @click="authService( modeLogin ? 'emailSignIn' : 'emailSignUp')"
                                    rounded="xl" 
                                    size="x-large"
                                    variant="outlined"
                                    block
                                >
                                    {{ modeLogin ? "Connexion" : "S'inscrire" }}
                                </v-btn>

                                <!-- btn-recovery-password -->
                                <v-btn 
                                    v-else
                                    class="mr-4 text-none"
                                    @click="recoveryPasswordSupabase()"
                                    rounded="xl" 
                                    size="x-large"
                                    variant="outlined"
                                    block
                                >
                                    Envoyer
                                </v-btn>
                            </v-col>
                        </v-row>

                        <v-row v-if="modeLogin && !passwordForgetMode">
                            <v-col>
                                <span @click="passwordForgetMode=true" >Mot de passe oublié ?</span>
                            </v-col>
                        </v-row>
                    </v-form>
                </v-col>
            </v-row>


            <!-- Connectez vous avec -->
            <v-row 
                v-if="!passwordForgetMode"
                class="bloc-part"
            >
                <v-col>
                    
                <v-row>
                    <v-col style="display: flex;">
                        <div class="line-p" style="border: solid 1px #bbb;"></div>
                        <p class="con-with" style="color: gray; width:700px; text-align:center;">Connectez vous avec</p>
                        <div class="line-p" style="border: solid 1px #bbb"></div>
                    </v-col>
                </v-row>

                <!-- btn-co-via-service -->
                <div class="bloc-btn-social-media text-center">

                    <v-btn
                        v-for="(icon, index) in icons" v-bind:key="index"
                        class="mx-2"
                        fab
                        :color='icon.color'
                        rounded="xl"
                        size="large"
                        @click="authServiceSupabse(icon.fn)"
                    >
                        <v-icon dark>
                            {{ icon.icn }}
                        </v-icon>
                    </v-btn>

                </div>

                </v-col>
            </v-row>

        </v-container>

        <div class="foot-part">
            <v-col>
                <span id="create-or-login" @click="createOrLoginSwitchMode()">{{ labelModeCreateOrLogin }}</span>
            </v-col>
        </div>

        <!-- message -->
        <v-snackbar
            v-model="showSnackbar"
            :timeout="4000"
        >
            <v-icon icon="$success"></v-icon> <span>{{ messageSnackbar }}</span>
        </v-snackbar>

        <!-- message error -->
        <v-snackbar
            v-model="showSnackbarError"
            :timeout="4000"
            color="error"
        >
            <div class="contain-ico">
                <v-icon icon="mdi-alert-circle"></v-icon> 
            </div>
            <div>
                <span>{{ messageSnackbarError }}</span>
            </div>
        </v-snackbar>
    </v-app>

    <!-- Load -->
    <v-overlay
        :model-value="overlayLoad"
        class="align-center justify-center"
    >
        <v-progress-circular
            color="black"
            indeterminate
            size="64"
        ></v-progress-circular>
    </v-overlay>

</template>




<!--  -->
<script>
    // import $ from 'jquery'
    import { inject } from 'vue';
    import { mapActions, mapMutations, mapState } from "vuex";

    import { App } from '@capacitor/app';
    import { Plugins } from '@capacitor/core';
    import { Capacitor } from '@capacitor/core';

    const { LocalNotifications } = Plugins;

    const isAndroid = Capacitor.getPlatform() === 'android';
    const isIOS = Capacitor.getPlatform() === 'ios';

    export default {
        setup() {

        },
        computed: {
            ...mapState("auth", ["logged_in", "account_created"]),
            ...mapActions("auth", ["refreshToken", "checkSession"]),
        },
        data() {
            return {
                showSnackbar: false,
                messageSnackbar: "Success",
                showSnackbarError: false,
                messageSnackbarError: "Error",
                overlayLoad: true,
                supabase: inject('supabase'),
                modeLogin: this.$route.path == '/login' ? true : false,
                labelModeCreateOrLogin: this.$route.path == '/login' ? "Pas encore de compte ?" : "Vous avez déjà un compte ?",
                email: "",
                emailErrors: "",
                password: "",
                passwordErrors: "",
                passwordForgetMode: false,
                data: null,
                error: null,
                translateMessageAuth: {
                    "Signup requires a valid password": "Mot de passe non valide",
                    "To signup, please provide your email": "Mail non valide",
                    "Unable to validate email address: invalid format": "Impossible de valider l'adresse électronique : format non valide",
                    "Invalid login credentials": "login ou mot de passe invalide",
                },
                rules: {
                    required: value => !!value || 'Required.',
                    min: v => v.length >= 8 || 'Min 8 characters',
                    emailMatch: () => (`The email and password you entered don't match`),
                },
                icons: [
                    {icn: 'mdi-apple', color:"black", fn:"apple"},
                    {icn: 'mdi-google', color:"red", fn:"google"},
                    {icn: 'mdi-facebook', color:"indigo", fn:"facebook"},
                ],
                provider: null,
            }
        },
        created(){
            this.checkSessionIn();
        },
        beforeMount(){
            
        },
        mounted() {
            App.addListener('appUrlOpen', (data) => {
                //console.log('URL reçue: ' + data.url);
                if( data.url.split('#').length > 1 ){
                    const fragment = data.url.split('#')[1];  // retire le '#'
                    const path = window.location.href.replaceAll("login", "") + "#" + fragment;
                    window.location.href = path;
                }
            });
        },
        methods: {
            ...mapMutations("auth", ["SET_TOKEN"]),
            authService(service){
                switch (service) {
                    case "google":
                        this.authServiceSupabse(service);
                        break;
                    case "emailSignUp":
                        this.signUpEmailSupabase();
                        break;
                    case "emailSignIn":
                        this.signInEmailSupabase();
                        break;
                    default:
                        console.log("other")
                        break;
                }
            },
            async signInEmailSupabase(){
                this.overlayLoad = true;
                let { data, error } = await this.supabase.auth.signInWithPassword({
                    email: this.email,
                    password: this.password
                });

                if (error) {
                    console.error('Erreur lors de la connexion:', error.message);
                    const translate = this.translateMessageAuth[error.message] ? this.translateMessageAuth[error.message] : "Une erreur s'est produite";
                    
                    this.overlayLoad = false;
                    this.messageSnackbarError = `Erreur : ${translate}`;
                    this.showSnackbarError = true;
                    return;
                }

                const session = data.session;

                //this.sendNotification();

                console.log('Connexion par mail réussie:', data, session);
                this.SET_TOKEN({token: session.access_token, expiry: session.expires_at*1000})
                this.overlayLoad = false;

                await this.checkSessionIn();
                //this.$router.replace("/search");
            },
            async signUpEmailSupabase(){
                this.overlayLoad = true;
                let { error } = await this.supabase.auth.signUp({
                    email: this.email,
                    password: this.password
                });

                if ( error ) {
                    console.error('Erreur lors de l\'inscription:', error.message);

                    const translate = this.translateMessageAuth[error.message] ? this.translateMessageAuth[error.message] : "Une erreur s'est produite";
                    
                    this.overlayLoad = false;
                    this.messageSnackbarError = `Erreur : ${translate}`;
                    this.showSnackbarError = true;
                    
                    return;
                }

                //this.sendNotification();

                this.email = "";
                this.password = "";

                this.overlayLoad = false;
                this.messageSnackbar = "Inscription réussie! Vérifiez votre e-mail pour confirmer votre compte.";
                this.showSnackbar = true;
            },
            async recoveryPasswordSupabase(){
                this.overlayLoad = true;
                let { error } = await this.supabase.auth.resetPasswordForEmail(this.email);

                if (error) {
                    console.error('Erreur lors de la restauration du mot de passe:', error.message);
                    const translate = this.translateMessageAuth[error.message] ? this.translateMessageAuth[error.message] : "Une erreur s'est produite";
                    
                    this.overlayLoad = false;
                    
                    this.messageSnackbarError = `Erreur : ${translate}`;
                    this.showSnackbarError = true;
                    return;
                }

                this.email = "";

                this.overlayLoad = false;
                this.messageSnackbar = "Demande reçue. Vérifiez votre e-mail pour réinitialiser le mot de passe.";
                this.showSnackbar = true;            
            },
            async authServiceSupabse(service){

                let { data, error } = {data: null, error: null}
                if( isAndroid || isIOS ){
                    //Android & IOS
                    ({ data, error } = await this.supabase.auth.signInWithOAuth({
                        provider: service,
                        options: {
                            skipBrowserRedirect: true,
                            redirectTo: "ekko-vi-shimago-app://callback",
                        },
                    }));
                }
                else if(window.location.host == "localhost:8080"){
                    // Test local
                    ({ data, error } = await this.supabase.auth.signInWithOAuth({
                        provider: service,
                        options: {
                            skipBrowserRedirect: true,
                            redirectTo: "http://localhost:8080",
                        },
                    }));
                }
                else{
                    // Site Web App 
                    ({ data, error } = await this.supabase.auth.signInWithOAuth({
                        provider: service,
                        options: {
                            skipBrowserRedirect: true,
                        },
                    }));
                }

                if ( error ) {
                    console.error("Erreur lors de l'authenfication:", error.message);

                    const translate = this.translateMessageAuth[error.message] ? this.translateMessageAuth[error.message] : "Une erreur s'est produite";
                    
                    this.messageSnackbarError = `Erreur : ${translate}`;
                    this.showSnackbarError = true;

                    return;
                }

                //console.log('Auhtenfication via', service, 'envoyé:', data);
                window.open(data.url, '_blank');
            },
            //Other
            createOrLoginSwitchMode(){
                const link = this.$route.path == '/login' ? "/sign" : "/login";
                this.labelModeCreateOrLogin = link == '/login' ? "Pas encore de compte ?" : "Vous avez déjà un compte ?";
                this.$router.push({ path: link });
                this.modeLogin = link == '/login' ? true : false;
                this.passwordForgetMode = false;
            },
            async checkSessionIn(){
                await this.$store.dispatch("auth/checkSession");
                this.overlayLoad = false;
                if(this.logged_in){
                    if( ! this.account_created ){
                        this.$router.replace("/account-info");
                    }
                    else {
                        this.$router.replace("/search");
                    }
                }
            },
            async sendNotification() {
                const permission = await LocalNotifications.requestPermissions();
               
                if( permission ){

                    await LocalNotifications.registerActionTypes({
                        types: [
                            {
                                id: "action1",
                                actions: [
                                    {
                                        id: 'yes',
                                        title: 'Accepter',
                                    },
                                    {
                                        id: 'no',
                                        title: 'Refuser',
                                    },
                                ]
                                
                            }
                        ]
                    });

                    await LocalNotifications.schedule({
                        notifications: [
                            {
                                id: 1,
                                title: "Tchoup Tchoup",
                                body: "Accepter ou refuser à vous de voir!",
                                summaryText: "sumaryText!",
                                schedule: { at: new Date(Date.now() + 5000) }, // dans 5 secondes
                                iconColor: "red",
                                smallIcon: "res://large_logo",
                                largeIcon: "res://large_logo",
                                actionTypeId: "action1",
                            }
                        ]
                    });


                    LocalNotifications.addListener('localNotificationActionPerformed', (notificationAction) => {
                        if (notificationAction.actionId === 'yes') {
                            console.log("L'utilisateur a cliqué sur Oui");
                        } else if (notificationAction.actionId === 'no') {
                            console.log("L'utilisateur a cliqué sur Non");
                        }
                    });
                }
                else{
                    console.log("permission non accordé");
                }
            },
        },
        watch: {
        },
    }
</script>
