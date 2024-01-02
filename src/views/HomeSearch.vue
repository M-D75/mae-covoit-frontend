
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
    }

</style>
   

<template>

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
            v-on:reserve="reserve()"
            v-on:fast-get-trip="getFastInfo"
        />

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
            ...mapState("profil", ['userUid']),
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
            };
        },
        mounted() {
            if(this.$refs.PaneGetValueRef){
                this.date = this.$refs.PaneGetValueRef.getDate();
            }

            // this.buildPaymentIntent = true;
            // this.$nextTick(function(){
            //     if(this.$refs.BottomMenuPaymentItentRef){
            //         console.log("open");
            //         this.$refs.BottomMenuPaymentItentRef.open();
            //         this.$refs.BottomMenuPaymentItentRef.paymentIntentId = "pi_3OSuTRIKwmrDLewY15HDSoMz";
            //     }
            // })
            
            
            // this.$refs.PaneApearProfilMemberRef.open()

            // const adresse = {local: "http://localhost:3001", online: window.location.protocol == 'http:' ? "http://server-mae-covoit-notif.infinityinsights.fr" : "https://server-mae-covoit-notif.infinityinsights.fr"}

            // const typeUrl = "local";
            // fetch(`${adresse[typeUrl]}/ask-new-message`, {
            //         method: 'POST',
            //         headers: {
            //             'Content-Type': 'application/json',
            //         },
            //         body: JSON.stringify({
            //             userUid: this.userUid,
            //         })
            //     })
            //     .then(response => response.json())
            //     .then(data => {
            //         console.log("notVue", data);
            //     })
            //     .catch(error => console.error('Erreur:', error));

            // axios.post(`${adresse[typeUrl]}/askNewMessage`, {
            //         userId: this.userUid,
            //     })
            //     .then(response => {
            //         console.log(response.data);
            //     })
            //     .catch(error => {
            //         console.error('Il y a eu une erreur :', error);
            //     });


        },
        methods: {
            ...mapMutations("search", ["SET_NB_PASSAGER"]),
            ...mapMutations("trip", ["SET_TRIP_SELECTED"]),
            ...mapActions("trip", ["getProfilMember"]),
            // TODO : inutile mode prod
            getTrajet() {
                if(this.$refs.TrajetSearchRef){
                    const depart = this.$refs.TrajetSearchRef.depart;
                    const destination = this.$refs.TrajetSearchRef.destination;
                    this.travel = this.$store.state.search.trajets.filter(trajet => trajet.depart == depart && trajet.destination == destination)[0];
                }
            },
            async openProfilMember(){
                this.SET_TRIP_SELECTED(this.travel);
                this.$refs.BottomMenuRefResults.loading = true;
                const result = await this.getProfilMember({userUid: this.travel.driver_id});
                if(result){
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
            }
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
