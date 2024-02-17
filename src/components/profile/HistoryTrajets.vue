<!-- scss -->

<style lang="scss" scoped>
     @import "@/styles/mixins.scss";

    .history-trajets {
        overflow: visible;
        width: 100%;
        margin: auto;
        height: 100%;
        .contain-history {
            overflow: scroll;
            height: 100%;
            div {
                .date {
                    color: var(--font-color-label);
                    margin-top: 10px;
                    margin-bottom: 15px;
                    padding-left: 35px;
                    @include respond-to('small') {
                        padding-left: 15px;
                    }
                }
            }
        }

        .contain-history-empty {
            height: 150px;
            .nothing {
                display: table;
                text-align: center;
                height: 100%;
                .contenu {
                    text-align: center;
                    display: table-cell;
                    vertical-align: middle;
                    i {
                        font-size: 35px;
                        margin-bottom: 5px;
                        color: var(--font-color-label);
                    }
                    span {
                        font-size: 17px;
                        text-transform: uppercase;
                        display: block;
                        color: var(--font-color-label);
                    }
                }
            }
            
            .load-cont{
                display: grid;
                height: 100%;
            }
        }
    }
</style>
   
<!--  -->
<template>
    <div class="history-trajets">

        <div 
            v-if="infos.length==0"
            class="contain-history-empty"
        >
            <div
                v-if="!profil.loadGetTripPublish"
                class="nothing label-filter text-caption mx-auto"
                @click="overlayLoad=true"
            >
                <div class="contenu">
                    <v-icon icon="mdi-alert-circle-outline"></v-icon>
                    <span
                        v-if="mode=='planning'"
                    >Aucune publication récente !</span>

                    <span
                        v-else
                    >Aucune réservation récente !</span>
                </div>
            </div>

            <!-- loading -->
            <div 
                v-if="profil.loadGetTripPublish"
                class="load-cont align-center justify-center"
                >

                <v-progress-circular
                    color="blue"
                    indeterminate
                    size="64"
                ></v-progress-circular>
            </div>
        </div>

        <div 
            v-else
            class="contain-history"
        >
            <div 
                v-for="info in infos"
                :key="info.date"
            >
                <div class="date">{{info.date}}</div>
                <GroupCardsHistory 
                    :infos="info.infos" 
                    :mode="mode" 
                    v-on:open-contacts="$emit('open-contacts')" 
                    v-on:open-member="$emit('open-member')"
                />
            </div>
        </div>
    </div>
</template>



<!--  -->
<script>
    import { defineComponent } from 'vue';
    import { mapState } from 'vuex';

    // Components
    import GroupCardsHistory from './GroupCardsHistory.vue';
    

    export default defineComponent({
        name: 'history-trajets-comp',
        emits: ["open-contacts", "open-member"],
        computed: {
            ...mapState("profil", ["profil"])
        },
        components: {
            GroupCardsHistory,
        },
        props: {
            mode: {
                type: String,
                default: "planning",
            },
            infos: {
                type: Array,
                default() {
                    return [
                        {
                            date: "Aujourd'hui",
                            infos: [
                                {
                                    depart: "Tsingoni",
                                    destination: "Mamoudzou",
                                    hour_start: "4:50",
                                    hour_end: "6:55",
                                    price: 4,
                                    name: "Ledou",
                                    passenger_number: 2
                                },
                                {
                                    depart: "Tsingoni",
                                    destination: "Mamoudzou",
                                    hour_start: "5:50",
                                    hour_end: "6:55",
                                    price: 2,
                                    name: "Mamadou",
                                    passenger_number: 2
                                },
                            ],
                        },
                        {
                            date: "Demain",
                            infos: [
                                {
                                    depart: "Tsingoni",
                                    destination: "Mamoudzou",
                                    hour_start: "4:50",
                                    hour_end: "6:55",
                                    price: 4,
                                    name: "Ledou",
                                    passenger_number: 2
                                },
                            ],
                        },
                        {
                            date: "Après Demain",
                            infos: [
                                {
                                    depart: "Tsingoni",
                                    destination: "Mamoudzou",
                                    hour_start: "5:50",
                                    hour_end: "6:55",
                                    price: 2,
                                    name: "Mamadou",
                                    passenger_number: 2
                                },
                            ],
                        },
                    ];
                },
            },
        },
    });
</script>
