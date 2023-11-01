<!-- scss -->

<style lang="scss" scoped>
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
                }
            }
        }
    }
</style>
   
<!--  -->
<template>
    <div class="history-trajets">
        <div class="contain-history">
            <div 
                v-for="info in infos"
                :key="info.date"
            >
                <div class="date">{{info.date}}</div>
                <GroupCardsHistory :infos="info.infos"/>
            </div>
        </div>
    </div>
</template>



<!--  -->
<script>
    import { defineComponent } from 'vue';

    // Components
    import GroupCardsHistory from './GroupCardsHistory.vue';
    

    export default defineComponent({
        name: 'history-trajets-comp',

        components: {
            GroupCardsHistory,
        },
        props: {
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
