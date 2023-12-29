<style lang="scss" model>
    .v-card.select-credit-card {
        color: var(--font-color-label);
        background-color: var(--bg-app-color);

        .v-list-subheader {
            color: var(--font-color-label);
        }

        .v-list-item {
            .v-list-item__prepend {
                // display: block !important;
                margin-right: 10px;
            }
            .v-list-item__content {
                .v-list-item-title {
                    color: var(--font-color-label);
                }
                .v-list-item-subtitle{
                    font-size: 0.7em;
                    font-weight: bold;
                    color: rgb(147, 139, 139);
                }
            };
        }
    }
</style>

<style lang="scss" scoped>
    .v-card.select-credit-card {
        // height: inherit;
        box-shadow: none;
        min-height: 50vh;
        width: 100%;
        color: var(--font-color-label);
        .v-list {
            max-height: 400px;
            .v-list-item {
                border-bottom: 1px solid rgba(128, 128, 128, 0.398);
                &:last-child{
                    border-bottom: inherit;
                }
            }
        }

        .contain-btn {
            // position: absolute;
            // bottom: 0px;
            width: 100%;
            padding: 0 10px;
            margin: 10px 0;
            display: block;
            .v-btn {
                display: block;
                margin: 5px auto;
            }
        }
    }
</style>

<template>
    <v-card

      class="mx-auto select-credit-card"
    >
        <v-list lines="two">
            <v-list-subheader inset>Cartes de credit</v-list-subheader>
    
            <v-list-item
                v-for="(card, index) in cards"
                :key="card.id"
                :title="`•••• ${card.last4}`"
                :subtitle="`Expire le ${card.exp_month < 10 ? '0' + card.exp_month : card.exp_month}/${getLastNumber(card.exp_year)}`"
            >
                <template v-slot:prepend>
                    <svg v-if="card.brand.toLocaleLowerCase()=='visa'" class="visa" xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="48" height="48" viewBox="0 0 48 48">
                        <path fill="#1565C0" d="M45,35c0,2.209-1.791,4-4,4H7c-2.209,0-4-1.791-4-4V13c0-2.209,1.791-4,4-4h34c2.209,0,4,1.791,4,4V35z"></path><path fill="#FFF" d="M15.186 19l-2.626 7.832c0 0-.667-3.313-.733-3.729-1.495-3.411-3.701-3.221-3.701-3.221L10.726 30v-.002h3.161L18.258 19H15.186zM17.689 30L20.56 30 22.296 19 19.389 19zM38.008 19h-3.021l-4.71 11h2.852l.588-1.571h3.596L37.619 30h2.613L38.008 19zM34.513 26.328l1.563-4.157.818 4.157H34.513zM26.369 22.206c0-.606.498-1.057 1.926-1.057.928 0 1.991.674 1.991.674l.466-2.309c0 0-1.358-.515-2.691-.515-3.019 0-4.576 1.444-4.576 3.272 0 3.306 3.979 2.853 3.979 4.551 0 .291-.231.964-1.888.964-1.662 0-2.759-.609-2.759-.609l-.495 2.216c0 0 1.063.606 3.117.606 2.059 0 4.915-1.54 4.915-3.752C30.354 23.586 26.369 23.394 26.369 22.206z"></path><path fill="#FFC107" d="M12.212,24.945l-0.966-4.748c0,0-0.437-1.029-1.573-1.029c-1.136,0-4.44,0-4.44,0S10.894,20.84,12.212,24.945z"></path>
                    </svg>

                    <svg v-if="card.brand.toLocaleLowerCase()=='mastercard'" class="mastercard" xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="48" height="48" viewBox="0 0 48 48">
                        <path fill="#3F51B5" d="M45,35c0,2.209-1.791,4-4,4H7c-2.209,0-4-1.791-4-4V13c0-2.209,1.791-4,4-4h34c2.209,0,4,1.791,4,4V35z"></path><path fill="#FFC107" d="M30 14A10 10 0 1 0 30 34A10 10 0 1 0 30 14Z"></path><path fill="#FF3D00" d="M22.014,30c-0.464-0.617-0.863-1.284-1.176-2h5.325c0.278-0.636,0.496-1.304,0.637-2h-6.598C20.07,25.354,20,24.686,20,24h7c0-0.686-0.07-1.354-0.201-2h-6.598c0.142-0.696,0.359-1.364,0.637-2h5.325c-0.313-0.716-0.711-1.383-1.176-2h-2.973c0.437-0.58,0.93-1.122,1.481-1.595C21.747,14.909,19.481,14,17,14c-5.523,0-10,4.477-10,10s4.477,10,10,10c3.269,0,6.162-1.575,7.986-4H22.014z"></path>
                    </svg>
                </template>
        
                <template v-slot:append>
                    <v-btn
                        :color="card.select ? 'green' : 'grey-lighten-1'"
                        :icon="defaultSource == card.id ? 'mdi-check-decagram' : 'mdi-check-circle-outline'"
                        variant="text"
                        @click="select(index)"
                    ></v-btn>
                </template>
            </v-list-item>
        </v-list>

        <div class="contain-btn">
            <v-btn
                color="blue"
                icon
                @click="addOrSelect()"
            >
                <v-icon v-if="cards.find((card) => card.select == true)" class="zoom-bounce" :icon="cards.find((card) => card.select == true) ? 'mdi-credit-card-check' : 'mdi-credit-card-plus'"></v-icon>
                <v-icon v-else class="zoom-bounce" :icon="cards.find((card) => card.select == true) ? 'mdi-credit-card-check' : 'mdi-credit-card-plus'"></v-icon>
            </v-btn>
        </div>

    </v-card>
