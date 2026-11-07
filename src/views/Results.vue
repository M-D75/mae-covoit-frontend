
<style lang="scss" model>
    .v-main, .v-application__wrap {
        overflow: hidden;
    }

    .label-filter.text-caption {
        width: 85%;
        max-width: 500px;
    }

    .v-dialog.filter {
        .v-overlay__content{
            .v-card.filter {
                background-color: var(--bg-app-color);
                .v-toolbar{
                    background-color: var(--bg-app-color);
                    color: var(--font-color-label);
                }
                .v-list {
                    background-color: var(--bg-app-color);
                    .v-field__field {
                        background-color: var(--bg-app-color);
                        color: var(--font-color-label);
                    }
                    .v-list-item {
                        .v-list-item__content {
                            color: var(--font-color-label);
                        }
                        .v-list-item__prepend {
                            .v-icon {
                                font-weight: bold;
                                color: var(--gray-icon-color);
                            }
                        }
                    }
                }
            }
        }
    }
    
</style>

<!-- scss -->
<style lang="scss" scoped>
    .container-trajet-member {
        margin: 13px 0;

        .label-filter {
            color: var(--font-color-label);
        }

        .nothing {
            display: table;
            text-align: center;
            height: 83vh;
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

        
    }

    .v-dialog.filter {
        .v-card.filter {
            .v-list {
                background-color: var(--bg-app-color);                
                .v-list-item:nth-child(2) {
                    border-bottom: 1px solid #11100022 !important;
                    border-top: 1px solid #11100022 !important;
                }

                .v-list-item {
                    .v-list-item__content {
                        color: var(--font-color-label);
                    }
                    .v-list-item__prepend {
                        .v-icon {
                            font-weight: bold;
                            color: var(--gray-icon-color);
                        }
                    }
                }
            }
            .contain-btn {
                width: 100%;
                padding: 0 10px;
                display: flex;
                background-color: var(--bg-app-color);
                color: var(--font-color-label);
                .v-btn {
                    display: block;
                    margin: auto;
                    margin-bottom: 15px;
                }
            }
        }
    }
</style>
   
<!--  -->
<template>
    <!-- toolbar -->
    <Toolbar 
        v-if="mode=='date-dep-dest'"
        :mode="mode"
        :trajet="{ depart: depart, destination: destination } "
        :nombre_trajet="trajets.filter(trajet => trajet.depart == depart && trajet.destination == destination).length"
        :nbPassenger="String(seatsRequested)"
        :date="date.replaceAll('-', '/')"
        :filterOpen="filterOpen"
        v-on:open-filter="filterOpen=true" 
    />

    <Toolbar 
        v-if="mode=='shared-ids'"
        :mode="mode"
        :user_shared="user_shared_data ? user_shared_data : {firstname: '', lastname: ''}"
        :filterOpen="filterOpen"
        v-on:open-filter="filterOpen=true"
    />

    <!--  -->
    <v-main class="container-trajet-member">
        <div class="label-filter text-caption text-uppercase mx-auto">{{ date.replaceAll("-", "/") }}</div>
        <p v-if="loading" role="status" class="text-center">Chargement des trajets…</p>
        <div v-else-if="routeError || error" role="alert" class="text-center pa-6">
            <p>{{ routeError || error }}</p><v-btn @click="reloadResults">Réessayer</v-btn>
        </div>
        <p v-if="warning && !loading && !error && !routeError" role="status" class="text-center">{{ warning }}</p>
        <TrajetMember
            v-for="(infos, index) in visibleTrips"
            :key="index" 
            :infos="infos"
            :data-index="index"
            @click="reserve($event, index)" 
        />

        <div v-if="nothing && !loading && !error && !routeError" class="nothing label-filter text-caption mx-auto">
            <div class="contenu">
                <v-icon icon="mdi-alert-circle-outline"></v-icon>
                <span>Désolé, nous n'avons trouvé aucun trajet correspondant à vos critères.</span>
            </div>
        </div>

        <!-- TODO: callCloseBottomChild -->
        <v-overlay v-model="overlay" contained persistent style="z-index: 0;" @click="callCloseBottomChild()"></v-overlay>

        <v-dialog
            v-model="filterOpen"
            class="filter"
            :class="{'dark-mode': darkMode, 'ligth-mode': !darkMode}"
        >
            <v-card class="filter">
                <v-toolbar color="gray" title="Trier par"></v-toolbar>
                <v-list>          
                    <v-list-item
                        v-for="(trier, index) in triers"
                        :key="trier.id"
                        :title="trier.text"
                    >
                        <template v-slot:prepend>
                            <v-icon
                                :icon="trier.icon"
                                color="gray"
                            />
                        </template>
                
                        <template v-slot:append>
                            <v-btn
                                :color="trier.select ? 'green' : 'grey-lighten-1'"
                                :icon="defaulttrier == trier.id ? 'mdi-check-decagram' : 'mdi-check-circle-outline'"
                                variant="text"
                                @click="select(index)"
                            ></v-btn>
                        </template>
                    </v-list-item>
                </v-list>

                <div class="contain-btn">
                    <v-btn
                        class="search-btn mr-4 text-none"
                        rounded="xl" 
                        size="x-large"
                        variant="plain"
                        block
                        @click="trieValided()"
                    >
                        Appliquer
                    </v-btn>
                </div>

            </v-card>
        </v-dialog>
    </v-main>

    <PaneApear
        mode="profil-member"
        :class-name="['profil-member']"
        ref="PaneApearProfilMemberRef"
    />

    <!-- reserve -->
    <BottomMenu 
        ref="BottomMenuRefResults" 
        mode="reserve" 
        :infos="infos"
        :class-name="['results']"
        v-on:close="overlay = false;"
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

    <!-- loading -->
    <v-overlay disabled :model-value="overlayLoad" class="align-center justify-center">
        <v-progress-circular color="blue" indeterminate size="64"></v-progress-circular>
    </v-overlay>


    <!-- message error -->
    <!-- <v-snackbar
        v-model="showSnackbarError"
        :timeout="4000"
        color="error"
        style="z-index: 9999;"
    >
        <v-icon icon="mdi-alert-circle"></v-icon> <span>{{ messageSnackbarError }}</span>
    </v-snackbar> -->
</template>



<!--  -->
<script>
    //import $ from 'jquery';
    import { defineComponent } from 'vue';
    import { mapActions, mapMutations, mapState } from 'vuex';


    // Components
    import Toolbar from '@/components/menus/head/Toolbar.vue'
    import TrajetMember from '@/components/search/TrajetMember.vue';
    import PaneApear from '@/components/PaneApear.vue'; 
    import BottomMenu from '@/components/menus/BottomMenu.vue';

    import {bookingSeats,occupiedSeats} from '@/services/bookingSeats.js';
    export default defineComponent({
        name: 'results-view',
        computed: {
            ...mapState("search", ["trajets", "trajetSelected", "loading", "error", "warning"]),
            ...mapState("profil", ["darkMode"]),
            seatsRequested(){return bookingSeats(this.$store.state.search.nbPassenger);},
            visibleTrips(){
                if(this.routeError)return [];
                return this.mode==='shared-ids'?this.trajets.filter(trip=>new Date(trip.departure_time).getTime()>Date.now()
                    && occupiedSeats(trip)+this.seatsRequested<=trip.max_seats):this.trajetFiltered;
            },
            trajetFiltered() {
                let trips = this.trajets.filter(
                    (trajet) => {
                        return trajet.depart == this.depart
                            && trajet.destination == this.destination
                            && occupiedSeats(trajet) + this.seatsRequested <= trajet.max_seats
                            && this.getDate().getTime() < new Date(trajet.departure_time).getTime()
                            && this.isSameDay(this.getDate(), new Date(trajet.departure_time))
                    }
                );

                switch (this.defaulttrier) {
                    case 0://hour
                        trips = trips.sort((a, b) => {
                            return new Date(a.departure_time) - new Date(b.departure_time);
                        });
                        break;
                    case 1: //prix
                        trips = trips.sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity));

                        break;
                    case 2: //nb-place
                        trips = trips.sort((a, b) => (b.max_seats - occupiedSeats(b)) - (a.max_seats - occupiedSeats(a)));
                        break;
                    default:
                        break;
                }

                return trips;
            },
        },
        components: {
            Toolbar,
            TrajetMember,
            PaneApear,
            BottomMenu,
        },
        props: {
            depart: {
                type: String,
                default: "Tsingoni",
            },
            destination: {
                type: String,
                default: "Mamoudzou",
            },
            date: {
                type: String,
                default: "Aujourd'hui",
            },
            nbPassenger: {
                type: String,
                default: "2",
            }
        },
        data() {
            return {
                routeError: '', resultsRequest: 0,
                mode: 'date-dep-dest', //date-dep-dest; shared-ids
                filterOpen: false,
                user_shared_data: null,
                triers: [
                    {
                        id: 0,
                        text: "Horaire",
                        icon: "mdi-calendar-clock",
                        select: true,
                    },
                    {
                        id: 1,
                        text: "Prix le moins cher",
                        icon: "mdi-cash",
                        select: false,
                    },
                    {
                        id: 2,
                        text: "Nombre de place",
                        icon: "mdi-seat-passenger",
                        select: false,
                    }
                ],
                defaulttrier: 0,
                buildPaymentIntent: false,
                infos: {
                    depart: "Tsingoni",
                    destination: "Mamoudzou",
                    hour_start: "4:50",
                    hour_end: "6:55",
                    price: 4,
                    name: "Ledou",
                    passenger_number: 2,
                    max_seats: 4
                },
                nothing: false,
                overlay: false,
                overlayLoad: true,
            }
        },
        async mounted() {
            await this.reloadResults();
        },
        methods: {
            async reloadResults() {
                const request=++this.resultsRequest;
                const shared=this.$route.path.includes('/results/shared/');
                this.mode=shared?'shared-ids':'date-dep-dest';this.user_shared_data=null;
                this.routeError='';this.nothing=false;this.overlayLoad=true;
                this.SET_TRAJET_SELECTED({});
                const seats=bookingSeats(shared?(this.$route.query?.seats??1):this.nbPassenger);
                this.SET_NB_PASSAGER(seats??0);
                if(seats===null){this.routeError='Le nombre de passagers doit être compris entre 1 et 8.';this.overlayLoad=false;return;}
                try {
                    if(shared){
                        const result=await this.getTrajetsId({user_uid:this.$route.params.user_uid,ids:this.$route.params.ids});
                        if(request!==this.resultsRequest)return;
                        if(result?.status===0){this.user_shared_data=result.data?.[0]||null;this.nothing=this.visibleTrips.length===0;}
                    }else{
                        const result=await this.getTrajetsDate({date:this.getDate()});
                        if(request!==this.resultsRequest)return;
                        if(result?.status===0)this.nothing=this.visibleTrips.length===0;
                    }
                }finally{if(request===this.resultsRequest)this.overlayLoad=false;}
            },
            ...mapMutations("search", ["SET_DEPART", "SET_DESTINATION", "SET_NB_PASSAGER", "SET_TRAJET_SELECTED"]),
            ...mapMutations("trip", ["SET_TRIP_SELECTED"]),
            ...mapActions("trip", ["getProfilMember"]),
            ...mapActions("search", ["getTrajets", "getTrajetsDate", "getTrajetsId"]),
            reserve(event, index) {
                this.infos = this.visibleTrips[index];
                if(!this.infos)return;
                // TODO: propre
                this.SET_TRAJET_SELECTED(this.infos);
                this.$store.commit("search/SET_DEPART", "");
                this.$store.commit("search/SET_DESTINATION", "");
                //this.$store.commit("search/SET_NB_PASSAGER", 1);
                this.callChildMethod();
            },
            async openProfilMember(){
                const selected=this.infos;
                this.SET_TRIP_SELECTED(selected);
                this.$refs.BottomMenuRefResults.loading=true;
                try {
                    const result=await this.getProfilMember({userUid:selected.driver_id});
                    if(this.infos!==selected)return;
                    if(result)this.$refs.PaneApearProfilMemberRef.open();
                    else{this.messageSnackbarError='Impossible de charger ce profil. Veuillez réessayer.';this.showSnackbarError=true;}
                } finally {if(this.$refs.BottomMenuRefResults)this.$refs.BottomMenuRefResults.loading=false;}
            },
            buildPaymentIntentReserve(){
                this.buildPaymentIntent = true;
                setTimeout(async function(){
                    if( this.$refs.BottomMenuPaymentItentRef ){
                        const res = await this.$refs.BottomMenuPaymentItentRef.buildPaymentIntent();
                        if( res.valided ){
                            this.$refs.BottomMenuRefResults.close();
                        }
                    }
                }.bind(this), 1000);
            },
            callChildMethod() {
                if (this.$refs.BottomMenuRefResults) {
                    this.overlay = this.$refs.BottomMenuRefResults.open();
                }
            },
            callCloseBottomChild() {
                if (this.$refs.BottomMenuRefResults) {
                    this.$refs.BottomMenuRefResults.close();
                    this.SET_TRAJET_SELECTED(null);
                    setTimeout(
                        function () {
                            this.overlay = false;
                        }.bind(this), 1000
                    );
                }
            },
            getDate() {
                const tmpCurrentDate = new Date();
                var day = tmpCurrentDate.getDate();
                var month = tmpCurrentDate.getMonth() + 1;
                var year = tmpCurrentDate.getFullYear();

                let currentDate = new Date(`${month}/${day}/${year}`);
                const tomorrowsDate = new Date(currentDate);
                tomorrowsDate.setDate(currentDate.getDate() + 1);

                currentDate = new Date();

                day = this.date.split("-")[0];
                month = this.date.split("-")[1];
                year = this.date.split("-")[2];

                if (this.date == "Aujourd'hui") {
                    return currentDate;
                }
                else if (this.date == "Demain") {
                    return tomorrowsDate;
                }
                else {
                    return new Date(`${month}/${day}/${year}`)
                }
            },
            isSameDay(date1, date2) {
                return (
                    date1.getFullYear() === date2.getFullYear() &&
                    date1.getMonth() === date2.getMonth() &&
                    date1.getDate() === date2.getDate()
                );
            },
            // ********
            // trie
            select(index){
                const trier = this.triers.find((trier) => trier.select == true);
                if(trier && index != trier.id)
                    trier.select = false;
                if( ! trier || trier.id != this.triers[index].id ){
                    this.triers[index].select = true;
                }
            },
            trieValided(){
                this.defaulttrier = this.triers.find((trier) => trier.select == true).id;
                this.filterOpen = false;
            },
        },
        watch: {
            '$route.fullPath'() { this.reloadResults(); },
            overlay() {
                if ( ! this.overlay ) {
                    if ( this.$refs.BottomMenuRefResults && this.$refs.BottomMenuRefResults.notif ) {
                        this.$router.replace("/search")
                    }
                }
            },
            loading(value) { this.overlayLoad = value; },
        },
    });
</script>
