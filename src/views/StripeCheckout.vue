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
    @use "@/styles/checkout.scss" as *;

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

        .keyboard-dismiss-row {
            position: sticky;
            bottom: 8px;
            z-index: 5;
            display: flex;
            justify-content: flex-end;
            margin: 10px 0;

            .keyboard-dismiss-btn {
                background-color: var(--blue-color) !important;
                color: white !important;
            }
        }
    }
</style>

<template>
    <!-- payment -->
    <v-form 
        v-if="modeIn=='payment-card'" 
        id="payment-form"
        ref="checkoutForm"
    >
        <div id="payment-element">
            <!--Stripe.js injects the Payment Element-->
        </div>

        <div v-if="showKeyboardDismiss" class="keyboard-dismiss-row">
            <v-btn
                class="keyboard-dismiss-btn text-none"
                prepend-icon="mdi-keyboard-close"
                type="button"
                size="small"
                @pointerdown.prevent="dismissStripeKeyboard"
                @click.prevent="dismissStripeKeyboard"
            >
                Terminé
            </v-btn>
        </div>

        <v-checkbox
            v-if="allowSaveInfo"
            v-model="saveInfo"
            label="Enregistrer les informations de carte pour les futurs paiements"
            @change="updatePaymentIntent()"
        ></v-checkbox>

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
        ref="checkoutForm"
    >
        <div id="card-element">
            <!--Stripe.js injects the Payment Element-->
        </div>

        <div v-if="showKeyboardDismiss" class="keyboard-dismiss-row">
            <v-btn
                class="keyboard-dismiss-btn text-none"
                prepend-icon="mdi-keyboard-close"
                type="button"
                size="small"
                @pointerdown.prevent="dismissStripeKeyboard"
                @click.prevent="dismissStripeKeyboard"
            >
                Terminé
            </v-btn>
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
    import { mapState } from 'vuex';
    import { serverRequest } from '@/utils/serverApi.js';
    import { Capacitor } from '@capacitor/core';
    import { Keyboard } from '@capacitor/keyboard';

    let stripePromise;

    export default defineComponent({
        name: 'stripe-checkout-view',
        emits: [
            "checkbox-update",
            "payment-valided",
            "payment-failed",
            "payment-pending",
            "checkout-error",
            "element-mounted",
            "card-registered",
            "card-register-failed",
            "unmount",
            "mount",
        ],
        computed: {
            ...mapState("profil", ["darkMode"]),
            ...mapState("auth", ["customer_id"]),
            activePaymentIntentId(){
                return this.paymentIntentId || this.$route?.query?.payment_intent || null;
            },
            showKeyboardDismiss(){
                return this.isIOS && this.stripeInputFocused;
            },
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
                default: null,
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
                allowSaveInfo: true,
                card: null,
                price: "",
                modeIn: "register-card",
                appearancePaymentIntent: {},
                isIOS: Capacitor.getPlatform() === 'ios',
                stripeInputFocused: false,
                stripeBlurTimer: null,
            };
        },
        beforeUnmount(){
            document.removeEventListener('pointerdown', this.handleOutsidePointerDown, true);
            if(this.hasStripeFocus()){
                this.dismissStripeKeyboard();
            }
            document.querySelector("#card-form")?.removeEventListener("submit", this.submitCard);
            document.querySelector("#payment-form")?.removeEventListener("submit", this.submitPayment);
            this.unbindStripeFocusEvents(this.card);
            this.unbindStripeFocusEvents(this.paymentElement);
            if(this.stripeBlurTimer){
                clearTimeout(this.stripeBlurTimer);
            }
            this.card?.unmount?.();
            this.paymentElement?.unmount?.();
            this.card = null;
            this.paymentElement = null;
            this.loading = false;
            this.elements = null;
            console.log("unmount-stripe-chekcout:", this.modeIn);
            this.$emit("unmount");
        },
        async mounted() {
            // Capture the tap before an overlay or parent closes the sheet.
            document.addEventListener('pointerdown', this.handleOutsidePointerDown, true);
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

            try {
                if (!stripePromise) {
                    const { loadStripe } = await import('@stripe/stripe-js');
                    stripePromise = loadStripe(process.env.VUE_APP_API_STRIPE_PK);
                }
                if (!await stripePromise) {
                    throw new Error("Stripe.js n'a pas pu être chargé.");
                }

                switch (this.mode) {
                    case 'payment-card':
                        if(this.activePaymentIntentId)
                            await this.mountPay();
                        else if(this.$route?.name === 'checkout')
                            this.$router.replace('/profil');
                        break;
                    case 'register-card':
                        await this.mountCardRegister();
                        break;
                    default:
                        break;
                }
            } catch (error) {
                stripePromise = null;
                const message = error?.message || "Le formulaire de paiement est indisponible.";
                console.error("Unable to initialize Stripe.js:", error);
                if (this.mode === 'register-card') {
                    this.$emit("card-register-failed", message);
                } else {
                    this.$emit("checkout-error", message);
                }
            }
            
        },
        methods: {
            getCheckoutForm(){
                const form = this.$refs.checkoutForm;
                return form?.$el || form;
            },
            hasStripeFocus(){
                // Focus inside Stripe's cross-origin iframe does not bubble
                // to the form, but the iframe remains document.activeElement.
                const form = this.getCheckoutForm();
                return this.stripeInputFocused || Boolean(
                    form?.contains(document.activeElement)
                    && document.activeElement?.tagName === 'IFRAME'
                );
            },
            handleOutsidePointerDown(event){
                if(!this.hasStripeFocus()) return;
                const form = this.getCheckoutForm();
                const panel = form?.closest('.bottom-menu') || form;
                if(panel && !panel.contains(event.target)){
                    this.dismissStripeKeyboard();
                }
            },
            bindStripeFocusEvents(element){
                element?.on?.('focus', this.handleStripeFocus);
                element?.on?.('blur', this.handleStripeBlur);
            },
            unbindStripeFocusEvents(element){
                element?.off?.('focus', this.handleStripeFocus);
                element?.off?.('blur', this.handleStripeBlur);
            },
            handleStripeFocus(){
                if(this.stripeBlurTimer){
                    clearTimeout(this.stripeBlurTimer);
                    this.stripeBlurTimer = null;
                }
                this.stripeInputFocused = true;
            },
            handleStripeBlur(){
                if(this.stripeBlurTimer){
                    clearTimeout(this.stripeBlurTimer);
                }
                // Keep the action mounted long enough for a tap on "Terminé"
                // to finish after Stripe's iframe loses focus.
                this.stripeBlurTimer = setTimeout(() => {
                    this.stripeInputFocused = false;
                    this.stripeBlurTimer = null;
                }, 150);
            },
            async dismissStripeKeyboard(){
                this.card?.blur?.();
                this.paymentElement?.blur?.();
                if(this.stripeBlurTimer){
                    clearTimeout(this.stripeBlurTimer);
                    this.stripeBlurTimer = null;
                }
                this.stripeInputFocused = false;
                if(Capacitor.isNativePlatform()){
                    await Keyboard.hide().catch(() => undefined);
                }
            },
            // ******
            // card
            async mountCardRegister(){
                try {
                    const stripe = await stripePromise;
                    if (!stripe) {
                        throw new Error("Stripe.js n'a pas pu être chargé.");
                    }
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
                    this.bindStripeFocusEvents(card);
                    const cardForm = document.querySelector("#card-form");
                    if (!cardForm) {
                        throw new Error("Le formulaire de carte est introuvable.");
                    }
                    cardForm.addEventListener("submit", this.submitCard);
                } catch (error) {
                    console.error("Unable to mount card form:", error);
                    this.$emit(
                        "card-register-failed",
                        error?.message || "Le formulaire de carte est indisponible."
                    );
                }
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

                try {
                    const stripePublic = await stripePromise;
                    const result = await stripePublic.createToken(this.card);
                    if (result.error) {
                        throw result.error;
                    }

                    const response = await serverRequest('post', '/payments/card-source', {
                        mode: this.$store.state.profil.modeCo,
                        data: { token: result.token.id },
                    });
                    if (!response.data?.card) {
                        throw new Error("La carte n'a pas été enregistrée.");
                    }

                    this.$emit("card-registered");
                }
                catch (error) {
                    console.error("Card registration failed:", error);
                    this.$emit(
                        "card-register-failed",
                        error.response?.data?.message || error.message || "La carte n'a pas pu être enregistrée."
                    );
                }
                finally {
                    this.loading = false;
                }
            },
            // ******
            // payment-intent
            async mountPay(){
                if( this.activePaymentIntentId == null ){
                    console.log("no paymentItenet Id");
                    return;
                }
                else{
                    console.log("paymentItenet Id", this.activePaymentIntentId);
                }

                try {
                    const { data: paymentIntent } = await serverRequest(
                        'get',
                        `/payments/topup-intent/${this.activePaymentIntentId}`,
                        { mode: this.$store.state.profil.modeCo }
                    );
                    if(paymentIntent.status === 'succeeded'){
                        await serverRequest('post', '/payments/topup-finalize', {
                            mode: this.$store.state.profil.modeCo,
                            data: { paymentIntentId: paymentIntent.id },
                        });
                        await this.$store.dispatch('profil/getSoldes');
                        this.$emit("payment-valided");
                        if(this.$route?.name === 'checkout'){
                            this.$router.replace('/profil');
                        }
                        return;
                    }
                    if(paymentIntent.status === 'processing'){
                        this.$emit("payment-pending");
                        if(this.$route?.name === 'checkout'){
                            this.$router.replace('/profil');
                        }
                        return;
                    }
                    if(paymentIntent.status === 'canceled'){
                        throw new Error("Ce paiement a été annulé.");
                    }

                    this.price = (paymentIntent.amount/100);
                    this.allowSaveInfo = paymentIntent.confirmation_flow !== 'saved_method';
                    if(paymentIntent.setup_future_usage != null)
                        this.saveInfo = true;
                    this.clientSecret = paymentIntent.client_secret;
                    this.paymentId = paymentIntent.id;

                    const stripe = await stripePromise;
                    const elements = stripe.elements({ appearance: this.appearancePaymentIntent, clientSecret: this.clientSecret });
                    this.elements = elements;

                    const paymentElementOptions = {
                        layout: "tabs",
                    };

                    const paymentElement = elements.create("payment", paymentElementOptions);
                    paymentElement.mount("#payment-element");
                    this.paymentElement = paymentElement;
                    this.bindStripeFocusEvents(paymentElement);
                    document
                        .querySelector("#payment-form")
                        .addEventListener("submit", this.submitPayment);

                    setTimeout(function () {
                        this.$emit("element-mounted");
                    }.bind(this), 1000)
                    console.log("mounted....");
                } catch (error) {
                    console.error("Unable to mount payment form:", error);
                    this.$emit(
                        "checkout-error",
                        error.response?.data?.message || error.message || "Le paiement est indisponible."
                    );
                    if(this.$route?.name === 'checkout'){
                        this.$router.replace('/profil');
                    }
                }
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
                    this.bindStripeFocusEvents(paymentElement);
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
                try {
                    if(!this.activePaymentIntentId){
                        this.elements.update({setupFutureUsage: this.saveInfo ? 'off_session' : null});
                    }
                    else{
                        const { data: paymentIntent } = await serverRequest(
                            'patch',
                            `/payments/topup-intent/${this.activePaymentIntentId}`,
                            {
                                mode: this.$store.state.profil.modeCo,
                                data: {
                                    setupFutureUsage: this.saveInfo ? 'off_session' : null,
                                },
                            }
                        );

                        this.clientSecret = paymentIntent.client_secret;
                        this.paymentIntent = paymentIntent;

                        this.elements.update({ clientSecret: paymentIntent.client_secret});
                        this.unbindStripeFocusEvents(this.paymentElement);
                        this.paymentElement.unmount();
                        const stripePK = await stripePromise;
                        const paymentElementOptions = {
                            layout: "tabs",
                        };
                        this.elements = stripePK.elements({appearance: this.appearancePaymentIntent, clientSecret: paymentIntent.client_secret})
                        this.paymentElement = this.elements.create("payment", paymentElementOptions);
                        this.paymentElement.mount("#payment-element");
                        this.bindStripeFocusEvents(this.paymentElement);
                    }
                } catch (error) {
                    this.saveInfo = !this.saveInfo;
                    console.error("Unable to update payment preference:", error);
                    this.$emit(
                        "checkout-error",
                        error.response?.data?.message || "L'option d'enregistrement de la carte n'a pas pu être modifiée."
                    );
                    return;
                }

                
                setTimeout(function(){
                    this.$emit("checkbox-update")
                }.bind(this), 1000)
            },
            async submitPayment(e){
                e.preventDefault();
                this.loading = true; 
                if(!this.activePaymentIntentId){
                    this.$emit("payment-failed");
                    this.loading = false;
                    return;
                }

                try {
                    const stripePublic = await stripePromise;
                    const result = await stripePublic.confirmPayment({
                        elements: this.elements,
                        redirect: 'if_required',
                        confirmParams: {
                            return_url: `${window.location.origin}/checkout`,
                        },
                    });

                    if (result.error) {
                        console.error("Payment confirmation failed:", result.error);
                        this.$emit("payment-failed", result.error.message);
                        return;
                    }
                    if (result.paymentIntent?.status === 'processing') {
                        this.$emit("payment-pending");
                        return;
                    }
                    if (result.paymentIntent?.status !== 'succeeded') {
                        console.error("Payment confirmation failed:", result.paymentIntent?.status);
                        this.$emit("payment-failed", "Le paiement n'a pas été validé.");
                        return;
                    }

                    await serverRequest('post', '/payments/topup-finalize', {
                        mode: this.$store.state.profil.modeCo,
                        data: { paymentIntentId: result.paymentIntent.id },
                    });
                    await this.$store.dispatch('profil/getSoldes');
                    this.$emit("payment-valided");
                } catch (error) {
                    console.error("Payment finalization failed:", error);
                    this.$emit(
                        "checkout-error",
                        error.response?.data?.message || "Le paiement a été confirmé, mais sa synchronisation a échoué. Actualisez votre solde."
                    );
                } finally {
                    this.loading = false;
                }
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

  
