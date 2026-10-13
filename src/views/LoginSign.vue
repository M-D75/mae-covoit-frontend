
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
        display: flex;
        flex-direction: column;
        gap: 12px;
        align-items: center;
        margin: 24px 0;
        padding: 20px;
        border: 1px solid var(--blue-color);
        border-radius: 16px;
        background-color: var(--white-bg-color);
        p { color: var(--font-color-label); font-size: 16px; }
    }

    .auth-title {
        position: static;
        transform: none;
        color: var(--font-color-label);
        font-size: 26px;
        text-align: center;
        margin-top: 24px;
    }

    .auth-container {
        padding-bottom: calc(24px + var(--safe-bottom, 0px));
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
        <v-container class="auth-container">
            <h1 class="auth-title">{{ passwordForgetMode ? 'Réinitialiser le mot de passe' : modeLogin ? 'Se connecter' : 'Créer un compte' }}</h1>
            <v-alert v-if="confirmationPending" type="success" variant="tonal" class="mt-4" role="status">
                Vérifiez votre boîte mail pour confirmer votre inscription avant de vous connecter.
            </v-alert>
            <!-- From Sign/Connexion -->
            <v-row class="bloc-part">
                <v-col>
                    <v-form ref="authForm" validate-on="submit" @submit.prevent="submitEmailAuth">
                        <v-text-field
                            v-model="email"
                            :error-messages="emailErrors"
                            label="E-mail"
                            type="email"
                            required
                            variant="solo"
                            :rules="[rules.requiredEmail, rules.email]"
                            :disabled="authSubmitting"
                            autocomplete="email"
                        ></v-text-field>

                        <v-text-field
                            v-if="!passwordForgetMode"
                            variant="solo"
                            v-model="password"
                            type="password"
                            :error-messages="passwordErrors"
                            :rules="modeLogin ? [rules.requiredPassword] : [rules.requiredPassword, rules.min]"
                            :disabled="authSubmitting"
                            :autocomplete="modeLogin ? 'current-password' : 'new-password'"
                            label="Mot de passe"
                            required
                        ></v-text-field>

                        <v-row>
                            <v-col>
                                <v-btn
                                    v-if="!passwordForgetMode"
                                    class="mr-4 text-none"
                                    type="submit"
                                    :loading="authSubmitting"
                                    :disabled="authSubmitting"
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
                                    type="submit"
                                    :loading="authSubmitting"
                                    :disabled="authSubmitting"
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
                                <v-btn variant="text" class="text-none" :disabled="authSubmitting" @click="showPasswordRecovery">Mot de passe oublié ?</v-btn>
                            </v-col>
                        </v-row>
                    </v-form>
                </v-col>
            </v-row>


        <div class="foot-part">
            <p>{{ passwordForgetMode ? 'Vous connaissez votre mot de passe ?' : modeLogin ? 'Pas encore de compte ?' : 'Vous avez déjà un compte ?' }}</p>
            <v-btn id="create-or-login" variant="tonal" color="primary" rounded="xl" size="large" block class="text-none" :disabled="authSubmitting" @click="createOrLoginSwitchMode">
                {{ passwordForgetMode || !modeLogin ? 'Se connecter' : 'Créer un compte' }}
            </v-btn>
        </div>

            <!-- Connectez vous avec -->
            <v-row 
                v-if="!passwordForgetMode"
                class="bloc-part"
            >
                <v-col>
                    
                <v-row>
                    <v-col style="display: flex;">
                        <div class="line-p" style="border: solid 1px #bbb;"></div>
                        <p class="con-with" style="color: gray; width:700px; text-align:center;">{{ modeLogin ? 'Connectez-vous avec' : 'Inscrivez-vous avec' }}</p>
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
                        :disabled="authSubmitting || overlayLoad"
                    >
                        <v-icon dark>
                            {{ icon.icn }}
                        </v-icon>
                    </v-btn>

                </div>

                </v-col>
            </v-row>

        </v-container>

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
    import { mapMutations, mapState } from "vuex";

    import { Browser } from '@capacitor/browser';
    import { LocalNotifications } from '@capacitor/local-notifications';
    import { Capacitor } from '@capacitor/core';
    import { buildAuthCallbackUrl } from '@/services/authCallback.js';
    import { resolvePostAuthPath } from '@/services/authProfile.js';
    import { rememberAuthEntry } from '@/services/authEntry.js';


    const isNative = Capacitor.isNativePlatform();

    export default {
        setup() {

        },
        computed: {
            ...mapState("auth", ["logged_in", "account_created"]),
            modeLogin() { return this.$route.path === '/login'; },
        },
        data() {
            return {
                showSnackbar: false,
                messageSnackbar: "Success",
                showSnackbarError: false,
                messageSnackbarError: "Error",
                overlayLoad: true,
                supabase: inject('supabase'),
                authSubmitting: false,
                confirmationPending: false,
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
                    requiredEmail: value => !!value?.trim() || 'Veuillez renseigner votre e-mail.',
                    requiredPassword: value => !!value || 'Veuillez renseigner votre mot de passe.',
                    min: value => (value || '').length >= 8 || '8 caractères minimum.',
                    email: value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((value || '').trim()) || 'Veuillez renseigner un e-mail valide.',
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
            if(this.$route.query.auth_error){
                this.messageSnackbarError = "L'authentification n'a pas pu être terminée. Veuillez réessayer.";
                this.showSnackbarError = true;
            }
            this.checkSessionIn();
        },
        beforeMount(){
            
        },
        methods: {
            ...mapMutations("auth", ["SET_TOKEN"]),
            async submitEmailAuth() {
                if (this.authSubmitting || this.overlayLoad) return;
                this.authSubmitting = true;
                this.showSnackbarError = false;
                try {
                    const { valid } = await this.$refs.authForm.validate();
                    if (!valid) return;
                    this.confirmationPending = false;
                    this.showSnackbar = false;
                    this.email = this.email.trim();
                    if (this.passwordForgetMode) await this.recoveryPasswordSupabase();
                    else await this.authService(this.modeLogin ? 'emailSignIn' : 'emailSignUp');
                } catch (error) {
                    console.error('Email authentication failed:', error);
                    this.messageSnackbarError = "La demande n'a pas pu être terminée. Veuillez réessayer.";
                    this.showSnackbarError = true;
                } finally {
                    this.authSubmitting = false;
                    this.overlayLoad = false;
                }
            },
            async resetAuthValidation() {
                this.emailErrors = '';
                this.passwordErrors = '';
                await this.$nextTick();
                this.$refs.authForm?.resetValidation();
            },
            async showPasswordRecovery() {
                this.passwordForgetMode = true;
                this.password = '';
                await this.resetAuthValidation();
            },
            async authService(service){
                switch (service) {
                    case "google":
                        await this.authServiceSupabse(service);
                        break;
                    case "emailSignUp":
                        await this.signUpEmailSupabase();
                        break;
                    case "emailSignIn":
                        await this.signInEmailSupabase();
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

                console.log('Connexion par mail réussie');
                this.SET_TOKEN({token: session.access_token, expiry: session.expires_at*1000})
                this.overlayLoad = false;

                await this.checkSessionIn();
                //this.$router.replace("/search");
            },
            async signUpEmailSupabase(){
                this.overlayLoad = true;
                let { data, error } = await this.supabase.auth.signUp({
                    email: this.email,
                    password: this.password,
                    options: {
                        emailRedirectTo: buildAuthCallbackUrl({
                            native: isNative,
                            requestedPath: this.$route.query.redirect,
                        }),
                    },
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
                rememberAuthEntry();
                await this.resetAuthValidation();

                if (data?.session) {
                    await this.checkSessionIn();
                    return;
                }

                this.confirmationPending = true;

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
                await this.resetAuthValidation();

                this.overlayLoad = false;
                this.messageSnackbar = "Demande reçue. Vérifiez votre e-mail pour réinitialiser le mot de passe.";
                this.showSnackbar = true;            
            },
            async authServiceSupabse(service){
                this.overlayLoad = true;
                const redirectTo = buildAuthCallbackUrl({
                    native: isNative,
                    requestedPath: this.$route.query.redirect,
                });
                const { data, error } = await this.supabase.auth.signInWithOAuth({
                    provider: service,
                    options: {
                        redirectTo,
                        // Capacitor owns its in-app browser. On web, Supabase
                        // redirects the current tab to the dedicated callback.
                        skipBrowserRedirect: isNative,
                    },
                });

                if ( error ) {
                    console.error("Erreur lors de l'authenfication:", error.message);

                    const translate = this.translateMessageAuth[error.message] ? this.translateMessageAuth[error.message] : "Une erreur s'est produite";
                    
                    this.messageSnackbarError = `Erreur : ${translate}`;
                    this.showSnackbarError = true;
                    this.overlayLoad = false;

                    return;
                }

                if(isNative){
                    if(!data?.url){
                        this.overlayLoad = false;
                        this.messageSnackbarError = "Le lien d'authentification est indisponible.";
                        this.showSnackbarError = true;
                        return;
                    }
                    try {
                        await Browser.open({ url: data.url });
                    } catch (browserError) {
                        console.error("Impossible d'ouvrir le navigateur OAuth:", browserError);
                        this.overlayLoad = false;
                        this.messageSnackbarError = "Le navigateur d'authentification n'a pas pu être ouvert.";
                        this.showSnackbarError = true;
                    }
                }
            },
            //Other
            createOrLoginSwitchMode(){
                const link = this.passwordForgetMode || !this.modeLogin ? '/login' : '/sign';
                this.passwordForgetMode = false;
                this.$router.push({ path: link, query: this.$route.query });
                this.password = '';
                this.resetAuthValidation();
            },
            async checkSessionIn(){
                await this.$store.dispatch("auth/checkSession");
                this.overlayLoad = false;
                if(this.logged_in){
                    this.$router.replace(resolvePostAuthPath({
                        authenticated: this.logged_in,
                        hasAccount: this.account_created,
                        requestedPath: this.$route.query.redirect,
                    }));
                }
            },
            async sendNotification() {
                const permission = await LocalNotifications.requestPermissions();
               
                if( permission.display === 'granted' ){

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
            '$route.path'() {
                this.passwordForgetMode = false;
                this.password = '';
                this.showSnackbarError = false;
                this.resetAuthValidation();
            },
        },
    }
</script>
