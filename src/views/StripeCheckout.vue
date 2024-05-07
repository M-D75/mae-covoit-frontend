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

        .v-btn {
            background-color: var(--bg-app-color);
            color: var(--font-color-label);
        }
    }
</style>

<template>
    <!-- payment -->
    <v-form 
        v-if="modeIn=='payment-card'" 
        id="payment-form"
    >
        <div id="payment-element">
            <!--Stripe.js injects the Payment Element-->
        </div>

        <v-checkbox v-model="saveInfo" label="Enregistrer les informations de carte pour les futurs paiements" @change="updatePaymentIntent()"></v-checkbox>

        <v-btn
            variant="flat"
            block
            type="submit"
            :loading="loading"
        >
            Payer {{ price }}€
            <template v-slot:loader>
                <v-progress-circular indeterminate></v-progress-circular>
            </template>
        </v-btn>

        <div id="payment-message" class="hidden"></div>
    </v-form>

    <!-- card -->
    <form 
        v-if="modeIn=='register-card'" 
        id="card-form"
    >
        <div id="card-element">
            <!--Stripe.js injects the Payment Element-->
        </div>

        <v-btn
            variant="flat"
            block
            type="submit"
            :loading="loading"
        >
            Enregistrer la carte
            <template v-slot:loader>
                <v-progress-circular indeterminate></v-progress-circular>
            </template>
        </v-btn>

        <div id="card-message" class="hidden"></div>
    </form>
</template>

