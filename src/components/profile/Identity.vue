<!-- scss -->
<style lang="scss" model>
    .v-main.identity{
        .v-row + .v-row{
            margin-top: 7px;
        }
        .v-row{
            .v-col{
                padding: 5px;
                .v-card{
                    .v-card-item {
                        .v-card-item__prepend {
                            .v-avatar {
                                .v-icon {
                                    font-size: 35px;
                                    color: var(--font-color-label);
                                }
                            }
                        }
                    }
                }
            }
        }
    }
</style>

<style lang="scss" scoped>
    .v-main{

        .btn-close {
            color: var(--font-color-label);
            background-color: var(--bg-app-color);
        }
        .title {
            font-size: var(--font-size-h1);
            color: var(--font-color-label);
            font-weight: bold;
            width: 100%;
            padding: 0 39px 0px 39px;
            margin: 20px auto;
        }

        .v-row{
            .v-card{
                width: 90%;
                color: var(--font-color-label);
                background-color: var(--white-bg-color);
                .v-card-item {
                    color: var(--font-color-label);
                    background-color: var(--white-bg-color);
                }
            }
        }
    }
</style>
   
<!--  -->
<template>

    <!-- ? -->
    <v-main class="identity">

        <v-btn
            class="btn-close"
            icon="mdi-close"
            style="position: absolute; left: 0; top: 0;"
            variant="text"
            @click="$emit('close')"
        />

        <!-- Title -->
        <div
            class="title text-center"
        >Vérification d'identité</div>


        <v-row 
            class=""
        >
            <v-col>
                <v-card
                    class="mx-auto"
                    max-width="344"
                    title="Email"
                    subtitle="Email vérifiée"
                    prepend-icon="mdi-at"
                    @click="showSnackbarMessage(3, 'Adresse email déjà vérifiée')"
                >
                    <template v-slot:append>
                        <v-btn
                            color="green"
                            icon="mdi-check-bold"
                            variant="text"
                        ></v-btn>
                    </template>
                </v-card>
            </v-col>
        </v-row>
        
        <v-row 
            class=""
        >
            <v-col>
                <v-card
                    class="mx-auto"
                    max-width="344"
                    title="Identitée"
                    :subtitle="identity ? 'Identitée vérifiée' : 'Identitée non vérifiée'"
                    prepend-icon="mdi-card-account-details-outline"
                    @click="checkIdentity()"
                >
                    <template v-slot:append>
                        <v-btn
                            :color="identity ? 'green' : 'grey-lighten-1'"
                            :icon="identity ? 'mdi-check-bold' : 'mdi-timer-sand'"
                            variant="text"
                        ></v-btn>
                    </template>
                </v-card>
            </v-col>
        </v-row>

        <v-row 
            class=""
        >
            <v-col>
                <v-card
                    class="mx-auto"
                    max-width="344"
                    title="Banque"
                    :subtitle="!connect_activation_required ? 'Versements activés' : 'Activation requise pour recevoir vos gains'"
                    prepend-icon="mdi-bank-outline"
                    @click="goToStripe()"
                >
                    <template v-slot:append>
                        <v-btn
                            :color="!connect_activation_required ? 'green' : 'grey-lighten-1'"
                            :icon="!connect_activation_required ? 'mdi-check-bold' : 'mdi-timer-sand'"
                            variant="text"
                        ></v-btn>
                    </template>
                </v-card>
            </v-col>
        </v-row>

        <!-- message neutre -->
        <v-snackbar
            v-model="showSnackbar.showInfo"
            :timeout="4000"
            style="z-index: 99999;"
        >
            <div class="contain-ico">
                <v-icon icon="$success"></v-icon> 
            </div>
            <div>
                <span>{{ showSnackbar.message }}</span>
            </div>
        </v-snackbar>

        <!-- message success -->
        <v-snackbar
            v-model="showSnackbar.showSuccess"
            :timeout="4000"
            color="success"
            style="z-index: 99999;"
        >
            <div class="contain-ico">
                <v-icon icon="$success"></v-icon> 
            </div>
            <div>
                <span>{{ showSnackbar.message }}</span>
            </div>
        </v-snackbar>

        <!-- message error -->
        <v-snackbar
            v-model="showSnackbar.showError"
            :timeout="4000"
            color="error"
            style="z-index: 99999;"
        >
            <div class="contain-ico">
                <v-icon icon="mdi-alert-circle"></v-icon> 
            </div>
            <div>
                <span>{{ showSnackbar.message }}</span>
            </div>
        </v-snackbar>
    </v-main>

</template>



