
<style lang="scss" scoped>
     .group-list-cards-history-empty {
        margin: auto;
        width: 91%;
        overflow-y: hidden;
        max-height: 400px;
        height: 400px;
        padding: 5px;
        
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
                }
                span {
                    font-size: 17px;
                    text-transform: uppercase;
                    display: block;
                }
            }
        }

        .load-cont{
            height: 90%;
            display: grid;
        }
    }

    // 
    .group-list-cards-history {
        margin: auto;
        width: 91%;
        overflow-y: scroll;
        overflow-x: visible;
        max-height: 400px;
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

    <!-- nothing and loading -->
    <div 
        v-if="Object.keys(history.historycalBooking).length==0"
        class="group-list-cards-history-empty"
        @click="overlayLoad=true"
        >
        
        <div
            v-if="!history.load"
            class="nothing label-filter text-caption mx-auto"
            @click="overlayLoad=true"
        >
            <div class="contenu">
                <v-icon icon="mdi-alert-circle-outline"></v-icon>
                <span>Aucun trajet dans votre historique !</span>
            </div>
        </div>

        <!-- loading -->
        <div 
            v-if="history.load"
            class="load-cont align-center justify-center"
            >

            <v-progress-circular
                color="blue"
                indeterminate
                size="64"
            ></v-progress-circular>
        </div>
    </div>

    <!--  -->
    <div 
        v-else
        class="group-list-cards-history" 
        >
        <div
            v-for="(infoYear, year) in history.historycalBooking"
            :key="year"
            class="group-year"
        >
            <div class="year">{{ year }}</div>
            <div 
                v-for="(monthInfo, month) in infoYear"
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
    import { mapState } from 'vuex';

    // Components
    import CardHistory from '@/components/menus/bottom/CardHistory.vue';
   

    export default defineComponent({
        name: 'group-list-cards-history-menu-comp',
        computed: {
            ...mapState("profil", ["history"]),
        },
        components: {
            CardHistory,
        },
        props: {
            // infos: {
            //     type: Array,
            //     default() {
            //         return 
            //             {
            //             "2023": {
            //                 "Mai": [
            //                     {"depart": "Tsingoni", "destination": "Mamoudzou", "price": 4},
            //                     {"depart": "Tsingoni", "destination": "Acoua", "price": 5}
            //                 ],
            //                 "Juin": [
            //                     {"depart": "Tsingoni", "destination": "Mamoudzou", "price": 4},
            //                     {"depart": "Tsingoni", "destination": "Acoua", "price": 5}
            //                 ]
            //             },
            //             "2022": {
            //                 "Avril": [
            //                     {"depart": "Koungou", "destination": "Dzaoudzi", "price": 8},
            //                     {"depart": "Koungou", "destination": "Bandraboua", "price": 3},
            //                     {"depart": "Koungou", "destination": "Mamoudzou", "price": 10}
            //                 ],
            //                 "Mai": [
            //                     {"depart": "Mamoudzou", "destination": "Koungou", "price": 6},
            //                     {"depart": "Mamoudzou", "destination": "Dzaoudzi", "price": 7},
            //                     {"depart": "Mamoudzou", "destination": "Acoua", "price": 9}
            //                 ],
            //                 "Juin": [
            //                     {"depart": "Bandraboua", "destination": "Koungou", "price": 5},
            //                     {"depart": "Bandraboua", "destination": "Dzaoudzi", "price": 7},
            //                     {"depart": "Bandraboua", "destination": "Acoua", "price": 6}
            //                 ]
            //             },
            //             "2021": {
            //                 "Février": [
            //                     {"depart": "Acoua", "destination": "Mamoudzou", "price": 5},
            //                     {"depart": "Acoua", "destination": "Koungou", "price": 4},
            //                     {"depart": "Acoua", "destination": "Sada", "price": 6}
            //                 ],
            //                 "Mars": [
            //                     {"depart": "Dzaoudzi", "destination": "Bandraboua", "price": 7},
            //                     {"depart": "Dzaoudzi", "destination": "Acoua", "price": 9},
            //                     {"depart": "Dzaoudzi", "destination": "Koungou", "price": 6}
            //                 ],
            //                 "Avril": [
            //                     {"depart": "Mamoudzou", "destination": "Tsingoni", "price": 3},
            //                     {"depart": "Mamoudzou", "destination": "Dzaoudzi", "price": 7},
            //                     {"depart": "Mamoudzou", "destination": "Acoua", "price": 9}
            //                 ]
            //             }
            //          };
            //     },
            // },
        },
        data() {
            return {
                overlayLoad: true,
            }
        },
        mounted() {
            // setTimeout(function(){
            //     this.overlayLoad = false;
            // }.bind(this), 4000)
        },
        methods: {
            
        },
        watch:{
        }
   });
</script>