<script>
    import { defineComponent } from 'vue';
    import { mapState, mapActions } from 'vuex';

    let stripePromise;

    import stripe from '@/utils/stripe.js'

    export default defineComponent({
        name: 'stripe-checkout-view',
        emits: ["checkbox-update", "payment-valided", "payment-failed", "element-mounted", "card-registered", "card-register-failed", "unmount", "mount"],
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
                default: "pi_3OSuTRIKwmrDLewY15HDSoMz",
            },
        },
        data() {
            return {
                loading: false,
                paymentElement: null,
                clientSecret: null,
                paymentId: null,
                elements: null,
                saveInfo: false,
                card: null,
                price: "",
                modeIn: "register-card",
                appearancePaymentIntent: {},
            };
        },
        beforeUnmount(){
            this.card = null;
            this.loading = false;
            this.elements = null;
            console.log("unmount-stripe-chekcout:", this.modeIn);
            this.$emit("unmount");
        },
        async mounted() {
            this.$emit("mount");
            console.log("mount-strip-checkout", this.mode);
            this.modeIn = this.mode;
            this.appearancePaymentIntent = {
                theme: this.darkMode ? 'night' : 'minimal',
                variables: this.darkMode ?  {
                    fontFamily: 'Sohne, system-ui, sans-serif',
                    fontWeightNormal: '500',
                    borderRadius: '8px',
                    colorBackground: '#0A2540',
                    colorPrimary: '#EFC078',
                    accessibleColorOnColorPrimary: '#1A1B25',
                    colorText: 'white',
                    colorTextSecondary: 'white',
                    colorTextPlaceholder: '#727F96',
                    tabIconColor: 'white',
                    logoColor: 'dark'
                } : {},
                rules: this.darkMode ? {
                    '.Input, .Block': {
                        backgroundColor: 'transparent',
                        border: '0.1px solid gray',
                        boxShadow: 'inherit',
                    },
                } : {}
            }

            //dynamic
            if (!stripePromise) {
                const { loadStripe } = await import('@stripe/stripe-js');
                stripePromise = loadStripe(process.env.VUE_APP_API_STRIPE_PK);
            }

            switch (this.mode) {
                case 'payment-card':
                    if(this.paymentIntentId)
                        this.mountPay();
                    else
                        this.mountPayWithoutIntent();
                    break;
                case 'register-card':
                    this.mountCardRegister();
                    break;
                default:
                    break;
            }
            
        },
        methods: {
            ...mapActions("profil", ["addCredit"]),
            // ******
            // card
            mountCardRegister(){
                stripePromise.then(stripe => {
                    const appearance = {
                        theme: this.darkMode ? 'night' : 'stripe',
                    };

                    //https://stripe.com/docs/js/elements_object/create
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
                this.loading = true;
                // $(".spinner").removeClass("hidden");
                const vue = this;
                const stripePublic = await stripePromise;
                
                console.log("creation...", vue.card);

                try {
                    stripePublic.createToken(vue.card).then(async function(result) {
                        // Handle result.error or result.token
                        if (result.error) {
                            console.log("erro---");
                            console.error("Error:::", result.error);
                            vue.$emit("card-register-failed")
                        } 
                        else {
                            // create source card
                            const card = await stripe.customers.createSource(
                                vue.customer_id,
                                {
                                    source: result.token.id,
                                }
                            );

                            console.log("card:", card, result.token);

                            let customer = await stripe.customers.update(
                                    vue.customer_id,
                                    {
                                        default_source: card.id,
                                        invoice_settings: {
                                            default_payment_method: null,
                                        },
                                        metadata: {
                                            type_source: "card",
                                            source_selected: card.id,
                                        }
                                    }
                                );
                            
                            console.log("customer:", customer);

                            vue.$emit("card-registered");
                            vue.loading = false;
                            console.log("card:", card, vue.loading, result.token);
                        }
                        // $(".spinner").addClass("hidden");
                        vue.loading = false;
                    });
                }
                catch (error) {
                    console.log("ERROR===:", error);
                    vue.loading = false;
                }
            },
            // ******
            // payment-intent
            async mountPay(){
                if( this.paymentIntentId == null ){
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

                console.log("paymentIntent", paymentIntent, this.saveInfo);

                this.clientSecret = paymentIntent.client_secret;
                this.paymentId = paymentIntent.id;

                stripePromise.then(stripe => {
                    const elements = stripe.elements({ appearance: this.appearancePaymentIntent, clientSecret: this.clientSecret });
                    this.elements = elements;

                    const paymentElementOptions = {
                        layout: "tabs",
                    };

                    const paymentElement = elements.create("payment", paymentElementOptions);
                    paymentElement.mount("#payment-element");
                    this.paymentElement = paymentElement;
                    document
                        .querySelector("#payment-form")
                        .addEventListener("submit", this.submitPayment);

                    setTimeout(function () {
                        this.$emit("element-mounted");
                    }.bind(this), 1000)
                    console.log("mounted....");
                });
            },
            async mountPayWithoutIntent(){
                stripePromise.then(stripe => {
                    const appearance = {
                        theme: this.darkMode ? 'night' : 'minimal',
                    };

                    const elements = stripe.elements({ 
                        appearance,
                        mode: 'payment',
                        currency: 'eur',
                        amount: 4000,
                    });

                    this.elements = elements;
                    console.log("elements", elements);
                    const paymentElementOptions = {
                        layout: "tabs",
                    };
                    const paymentElement = elements.create("payment", paymentElementOptions);
                    paymentElement.mount("#payment-element");
                    this.paymentElement = paymentElement;
                    document
                        .querySelector("#payment-form")
                        .addEventListener("submit", this.submitPayment);
                    
                    setTimeout(function () {
                        this.$emit("element-mounted");
                    }.bind(this), 1000)
                    console.log("mounted....");
                    
                });
            },
            async updatePaymentIntent(){
                if(!this.paymentIntentId){
                    this.elements.update({setupFutureUsage: this.saveInfo ? 'off_session' : null});
                }
                else{
                    const paymentIntent = await stripe.paymentIntents.update(
                        this.paymentIntentId,
                        {
                            setup_future_usage: this.saveInfo ? 'off_session' : null,
                        }
                    );

                    // console.log("secret", paymentIntent, paymentIntent.client_secret, this.clientSecret, this.elements);
                    this.clientSecret = paymentIntent.client_secret;
                    this.paymentIntent = paymentIntent;
                    
                    this.elements.update({ clientSecret: paymentIntent.client_secret});   
                    this.paymentElement.unmount();
                    const stripePK = await stripePromise;
                    const paymentElementOptions = {
                        layout: "tabs",
                    };
                    this.elements = stripePK.elements({appearance: this.appearancePaymentIntent, clientSecret: paymentIntent.client_secret})
                    this.paymentElement = this.elements.create("payment", paymentElementOptions);
                    this.paymentElement.mount("#payment-element");      
                }

                
                setTimeout(function(){
                    this.$emit("checkbox-update")
                }.bind(this), 1000)
            },
            async submitPayment(e){
                e.preventDefault();
                this.loading = true; 
                const vue = this;
                if(!this.paymentIntentId){
                    const resultAdd = await vue.addCredit({credit: vue.elements._commonOptions.amount/100, no_source: true});
                    if(resultAdd.status == 0){
                        console.log("payment-valided");
                        vue.$emit("payment-valided");
                    }
                    else{
                        console.log("payment-failed");
                        vue.$emit("payment-failed")
                    }
                }
                else{
                    const resultAdd = await vue.addCredit({credit: vue.price, no_source: true});
                    if(resultAdd.status == 0){
                        const elements = this.elements;
                        stripePromise.then(stripe => {
                            stripe.confirmPayment({
                                elements,
                                redirect: 'if_required',
                                confirmParams: {
                                    // Make sure to change this to your payment completion page
                                    return_url: "http://localhost:8080/checkout",
                                },
                            }).then(result => {
                                if (result.error) {
                                    console.log("Error", result.error);
                                    vue.$emit("payment-failed");
                                }
                                else {
                                    console.log("results-payment:", result);
                                    if(result && result.paymentIntent.status == "succeeded"){
                                        console.log("payment-valided");
                                        vue.$emit("payment-valided");
                                    }
                                    else{
                                        console.log("payment-failed");
                                        vue.$emit("payment-failed");
                                    }
                                }
                            });
                        });
                    }
                    else{
                        console.log("payment-failed-2");
                        vue.$emit("payment-failed")
                    }
                }
                this.loading = false;
            },
        },
        watch: {
            mode(){
                this.modeIn = this.mode;
            },
            darkMode(){
                this.appearancePaymentIntent = {
                    theme: this.darkMode ? 'night' : 'minimal',
                    variables: this.darkMode ?  {
                        fontFamily: 'Sohne, system-ui, sans-serif',
                        fontWeightNormal: '500',
                        borderRadius: '8px',
                        colorBackground: '#0A2540',
                        colorPrimary: '#EFC078',
                        accessibleColorOnColorPrimary: '#1A1B25',
                        colorText: 'white',
                        colorTextSecondary: 'white',
                        colorTextPlaceholder: '#727F96',
                        tabIconColor: 'white',
                        logoColor: 'dark'
                    } : {},
                    rules: this.darkMode ? {
                        '.Input, .Block': {
                            backgroundColor: 'transparent',
                            border: '0.1px solid gray',
                            boxShadow: 'inherit',
                        },
                    } : {}
                }
            }
        }
    });
</script>

  