<!--  -->
<script>
    import { defineComponent } from 'vue';
    import { mapState, mapActions } from 'vuex';
    import { Browser } from '@capacitor/browser';
    import { Capacitor } from '@capacitor/core';
    import { serverRequest } from '@/utils/serverApi.js';

    let stripePromise;

    // Components
    // ...

    export default defineComponent({
        name: 'identity-comp',
        emits: ["close"],
        computed: {
            ...mapState("profil", [
                "userUid",
                "payouts_enabled",
                "connect_activation_required",
                "identity",
            ]),
            ...mapState("auth", ["provider_id", "stripe_provider"]),
        },
        components: {
        },
        props: {
        },
        data() {
            return {
                clientSecret: "",
                id: "",
                showSnackbar: {
                    showError: false,
                    showSuccess: false,
                    showInfo: false,
                    message: "",
                }
            }
        },
        methods: {
            ...mapActions("profil", ["getProvider", "identityChecked"]),
            async retrieveIdentity(){
                const { data: verificationSession } = await serverRequest(
                    'get',
                    `/connect/identity-session/${this.stripe_provider.metadata.vs_id}`,
                    { mode: this.$store.state.profil.modeCo }
                );
                if(verificationSession.status == 'processing'){
                    this.showSnackbarMessage(3, "Une vérification est toujours en cours...");
                    return;
                }
                else if(verificationSession.status == 'verified'){
                    const res = await this.identityChecked();
                    if(res.status == 0){
                        this.showSnackbarMessage(1, "Identitée vérifié avec succés");
                    }
                    else{
                        this.showSnackbarMessage(2, "Une erreur est survenue, veuillez réessayer plus tard");
                    }
                    return;
                }

                this.clientSecret = verificationSession.client_secret;
                this.id = verificationSession.id;
                
                const stripePK = await stripePromise;
                stripePK.verifyIdentity(this.clientSecret).then(() => {
                    console.log("recheck...");
                    this.recheck(this.id)
                });
            },
            async checkIdentity(){
                if( ! this.identity ){
                    if( this.stripe_provider && this.stripe_provider.metadata.vs_id ){
                        await this.retrieveIdentity();
                        return;
                    }
                    console.log("new verification identity...");
                    const { data: verificationSession } = await serverRequest('post', '/connect/identity-session', {
                        mode: this.$store.state.profil.modeCo,
                    });

                    this.clientSecret = verificationSession.client_secret;
                    this.id = verificationSession.id;
                    const stripePK = await stripePromise;
                    stripePK.verifyIdentity(this.clientSecret).then(() => {
                        console.log("recheck...");
                        this.recheck(this.id)
                    });
                }
                else{
                    this.showSnackbarMessage(3, "Identité déjà validée !")
                }
            },
            async recheck(id){
                console.log("recheck", id);
                const { data: verificationSession2 } = await serverRequest(
                    'get',
                    `/connect/identity-session/${id}`,
                    { mode: this.$store.state.profil.modeCo }
                );
                if( verificationSession2.status == 'verified' ){
                    const res = await this.identityChecked();
                    if(res.status == 0){
                        this.showSnackbarMessage(1, "Identitée vérifié avec succés");
                    }
                    else{
                        this.showSnackbarMessage(2, "Une erreur est survenue, veuillez réessayer plus tard");
                    }
                }
                else if( verificationSession2.status == 'processing' ){
                    this.showSnackbarMessage(3, "Vérification en cours...")
                }
                else{
                    if( verificationSession2.last_error?.code == 'document_unverified_other' ){
                        this.showSnackbarMessage(2, "Echec de la vérification des documents, veuillez réessayer plus tard.");
                    }
                    else if( verificationSession2.last_error?.code == 'consent_declined' ){
                        this.showSnackbarMessage(2, "Vous avez réfusée les termes de consentement.");
                    }
                }
            },
            async goToStripe(){
                try {
                    const isNative = Capacitor.isNativePlatform();
                    const { data: response } = await serverRequest('post', '/connect/onboarding-link', {
                        mode: this.$store.state.profil.modeCo,
                        data: { client: isNative ? 'mobile' : 'web' },
                    });
                    const accountLink = response?.data || response;
                    if (!accountLink?.url) {
                        throw new Error("Lien Stripe Connect manquant.");
                    }

                    if (isNative) {
                        await Browser.open({ url: accountLink.url });
                    } else {
                        window.location.assign(accountLink.url);
                    }
                } catch (error) {
                    console.error("goToStripe error:", error);
                    this.showSnackbarMessage(
                        2,
                        error.response?.data?.message || "Impossible d'ouvrir l'inscription Stripe."
                    );
                }
            },
            showSnackbarMessage(mode, message){
                console.log("mess", mode, message);
                if(mode==1){
                    
                    this.showSnackbar.message = message
                    this.showSnackbar.showSuccess = true;
                }
                else if(mode==2){
                    this.showSnackbar.message = message
                    this.showSnackbar.showError = true;
                }
                else{
                    this.showSnackbar.message = message
                    this.showSnackbar.showInfo = true;
                }
            }
        },
        async mounted(){
            await this.getProvider();
            console.log("payouts_enabled", this.payouts_enabled);
            //dynamic
            if (!stripePromise) {
                const { loadStripe } = await import('@stripe/stripe-js');
                stripePromise = loadStripe(process.env.VUE_APP_API_STRIPE_PK);
            }
        }
    });
</script>