</template>
  
<script>
    import { defineComponent } from 'vue';
    import { mapState, mapMutations } from 'vuex';

    import stripe from '@/utils/stripe.js'

    export default defineComponent({
        emits: ["no-card-founded", "need-to-add-new-card", "card-selected"],
        computed: {
            ...mapState("profil", ["darkMode"]),
            ...mapState("auth", ["customer_id", "customer"]),
        },
        data: () => ({
            cards: [
                {
                    id: 1,
                    exp_month: 12,
                    exp_year: 2024,
                    last4: '4545',
                    brand: 'mastercard',
                    select: false,
                },
                {
                    id: 2,
                    exp_month: 9,
                    exp_year: 2024,
                    last4: '4242',
                    brand: 'visa',
                    select: false,
                },
            ],
            defaultSource: "",
            cardSelected: null,
        }),
        mounted(){
            const vue = this;
            vue.cards = [];
            stripe.paymentMethods.list({
                customer: this.customer_id,
                type: 'card',
            }, async function(err, paymentMethods) {
                if (err) {
                    console.error(err);
                } 
                else {
                    const customer = await stripe.customers.retrieve(vue.customer_id);
                    console.log("paymentMethods", paymentMethods);
                    const cards = paymentMethods.data;
                    if(cards.length > 0){
                        vue.cards = [];
                    }
                    else{
                        vue.$emit("no-card-founded");
                        return;
                    }
                    
                    vue.cards = [];
                    for (let index = 0; index < cards.length; index++) {
                        const paymentMethod = cards[index];
                        const card = paymentMethod.card;
                        const selected = customer != null 
                                        && (
                                            (customer.invoice_settings.default_payment_method != null 
                                        && customer.invoice_settings.default_payment_method == paymentMethod.id) 
                                        || (customer.invoice_settings.default_payment_method == null && customer.default_source != null && customer.default_source == paymentMethod.id));

                        
                        const infos = {id: paymentMethod.id, brand: card.brand, exp_month: card.exp_month, exp_year: card.exp_year, last4: card.last4, select: selected};
                        if(selected){
                            console.log("seleccettrtrttddfdgdgdgdgfd", paymentMethod.id, vue.customer_id);
                            vue.SET_CREDIT_CARD(infos)
                            vue.defaultSource = paymentMethod.id;
                        }
                        vue.cards.push(infos);

                    }

                    console.log("all cards", vue.cards);
                }
            });
        },
        methods: {
            ...mapMutations("profil", ["SET_CREDIT_CARD"]),
            select(index){
                const card = this.cards.find((card) => card.select == true);
                if(card)
                    card.select = false;
                if(!card || card.last4 != this.cards[index].last4 ){
                    this.cards[index].select = true;
                    // this.SET_CREDIT_CARD(this.cards[index]);
                    // this.defaultSource = this.cards[index].id;
                }
            },
            getLastNumber(number) {
                const chaine = number.toString();
                return chaine.length > 2 ? chaine.slice(-2) : chaine;
            },
            addOrSelect(){
                const card = this.cards.find((card) => card.select == true)
                if(card){
                    console.log("obj-card", card, card.id);
                    this.cardSelected = card;
                    this.$emit("card-selected");
                }
                else{
                    this.cardSelected = null;
                    this.$emit("need-to-add-new-card");
                }
            },
        },
    });
</script>