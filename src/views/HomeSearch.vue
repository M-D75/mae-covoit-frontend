
<style lang="scss" model>
    .home-search-view {
        // calendar
        .trajet-search {
            z-index: 100 !important;
        }
        .pile-search {
            z-index: 0 !important;
        }
    }

    .v-btn.map-btn{
        color: var(--font-color-label);
        margin: 10px auto;
    }
</style>

<!-- scss -->
<style lang="scss" scoped>
    .v-main{
        //margin-bottom: 25px;
        padding-top: var(--safe-top);
        .v-row.home-search-view{
            //margin: 30px auto;
            .title {
                font-size: var(--font-size-h1);
                color: var(--font-color-label);
                font-weight: bold;
                width: 100%;
                padding: 0 39px 0px 39px;
                margin: auto;
            }
        }
    }
</style>
   
<!--  -->
<template>

    <!-- overlay -->
    <v-overlay 
        v-model="overlay" 
        contained
        persistent
        style="z-index: 30;"
        @click="close()"
    ></v-overlay>

    <v-main>

        <v-row 
            class="home-search-view mt-40 mb-0"
            style="margin-top: 40px;"
        >
            <!-- Title -->
            <div
                class="title text-center"
            >Le choix de trajets à petits prix</div>

            <!-- image -->
            <v-col>
                <v-img
                style="margin: auto;"
                :width="200"
                aspect-ratio="16/9"
                cover
                src="@/assets/car-removebg-preview.png"
                ></v-img>
            </v-col>
        </v-row>

        <!-- Find Trajet -->
        <TrajetSearch 
            class="trajet-search" 
            ref="TrajetSearchRef"
            :dateString="dateString"
            v-on:trajet-selected="getTrajet()" 
            v-on:open-calendar="openCalendar()"
            v-on:open-dep="openSearch('dep')"
            v-on:open-dest="openSearch('dest')"
            v-on:open-nb-passenger="openSelectNumber()"
        />

        <!-- Find Fast Trajet -->
        <Pile 
            class="pile-search"
            ref="PileRef"
            :infos="infos"
            v-on:reserve="reserve()"
            v-on:fast-get-trip="getFastInfo"
        />

        <!-- <v-btn
            class="map-btn mr-4 text-none"
            rounded="xl" 
            size="x-large"
            variant="outlined"
            block
            @click="goToMap()"
        >
            Map
        </v-btn> -->

        <!-- Get Value -->
        <PaneGetValue
            ref="PaneGetValueRef"
            :mode="modePanel" 
            :open-p="openP"
            v-on:close="close()"
            v-on:date-selected="getDate()"
        />

        <!-- number : nb-pessenger -->
        <BottomMenu
            ref="BottomMenuRef"
            :class-name="['number']"
            :params-number="{min: 1, max:8}"
            mode="nb-passenger"
            labelSelectorN1="Réservation pour combien de personnes ?"
            v-on:close="overlay = false"
            v-on:time-valided="getSelected()"
        />

        <!-- reserve fast -->
        <BottomMenu 
            ref="BottomMenuRefResults"
            :class-name="['reserve']" 
            mode="reserve"
            v-on:close="overlay = false" 
            :infos="infos"
        />
        
    </v-main>

    <!-- Menu -->
    <BottomNav />

    

</template>



