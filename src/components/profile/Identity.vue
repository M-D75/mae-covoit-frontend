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
                >
                    <template v-slot:append>
                        <v-btn
                            color="green"
                            icon="mdi-check-circle"
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
                    title="Identité"
                    subtitle="Identité non vérifiée"
                    prepend-icon="mdi-card-account-details-outline"
                    @click="checkIdentity()"
                >
                    <template v-slot:append>
                        <v-btn
                            color="grey-lighten-1"
                            icon="mdi-check-circle"
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
                    subtitle="Aucun RIB enregistré"
                    prepend-icon="mdi-bank-outline"
                >
                    <template v-slot:append>
                        <v-btn
                            color="grey-lighten-1"
                            icon="mdi-check-circle"
                            variant="text"
                        ></v-btn>
                    </template>
                </v-card>
            </v-col>
        </v-row>
    </v-main>

</template>



<!--  -->
<script>
    import { defineComponent } from 'vue';
    import { mapState } from 'vuex';

    let stripePromise;

    import stripe from '@/utils/stripe.js'

    // Components
    // ...

    export default defineComponent({
        name: 'identity-comp',
        emits: ["close"],
        computed: {
            ...mapState("profil", ["userUid"]),
        },
        components: {
        },
        props: {
        },
        data() {
            return {
                clientSecret: "",
                id: "",
            }
        },
        methods: {
            async retrieveIdentity(){
                // "vs_1OW66BIKwmrDLewYEKwIzTHW"
                const verificationSession = await stripe.identity.verificationSessions.retrieve(
                    'vs_1OW68UIKwmrDLewYIQhqapUR'
                );
                console.log("verificationSession", verificationSession);
                this.clientSecret = verificationSession.client_secret;
                const stripePK = await stripePromise;
                stripePK.verifyIdentity(this.clientSecret).then((resu) => {
                    console.log("resu", resu);
                });
                // console.log("res:", res);
                // const verificationSession2 = await stripe.identity.verificationSessions.retrieve(
                //     'vs_1OW68UIKwmrDLewYIQhqapUR'
                // );
                // console.log("verificationSession2", verificationSession2);

            },
            async checkIdentity(){
                // await this.retrieveIdentity();
                // back-end create verification
                const verificationSession = await stripe.identity.verificationSessions.create({
                    type: 'document',
                    metadata: {
                        user_id: this.userUid,
                    },
                });

                this.clientSecret = verificationSession.client_secret;
                this.id = verificationSession.id;
                console.log("clientSecret", this.clientSecret);

                const stripePK = await stripePromise;
                stripePK.verifyIdentity(this.clientSecret).then((res) => {
                    console.log("resu", res);
                    this.recheck(this.id)
                });
            },
            async recheck(id){
                console.log("recheck", id);
                const verificationSession2 = await stripe.identity.verificationSessions.retrieve(
                    id
                );
                console.log("verificationSession2", verificationSession2);
            }
        },
        async mounted(){
            //dynamic
            if (!stripePromise) {
                const { loadStripe } = await import('@stripe/stripe-js');
                stripePromise = loadStripe(process.env.VUE_APP_API_STRIPE_PK);
            }
        }
    });
</script>
