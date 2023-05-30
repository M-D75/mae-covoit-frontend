
<style lang="scss" scoped>
    .group-list-cards-history {
        margin: auto;
        width: 91%;
        overflow-y: scroll;
        overflow-x: visible;
        max-height: 600px;
        padding: 5px;
        .group-year {
            .year {
                font-size: 2em;
                font-weight: bold;
            }
            .group-month {
                .month {
                    font-size: 1.2em;
                    text-transform: capitalize;
                }
            }
        }
    }

</style>

<template>

    <div class="group-list-cards-history">
        <div
            v-for="(infoYear, year) in infos"
            :key="year"
            class="group-year"
        >
            <div class="year">{{ Object.keys(infoYear)[0] }}</div>
            <div 
                v-for="(monthInfo, month) in infoYear[Object.keys(infoYear)[0]]"
                :key="month"
                class="group-month"
            >

                <div class="month">{{ month }}</div>
                <div class="group-card">
                    <CardHistory 
                        v-for="(info, index) in monthInfo"
                        :key="index"
                        :infos="info"
                    />
                </div>
            </div>
        </div>
    </div>

</template>


<!--  -->
<script>
    import { defineComponent } from 'vue';

    // Components
    import CardHistory from '@/components/menus/bottom/CardHistory.vue';
   

    export default defineComponent({
        name: 'group-list-cards-history-menu-comp',
        components: {
            CardHistory,
        },
        props: {
            infos: {
                type: Array,
                default() {
                    return [
                        {"2023": {
                            "Mai": [
                                {"depart": "Tsingoni", "destination": "Mamoudzou", "price": 4},
                                {"depart": "Tsingoni", "destination": "Acoua", "price": 5}
                            ],
                            "Juin": [
                                {"depart": "Tsingoni", "destination": "Mamoudzou", "price": 4},
                                {"depart": "Tsingoni", "destination": "Acoua", "price": 5}
                            ]
                        }},
                        {"2022": {
                            "Avril": [
                                {"depart": "Koungou", "destination": "Dzaoudzi", "price": 8},
                                {"depart": "Koungou", "destination": "Bandraboua", "price": 3},
                                {"depart": "Koungou", "destination": "Mamoudzou", "price": 10}
                            ],
                            "Mai": [
                                {"depart": "Mamoudzou", "destination": "Koungou", "price": 6},
                                {"depart": "Mamoudzou", "destination": "Dzaoudzi", "price": 7},
                                {"depart": "Mamoudzou", "destination": "Acoua", "price": 9}
                            ],
                            "Juin": [
                                {"depart": "Bandraboua", "destination": "Koungou", "price": 5},
                                {"depart": "Bandraboua", "destination": "Dzaoudzi", "price": 7},
                                {"depart": "Bandraboua", "destination": "Acoua", "price": 6}
                            ]
                        }},
                        {"2021": {
                            "Février": [
                                {"depart": "Acoua", "destination": "Mamoudzou", "price": 5},
                                {"depart": "Acoua", "destination": "Koungou", "price": 4},
                                {"depart": "Acoua", "destination": "Sada", "price": 6}
                            ],
                            "Mars": [
                                {"depart": "Dzaoudzi", "destination": "Bandraboua", "price": 7},
                                {"depart": "Dzaoudzi", "destination": "Acoua", "price": 9},
                                {"depart": "Dzaoudzi", "destination": "Koungou", "price": 6}
                            ],
                            "Avril": [
                                {"depart": "Mamoudzou", "destination": "Tsingoni", "price": 3},
                                {"depart": "Mamoudzou", "destination": "Dzaoudzi", "price": 7},
                                {"depart": "Mamoudzou", "destination": "Acoua", "price": 9}
                            ]
                        }}
                    ];
                },
            },
        },
        data() {
            return {
                
            }
        },
        mounted() {

        },
        methods: {
            
        },
        watch:{
        }
   });
</script>
