<style lang="scss" model>
    form#payment-form, form#card-form {
        width: 100%;
        .v-input.v-checkbox {
            .v-input__control {
                .v-selection-control__wrapper {
                    .v-selection-control__input{
                        i {
                            color: var(--font-color-label);
                        }
                    }
                }

                .v-label {
                    color: var(--font-color-label);
                }
            }
        }
    }
</style>



<style lang="scss" scoped>
    @import "@/styles/checkout.scss";

    form#payment-form, form#card-form {
        width: 100%;
        box-shadow: none;
        .v-input.v-checkbox {
            .v-input__control {
                .v-label {
                    color: var(--font-color-label);
                }
            }
        }
    }
</style>

<template>
    <form v-if="modeIn=='payment-card'" id="payment-form">
        <div id="payment-element">
            <!--Stripe.js injects the Payment Element-->
        </div>

        <v-checkbox v-model="saveInfo" label="Enregistrer les informations de carte pour les futurs paiements" @change="updatePaymentIntent()"></v-checkbox>

        <button id="submit">
            <div class="spinner hidden" id="spinner"></div>
            <span id="button-text">Payer {{ price }}€</span>
        </button>
        <div id="payment-message" class="hidden"></div>
    </form>

    <!-- card -->
    <form v-if="modeIn=='register-card'" id="card-form">
        <div id="card-element">
            <!--Stripe.js injects the Payment Element-->
        </div>

        <!-- <v-checkbox v-model="saveInfo" label="Enregistrer les informations de carte pour les futurs paiements" @change="updatePaymentIntent()"></v-checkbox> -->

        <button id="submit">
            <div class="spinner hidden" id="spinner"></div>
            <span id="button-text">Enregistrer la carte</span>
        </button>
        <div id="card-message" class="hidden"></div>
    </form>
</template>

