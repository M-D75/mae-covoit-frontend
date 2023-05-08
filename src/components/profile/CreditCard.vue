
<style lang="scss" model>
</style>

<style lang="scss" scoped>
    .credit-card-profil {
        height: 207px;
        width: 82.7%;
        padding: 30px;
        border-radius: 12px;
        box-shadow: var(--box-shadow-card);
        .row-item {
            position: relative;
            width: 100%;
            height: 50%;
            &.infos {
                .label {
                    font-size: 12px;
                    color: #1E1F26;
                }
                .solde {
                    font-size: 24px;
                    color: #1E1F26;
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
                        }
                        &.card i {
                            text-align: center;
                            width: 100%;
                        }
                        &.circle-blc {
                            position: relative;
                            .in-btn {
                                position: absolute;
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
            <div class="label">Solde Disponible</div>
            <div class="solde">EUR {{ solde }}</div>
        </div>

        <div class="row-item btn">
            <div
                class="btn bloc"
            >
                <div 
                    class="btn eye"
                    @click="eyeOff = !eyeOff"
                >
                    <v-icon v-if="eyeOff">mdi-eye-off</v-icon>
                    <v-icon v-else>mdi-eye</v-icon>
                </div>
                <div class="btn card">
                    <v-icon>mdi-credit-card</v-icon>
                </div>
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

    // Components
    export default {
        name: 'credit-card-comp',
        props: {
            
        },
        data() {
            return {
                solde: new Intl.NumberFormat('de-DE').format(60000000),
                eyeOff: true,
            }
        },
        methods: {
        },
    };
</script>