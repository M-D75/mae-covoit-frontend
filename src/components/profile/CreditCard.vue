
<style lang="scss" model>
</style>

<style lang="scss" scoped>
    @import '@/styles/mixins.scss';
    .gray{
        color: gray;
    }

    .credit-card-profil {
        height: 207px;
        width: 82.7%;
        @include respond-to('small') {
            width: 90%;
        }
        padding: 30px;
        border-radius: 12px;
        box-shadow: var(--box-shadow-card);
        background-color: var(--white-bg-color);
        .row-item {
            position: relative;
            width: 100%;
            height: 33%;
            &.infos {
                .label {
                    font-size: 12px;
                    color: var(--font-color-label);
                }
                .solde {
                    font-size: 24px;
                    color: var(--font-color-label);
                    .v-icon {
                        font-size: 24px;
                        margin-right: 5px;
                        margin-top: -3px;
                    }
                }
            }
            &.code-card{
                text-align: right;
                font-size: 24px;
                line-height: 2.6;
                color: var(--font-color-label);
                .v-icon{
                    font-size: 23px;
                    color: #ff4949;
                    fill: #ff4949;
                }
            }
            &.btn {
                width: 100%;
                .btn.bloc {
                    position: absolute;
                    bottom: 0;
                    width: 100%;
                    display: flex;
                    justify-content: space-between;
                    .btn {
                        width: 100%;
                        &.eye {
                            cursor: pointer;
                            color: var(--font-color-label);
                        }
                        &.card i {
                            text-align: center;
                            width: 100%;
                            color: var(--font-color-label);
                        }
                        &.hand {
                            text-align: center;
                            width: 100%;
                            color: var(--font-color-label);
                        }
                        &.circle-blc {
                            position: relative;
                            // min-width: 50px;
                            .in-btn {
                                position: absolute;
                                display: flex;
                                right: -15px;
                                bottom: 0;
                                i {
                                    font-size: 33px;
                                    &.vi-1 {
                                        position: relative;
                                        left: 12%;
                                        color: #fea581;
                                        opacity: 0.8;
                                    }
                                    &.vi-2 {
                                        position: relative;
                                        right: 12%;
                                        color: #ffded0;
                                        opacity: 0.8;
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
</style>

<template>
    <v-card
      class="credit-card-profil mx-auto"
    >
        <div class="row-item infos">
            <div class="label"> {{ modeDriver ? 'Gain' : 'Solde' }} Disponible</div>
            <div class="solde">
                <v-icon 
                    v-if="!modeDriver"
                    @click="emit('up-money')"
                >mdi-wallet-bifold</v-icon>

                <v-icon 
                    v-else
                    style="opacity: 0.3;"
                >mdi-wallet-bifold</v-icon>
                
                EUR {{ soldeWritable }}
            </div>
        </div>

        <div class="row-item code-card">
            <div v-if="!modeDriver">
                <v-icon v-if="!credit_card.available" icon="mdi-alert-circle-outline"></v-icon> <span :class="{ gray: !credit_card.available }">•••• {{ credit_card.num_end_credit_card }}</span>
            </div>
        </div>

        <div class="row-item btn">
            <div
                class="btn bloc"
            >
                <div 
                    class="btn eye"
                >
                    <v-icon class="zoom-bounce" v-if="eyeOff && !modeDriver" @click="emit('add-card')">mdi-eye-off</v-icon>
                    <!-- <v-icon v-else>mdi-eye</v-icon> -->
                    <v-icon class="zoom-bounce" v-if="modeDriver">mdi-transfer</v-icon>
                </div>

                <!-- <div class="btn card">
                    <v-icon>mdi-credit-card</v-icon>
                </div> -->

                <div 
                    v-if="modeDriver"
                    class="btn hand"
                    @click="emit('drop-money')"
                >
                    <v-icon class="zoom-bounce"><font-awesome-icon :icon="['fas', 'hand-holding-dollar']" /></v-icon>
                    <!-- <v-icon>mdi-hand-coin-outline</v-icon> -->
                </div>

                <!-- Circles Card deco -->
                <div class="btn circle-blc">
                    <div class="in-btn">
                        <v-icon class="vi-1">mdi-circle</v-icon>
                        <v-icon class="vi-2">mdi-circle</v-icon>
                    </div>
                </div>
            </div>
        </div>
    </v-card>
</template>


<script>
    import { mapState } from 'vuex';


    // Components
    export default {
        name: 'credit-card-comp',
        computed: {
            ...mapState("profil", ["soldes", "credit_card", "modeDriver"]),
        },
        props: {
            
        },
        data() {
            return {
                solde: (new Intl.NumberFormat('de-DE').format(60000000)).replaceAll(".", " "),
                eyeOff: true,
                soldeWritable: 0,
                interUidSolde: null,
            }
        },
        mounted(){
            this.soldeWritable = this.soldes;
        },
        methods: {
            portefeuille(){
                // console.log("portefeuille");
                this.solde = (new Intl.NumberFormat('de-DE').format(Math.floor(Math.random()*600000)+600)).replaceAll(".", " ");
                this.$emit("add-credit");
            },
            emit(value){
                this.$emit(value);
            },
            animerNombre(nombreDepart, nombreObjectif, vitesse, time) {
                const pas = (nombreObjectif - nombreDepart) / (time / vitesse);
                let nombreActuel = nombreDepart;

                if( nombreDepart != nombreObjectif ){
                    const intervalId = setInterval(function () {
                        this.soldeWritable = nombreActuel;
                        nombreActuel += pas;
                        nombreActuel = Math[pas > 0 ? 'ceil' : 'floor'](nombreActuel);

                        if ((pas > 0 && nombreActuel >= nombreObjectif) || (pas < 0 && nombreActuel <= nombreObjectif)) {
                            clearInterval(intervalId);
                            this.soldeWritable = nombreObjectif;
                        }
                    }.bind(this), vitesse);
                }
            }
        },
        watch:{
            soldes(){
                this.animerNombre(this.soldeWritable, this.soldes, 20, 1000);
            },
        }
    };
</script>