<!--  -->
<script>
    // import $ from 'jquery'
    import { defineComponent } from 'vue';
    import { mapMutations, mapState } from 'vuex';

    // Components
    import TrajetSearch from '@/components/search/TrajetSearch.vue';
    import Pile from '@/components/search/Pile.vue'
    import BottomNav from '@/components/menus/BottomNav.vue';
    import PaneGetValue from '@/components/menus/PaneGetValue.vue';
    import BottomMenu from '@/components/menus/BottomMenu.vue';

    export default defineComponent({
        name: 'home-search-view',
        computed: {
            ...mapState("search", ['depart', "destination", "nbPassenger"]),
        },
        components: {
            TrajetSearch,
            Pile,
            BottomNav,
            PaneGetValue,
            BottomMenu,
        },
        data() {
            return {
                overlay: false,
                openP: false,
                modePanel: "date",
                date: null,
                dateString: "Aujourd'hui",
                infos: {
                    "depart": "Tsingoni",
                    "destination": "Mamoudzou",
                    "hour_start": "4:50",
                    "hour_end": "6:55",
                    "price": 4,
                    "name": "Ledou",
                    "passenger_number": 2
                },
            };
        },
        mounted() {
            if(this.$refs.PaneGetValueRef){
                this.date = this.$refs.PaneGetValueRef.getDate();
            }
        },
        methods: {
            ...mapMutations("search", ["SET_NB_PASSAGER"]),
            // TODO : inutile mode prod
            getTrajet() {
                if(this.$refs.TrajetSearchRef){
                    const depart = this.$refs.TrajetSearchRef.depart;
                    const destination = this.$refs.TrajetSearchRef.destination;
                    this.infos = this.$store.state.search.trajets.filter(trajet => trajet.depart == depart && trajet.destination == destination)[0];
                }
            },
            openCalendar(){
                console.log("open-pan-calendar-search")
                if( ! this.openP ){
                    this.modePanel = "date";
                    this.openP = true;
                }
            },
            openSearch(mode){
                console.log("openSearch-mode:", mode);
                if( ! this.openP ){
                    this.modePanel = mode == 'dep' ? "depart" : "arriver";
                    this.openP = true;
                }
            },
            getDate(){
                if( this.$refs.PaneGetValueRef ){
                    this.date = this.$refs.PaneGetValueRef.date;
                    this.openP = false;
                }
            },
            close(){
                this.openP = false;
                this.modePanel = "date";
                if ( this.$refs.BottomMenuRef && this.overlay && ! this.$refs.BottomMenuRef.move ) {
                    this.overlay = this.$refs.BottomMenuRef.close();
                }
            },
            openSelectNumber(){
                console.log("open-selected-number")
                if ( this.$refs.BottomMenuRef && ! this.overlay ) {
                    this.overlay = this.$refs.BottomMenuRef.open();
                }
            },
            getSelected(){
                if (this.$refs.BottomMenuRef) {
                    this.SET_NB_PASSAGER(this.$refs.BottomMenuRef.numberSelected)
                    if(this.nbPassenger){
                        this.close();
                    }
                }
            },
            reserve(){
                if( this.$refs.BottomMenuRefResults ){
                    this.overlay = this.$refs.BottomMenuRefResults.open();
                }
            },
            getFastInfo(){
                if( this.$refs.PileRef ){
                    this.infos = this.$refs.PileRef.infos;
                }
            },
            goToMap(){
                this.$router.replace("/trip")
            }
        },
        watch: {
            depart(){
                console.log("dep-watch:", this.depart);
            },
            destination(){
                console.log("dest-watch:", this.destination);
            },
            date(){
                const tmpCurrentDate = new Date();
                var day   = tmpCurrentDate.getDate();
                var month = tmpCurrentDate.getMonth() + 1;
                var year  = tmpCurrentDate.getFullYear();

                const currentDate = new Date(`${month}/${day}/${year}`);
                const tomorrowsDate = new Date(currentDate);
                tomorrowsDate.setDate(currentDate.getDate() + 1);

                day   = this.date.getDate();
                month = this.date.getMonth() + 1;
                year  = this.date.getFullYear();

                if (currentDate.getTime() == this.date.getTime()) {
                    this.dateString = "Aujourd'hui";
                }
                else if (tomorrowsDate.getTime() == this.date.getTime()) {
                    this.dateString = "Demain";
                }
                else {
                    this.dateString = `${day >= 10 ? day : "0" + day}-${month >= 10 ? month : "0" + month}-${year}`;
                }
            },
            overlay(){
                if( ! this.overlay ){
                    if(this.$refs.BottomMenuRef && ! this.$refs.BottomMenuRef.move){
                        this.$refs.BottomMenuRef.close();
                    }
                    
                    if(this.$refs.BottomMenuRefResults && ! this.$refs.BottomMenuRefResults.move){
                        this.$refs.BottomMenuRefResults.close();
                    }
                }
            },
        },
    });
</script>
