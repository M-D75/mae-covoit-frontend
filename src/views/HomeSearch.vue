
<style lang="scss" model>
    .v-main.home-search-view {
        .home-search-view {
            // calendar
            .trajet-search {
                z-index: 0;
            }
            .pile-search {
                z-index: 0;
            }

            .v-col{
                .v-img{
                    img{
                        position: absolute;
                        top: 23px;
                    }
                }
            }
        }

        .v-btn.map-btn{
            color: var(--font-color-label);
            margin: 10px auto;
        }

        .contain-btn {
            .v-btn {
                .v-btn__prepend i.v-icon{
                    font-size: 1.2em !important;
                }
            }
        }
    }
</style>

<style lang="scss" scoped>
    .v-main{
        padding-top: var(--safe-top);
        .v-row.home-search-view{
            .title {
                font-size: var(--font-size-h1);
                color: var(--font-color-label);
                font-weight: bold;
                width: 100%;
                padding: 0 39px 0px 39px;
                margin: auto;
            }
        }

        .contain-btn {
            width: 100%;
            padding: 0 10px;
            margin: 10px 0;
            display: block;
            .v-btn {
                display: flex;
                margin: 0px auto;
                margin-bottom: 40px;
                .v-btn__prepend i.v-icon{
                    font-size: 1.2em !important;
                }
            }
        }

        .contain-shared-trip {
            display: flex;
            justify-content: center;
        }
    }

</style>
   

<template>

    <v-overlay 
        v-model="overlay" 
        contained
        persistent
        style="z-index: 50;"
        @click="close()"
    ></v-overlay>

    <v-main class="home-search-view">
        
        <v-row 
            class="home-search-view mt-40 mb-0"
            style="margin-top: 40px; z-index: 1;"
        >
            <!-- Title -->
            <div
                class="title text-center"
            >Prix mini, voyage maxi</div>

            <!-- image -->
            <v-col style="z-index: 30;">
                <v-img
                    style="margin: auto; z-index: 2; overflow: visible;"
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

            style="z-index: 0 !important;"
        />

        <!-- Find Fast Trajet -->
        <Pile 
            class="pile-search"
            ref="PileRef"
            v-on:reserve="reserve()"
            v-on:fast-get-trip="getFastInfo"

            style="z-index: 0 !important;"
        />

        <!-- Go to trip history -->
        <div 
            v-if="trajetAvail != null"
            class="contain-btn"
        >
            <v-btn
                :color="'blue'"
                prepend-icon="mdi-car-clock"
                append-icon="mdi-chevron-right"
                @click="goToHistory()"
                variant="tonal"
            >
                <!-- <v-icon class="zoom-bounce" :icon="'mdi-car-clock'"></v-icon> -->
                MES TRAJETS
            </v-btn>
        </div>

        <!-- date; depart; destination; -->
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

        <!-- member-profil -->
        <PaneApear
            v-if="this.$refs.BottomMenuRefResults && this.$refs.BottomMenuRefResults.open_b"
            mode="profil-member"
            :class-name="['profil-member']"
            ref="PaneApearProfilMemberRef"
        />

        <!-- reserve fast -->
        <BottomMenu 
            ref="BottomMenuRefResults"
            mode="reserve"
            :class-name="['reserve']"
            :infos="travel"
            v-on:close="overlay = false"
            v-on:touched-avatar="openProfilMember()"
            v-on:need-payment-intent-reserve="buildPaymentIntentReserve()"
        />

        <!-- PaymentItent -->
        <BottomMenu
            v-if="buildPaymentIntent"
            ref="BottomMenuPaymentItentRef"
            mode="payment-intent"
            :class-name="['payment-intent']"
            v-on:close="overlay = false"
            v-on:retry-reserve="$refs.BottomMenuRefResults.open(); $refs.BottomMenuRefResults.tryReserveRes();"
        />
            
    </v-main>

</template>


