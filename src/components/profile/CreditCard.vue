
<style lang="scss" model>
    .icon_disabled{
        opacity: 0.5;
    }
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
                                &.brand{
                                    right: -2px;
                                }
                                // svg{

                                // }

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
                    class="zoom-bounce"
                    v-if="!modeDriver"
                    @click="emit('up-money')"
                >mdi-wallet-bifold</v-icon>

                <!-- <v-icon 
                    v-else
                    style="opacity: 0.3;"
                >mdi-wallet-bifold</v-icon> -->

                <v-icon class="zoom-bounce" :class="{ icon_disabled: gain==0}" v-if="modeDriver" @click="emit('transfert-gain')">mdi-transfer</v-icon>
                
                EUR {{ soldeWritable }}

                <v-icon
                    v-if="load && soldeWritable==0"
                >
                    <!-- <font-awesome-icon :icon="['fas', 'spinner']" spin-pulse /> -->
                    <font-awesome-icon :icon="['fas', 'rotate']" spin />
                </v-icon>
            </div>
        </div>

        <div class="row-item code-card">
            <div v-if="!modeDriver" class="apear-alpha">
                <v-icon v-if="!credit_card.available" icon="mdi-alert-circle-outline"></v-icon> <span :class="{ gray: !credit_card.available }">•••• {{ credit_card.last4 }}</span>
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

                    <v-icon 
                        v-if="modeDriver" 
                        :class="{ icon_disabled: gain==0}" 
                        style="height: 22px; line-height: 10; position: relative; top: -3px;"
                        @click="emit('drop-money')"
                        class="zoom-bounce"
                    >
                        <font-awesome-icon style="width: 24px;" :icon="['fas', 'hand-holding-dollar']" />
                    </v-icon>
                    
                </div>

                <!-- <div class="btn card">
                    <v-icon>mdi-credit-card</v-icon>
                </div> -->

                <!-- <div 
                    v-if="modeDriver"
                    class="btn hand"
                    @click="emit('drop-money')"
                >
                    <v-icon :class="{ icon_disabled: gain==0}" style="height: 22px; line-height: 10; position: relative; top: -3px;"
                            class="zoom-bounce"
                        ><font-awesome-icon :icon="['fas', 'hand-holding-dollar']" />
                    </v-icon>
                </div> -->

                <!-- Circles Card deco -->
                <div class="btn circle-blc">
                    
                    <div class="in-btn" :class="{brand: credit_card.brand.toLocaleLowerCase()=='visa' || credit_card.brand.toLocaleLowerCase()=='mastercard'}">
                        <svg v-if="credit_card.brand.toLocaleLowerCase()=='visa'" class="visa" xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="48" height="48" viewBox="0 0 48 30">
                            <path fill="#1565C0" d="M45,35c0,2.209-1.791,4-4,4H7c-2.209,0-4-1.791-4-4V13c0-2.209,1.791-4,4-4h34c2.209,0,4,1.791,4,4V35z"></path><path fill="#FFF" d="M15.186 19l-2.626 7.832c0 0-.667-3.313-.733-3.729-1.495-3.411-3.701-3.221-3.701-3.221L10.726 30v-.002h3.161L18.258 19H15.186zM17.689 30L20.56 30 22.296 19 19.389 19zM38.008 19h-3.021l-4.71 11h2.852l.588-1.571h3.596L37.619 30h2.613L38.008 19zM34.513 26.328l1.563-4.157.818 4.157H34.513zM26.369 22.206c0-.606.498-1.057 1.926-1.057.928 0 1.991.674 1.991.674l.466-2.309c0 0-1.358-.515-2.691-.515-3.019 0-4.576 1.444-4.576 3.272 0 3.306 3.979 2.853 3.979 4.551 0 .291-.231.964-1.888.964-1.662 0-2.759-.609-2.759-.609l-.495 2.216c0 0 1.063.606 3.117.606 2.059 0 4.915-1.54 4.915-3.752C30.354 23.586 26.369 23.394 26.369 22.206z"></path><path fill="#FFC107" d="M12.212,24.945l-0.966-4.748c0,0-0.437-1.029-1.573-1.029c-1.136,0-4.44,0-4.44,0S10.894,20.84,12.212,24.945z"></path>
                        </svg>

                        <svg v-if="credit_card.brand.toLocaleLowerCase()=='mastercard'" class="mastercard" xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="48" height="48" viewBox="0 0 48 30">
                            <path fill="#3F51B5" d="M45,35c0,2.209-1.791,4-4,4H7c-2.209,0-4-1.791-4-4V13c0-2.209,1.791-4,4-4h34c2.209,0,4,1.791,4,4V35z"></path><path fill="#FFC107" d="M30 14A10 10 0 1 0 30 34A10 10 0 1 0 30 14Z"></path><path fill="#FF3D00" d="M22.014,30c-0.464-0.617-0.863-1.284-1.176-2h5.325c0.278-0.636,0.496-1.304,0.637-2h-6.598C20.07,25.354,20,24.686,20,24h7c0-0.686-0.07-1.354-0.201-2h-6.598c0.142-0.696,0.359-1.364,0.637-2h5.325c-0.313-0.716-0.711-1.383-1.176-2h-2.973c0.437-0.58,0.93-1.122,1.481-1.595C21.747,14.909,19.481,14,17,14c-5.523,0-10,4.477-10,10s4.477,10,10,10c3.269,0,6.162-1.575,7.986-4H22.014z"></path>
                        </svg>

                        <v-icon v-if="credit_card.brand.toLocaleLowerCase()!='mastercard' && credit_card.brand.toLocaleLowerCase()!='visa'" class="vi-1">mdi-circle</v-icon>
                        <v-icon v-if="credit_card.brand.toLocaleLowerCase()!='mastercard' && credit_card.brand.toLocaleLowerCase()!='visa'" class="vi-2">mdi-circle</v-icon>
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
        emits: ["transfert-gain", "add-card"],
        computed: {
            ...mapState("profil", ["soldes", "gain", "credit_card", "modeDriver"]),
        },
        props: {
            load: {
                type:Boolean,
                default: false,
            }
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
            this.updateSolde();
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
            },
            updateSolde(){
                if(this.modeDriver)
                    this.animerNombre(this.soldeWritable, this.gain, 20, 1000);
                else
                    this.animerNombre(this.soldeWritable, this.soldes, 20, 1000);
            }
        },
        watch:{
            soldes(){
                this.updateSolde()
            },
            modeDriver(){
                this.updateSolde()
            }
        }
    };
</script>