<script>
    import { defineComponent } from 'vue';
    // import { loadStripe } from '@stripe/stripe-js';

    import { mapState } from 'vuex';

    let stripePromise;

    import stripe from '@/utils/stripe.js'
    // import { loadStripe } from '@stripe/stripe-js';
    // const stripePromise = loadStripe(process.env.VUE_APP_API_STRIPE_PK);
    // import { stripePromise } from '@/utils/stripe.js'

    export default defineComponent({
        name: 'stripe-checkout-view',
        emits: ["checkbox-update"],
        computed: {
            ...mapState("profil", ["darkMode"]),
            ...mapState("auth", ["customer_id"]),
        },
        components: {
        },
        props: {
            mode: {
                type: String,
                default: "payment-card",
            },
            paymentIntentId: {
                type: String,
                default: "pi_3OSnNfIKwmrDLewY1Q5CLla7",
            },
        },
        data() {
            return {
                paymentElement: null,
                clientSecret: null,
                paymentId: null,
                elements: null,
                saveInfo: false,
                card: null,
                price: "",
                modeIn: "register-card",
            };
        },
        async mounted() {
            this.modeIn = this.mode;

            //dynamic
            if (!stripePromise) {
                const { loadStripe } = await import('@stripe/stripe-js');
                stripePromise = loadStripe(process.env.VUE_APP_API_STRIPE_PK);
            }

            switch (this.mode) {
                case 'payment-card':
                    this.mountPay();
                    break;
            
                case 'register-card':
                    this.mountCardRegister();
                    break;
                default:
                    break;
            }
            
        },
        methods: {
            async mountCardRegister(){
                stripePromise.then(stripe => {
                    const appearance = {
                        theme: this.darkMode ? 'night' : 'minimal',
                    };

                    const elements = stripe.elements({ appearance });
                    this.elements = elements;

                    let style = {};

                    if(this.darkMode)
                        style = {
                            base: {
                                color: '#ffffff',
                                '::placeholder': {
                                    color: '#aab7c4'
                                }
                            },
                            invalid: {
                                color: '#fa755a'
                            }
                        };

                    const cardElementOption = {
                        style: style,
                        layout: "tabs",
                        hidePostalCode: true,
                    };

                    const card = elements.create("card", cardElementOption);
                    card.mount("#card-element");
                    this.card = card;
                    document
                        .querySelector("#card-form")
                        .addEventListener("submit", this.submitCard); 
                });
            },
            updateCardElement(){
                let style = {};
                if(this.darkMode)
                    style = {
                        base: {
                            color: '#ffffff',
                            '::placeholder': {
                                color: '#aab7c4'
                            }
                        },
                        invalid: {
                            color: '#fa755a'
                        }
                    };
                else
                    style = {
                        base: {
                            color: '#000',
                            '::placeholder': {
                                color: '#aab7c4'
                            }
                        },
                        invalid: {
                            color: '#fa755a'
                        }
                    };
                this.card.update({style: style})
            },
            async submitCard(e) {
                e.preventDefault();
                const vue = this;
                const stripePublic = await stripePromise;
                
                console.log("creation...");
                const { token, error } = await stripePublic.createToken(vue.card);

                if (error) {
                    console.error(error);
                } 
                else {
                    // create source card
                    const card = await stripe.customers.createSource(
                        this.customer_id,
                        {
                            source: token.id,
                        }
                    );
                    
                    console.log("card:", card);
                }
            },
            async mountPay(){
                // const paymentIntent = await stripe.paymentIntents.create({
                //     amount: 400,
                //     currency: "eur",
                //     customer: this.customer_id,
                //     automatic_payment_methods: {
                //         enabled: true,
                //         allow_redirects: 'never'
                //     },
                // });

                // const paymentIntent = await stripe.paymentIntents.update(
                //     'pi_3OSORnIKwmrDLewY1RLocqQQ',
                //     {
                //         setup_future_usage: null,
                //     }
                // );
                if(this.paymentIntentId == null){
                    console.log("no paymentItenet Id");
                    return;
                }
                else{
                    console.log("paymentItenet Id", this.paymentIntentId);
                }

                const paymentIntent = await stripe.paymentIntents.retrieve(
                    this.paymentIntentId
                );

                this.price = (paymentIntent.amount/100);

                if(paymentIntent.setup_future_usage != null)
                    this.saveInfo = true;

                // 'pi_3OSORnIKwmrDLewY1RLocqQQ'

                console.log("paymentIntent", paymentIntent, this.saveInfo);

                const clientSecret = paymentIntent.client_secret;
                this.clientSecret = clientSecret;
                this.paymentId = paymentIntent.id;

                stripePromise.then(stripe => {
                    const appearance = {
                        theme: this.darkMode ? 'night' : 'minimal',
                    };

                    const elements = stripe.elements({ appearance, clientSecret });
                    this.elements = elements;

                    const paymentElementOptions = {
                        layout: "tabs",
                    };


                    const paymentElement = elements.create("payment", paymentElementOptions);
                    paymentElement.mount("#payment-element");
                    this.paymentElement = paymentElement;
                    document
                        .querySelector("#payment-form")
                        .addEventListener("submit", this.handleSubmit);

                    
                });
            },
            async updatePaymentIntent(){
                if( this.paymentId !=  null ){
                    const saveCardInfo = this.saveInfo;
                    console.log("saveCardInfo", saveCardInfo, this.saveInfo ? 'off_session' : null);
                    const paymentIntent = await stripe.paymentIntents.update(
                        this.paymentId,
                        {
                            setup_future_usage: this.saveInfo ? 'off_session' : null,
                        }
                    );

                    console.log("new-paymentIntent", paymentIntent);

                    const clientSecret = paymentIntent.client_secret;
                    if(paymentIntent.setup_future_usage != null)
                        this.saveInfo = true;

                    stripePromise.then(stripe => {
                        
                        this.paymentElement.unmount();

                        const appearance = {
                            theme: this.darkMode ? 'night' : 'minimal',
                        };

                        const elements = stripe.elements({ appearance, clientSecret });
                        this.elements = elements;

                        const paymentElementOptions = {
                            layout: "tabs",
                        };

                        const paymentElement = elements.create("payment", paymentElementOptions);
                        paymentElement.mount("#payment-element");
                        this.paymentElement = paymentElement;
                        setTimeout(function(){
                            this.$emit("checkbox-update");
                        }.bind(this), 1000);
                        // this.$emit("checkbox-update");
                        
                    });
                }
            },
            async handleSubmit(e){
                e.preventDefault();
                
                const elements = this.elements;
                stripePromise.then(stripe => {
                    stripe.confirmPayment({
                        elements,
                        confirmParams: {
                            // Make sure to change this to your payment completion page
                            return_url: "http://localhost:8080/",
                        },
                    }).then(result => {
                        if (result.error) {
                            // Afficher l'erreur
                            console.log("Error", result.error);
                        } 
                        else {
                            // Le paiement a réussi, la carte est enregistrée pour le client
                            console.log("results:----", result);
                        }
                    });
                    
                });
            },
        },
        watch: {
            mode(){
                this.modeIn = this.mode;
            }
        }
    });
</script>

  