<script>
    import { defineComponent } from 'vue';
    import { mapMutations, mapState, mapActions } from 'vuex';
    // import axios from 'axios';

    // Components
    import TrajetSearch from '@/components/search/TrajetSearch.vue';
    import Pile from '@/components/search/Pile.vue'
    import PaneGetValue from '@/components/menus/PaneGetValue.vue';
    import PaneApear from '@/components/PaneApear.vue'; 
    import BottomMenu from '@/components/menus/BottomMenu.vue';

    export default defineComponent({
        name: 'home-search-view',
        computed: {
            ...mapState("search", ['depart', "destination", "nbPassenger", "trajetSelected"]),
            ...mapState("profil", ['userUid', 'history']),
            ...mapState("trip", ['member']),
            ...mapState("general", ['appIsActive']),
        },
        components: {
            TrajetSearch,
            Pile,
            PaneGetValue,
            PaneApear,
            BottomMenu,
        },
        data() {
            return {
                overlay: false,
                openP: false,
                modePanel: "date",
                date: null,
                dateString: "Aujourd'hui",
                travel: {},
                buildPaymentIntent: false,
                trajetAvail: null,
            };
        },
        mounted() {
            if( this.$refs.PaneGetValueRef ){
                this.date = this.$refs.PaneGetValueRef.getDate();
            }

            if( ! this.appIsActive.search ){

                //task
                this.checkDateTrip();

                this.SET_APP_IS_ACTIVE({search: true});
                this.goToHistory();
            }

            
        },
        methods: {
            ...mapMutations("search", ["SET_NB_PASSAGER", "SET_REMOVE_HISTORY_DATES"]),
            ...mapMutations("trip", ["SET_TRIP_SELECTED"]),
            ...mapMutations("general", ["SET_APP_IS_ACTIVE"]),
            ...mapActions("trip", ["getProfilMember"]),
            ...mapActions("rating", ["getRating"]),
            // TODO : inutile mode prod
            getTrajet() {
                if( this.$refs.TrajetSearchRef ){
                    const depart = this.$refs.TrajetSearchRef.depart;
                    const destination = this.$refs.TrajetSearchRef.destination;
                    this.travel = this.$store.state.search.trajets.filter(trajet => trajet.depart == depart && trajet.destination == destination)[0];
                }
            },
            checkDateTrip(){
                console.log("\ncheckDateTrip:");
                const dateToday = new Date();

                //date passenger
                //check trip available passenger near
                for (let index = 0; index < this.history.datesTripPassenger.length; index++) {
                    const departure_time = this.history.datesTripPassenger[index];
                    const dateTrip = new Date(departure_time);
                    if( dateTrip.getTime() + ((60*1000)*10) < dateToday.getTime() ){
                        this.SET_REMOVE_HISTORY_DATES({ type: "passenger", index: index });
                    }
                    else if( dateTrip.getTime() - ((60*1000)*30) < dateToday.getTime() ){
                        this.trajetAvail = "passenger";
                        console.log("Trip Passenger Founded\n");
                        return;
                    }
                }

                //check trip available driver near
                for (let index = 0; index < this.history.datesTripDriver.length; index++) {
                    const departure_time = this.history.datesTripDriver[index];
                    const dateTrip = new Date(departure_time);
                    if( dateTrip.getTime() + ((60*1000)*10) < dateToday.getTime() ){
                        this.SET_REMOVE_HISTORY_DATES({ type: "driver", index: index });
                    }
                    else if( dateTrip.getTime() > dateToday.getTime() - ((60*1000)*30) ){
                        this.trajetAvail = "driver";
                        console.log("Trip Driver Founded\n");
                        return;
                    }
                }

                this.trajetAvail = null;
                console.log("No Trip Date\n");
            },
            async openProfilMember(){
                this.SET_TRIP_SELECTED(this.travel);
                this.$refs.BottomMenuRefResults.loading = true;
                const result = await this.getProfilMember({userUid: this.travel.driver_id});
                
                const data = await this.getRating({userId: this.member.userId})
                
                if( result && data.status == 0 ){
                    this.$refs.PaneApearProfilMemberRef.open();
                }
                this.$refs.BottomMenuRefResults.loading = false;
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
                    this.travel = this.$refs.PileRef.infos;
                }
            },
            buildPaymentIntentReserve(){
                console.log("Befor : buildPaymentIntentReserve");
                this.buildPaymentIntent = true;
                setTimeout(async function(){
                    if(this.$refs.BottomMenuPaymentItentRef){
                        const res = await this.$refs.BottomMenuPaymentItentRef.buildPaymentIntent();
                        if(res.valided){
                            this.$refs.BottomMenuRefResults.close();
                        }
                    }
                }.bind(this), 1000);
            },
            goToHistory(){
                if( this.trajetAvail == 'passenger' ){
                    this.$router.push('/profil/open-trip-passenger');
                }
                else if( this.trajetAvail == 'driver' ){
                    this.$router.push('/profil/open-trip-driver');
                }
                else{
                    console.log("nothing-to-go");
                }
            },
        },
        watch: {
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
            trajetSelected(){
                this.travel = this.trajetSelected;
            }
        },
    });
</script>
