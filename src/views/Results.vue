
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
        :trajet="{ depart: depart, destination: destination }"
        :nombre_trajet="trajets.filter(trajet => trajet.depart == depart && trajet.destination == destination).length"
        :nbPassenger="nbPassenger" 
        :date="date.replaceAll('-', '/')"
        :filterOpen="filterOpen"
        v-on:open-filter="filterOpen=true"    
    />

    <!--  -->
    <v-main class="container-trajet-member">
        <div class="label-filter text-caption text-uppercase mx-auto">{{ date.replaceAll("-", "/") }}</div>
        <TrajetMember 
            v-for="(infos, index) in trajetFiltered" 
            :key="index" 
            :infos="infos"
            :data-index="index"
            @click="reserve($event, index)" 
        />

        <div v-if="nothing" class="nothing label-filter text-caption mx-auto">
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
        :toolbar-double="true"
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

    export default defineComponent({
        name: 'results-view',
        computed: {
            ...mapState("search", ["trajets", "trajetSelected"]),
            ...mapActions("search", ["getTrajets"]),
            ...mapState("profil", ["darkMode"]),
            trajetFiltered() {
                let trips = this.trajets.filter(
                    (trajet) => {
                        return trajet.depart == this.depart
                            && trajet.destination == this.destination
                            //&& trajet.passenger_number + parseInt(this.nbPassenger) <= trajet.max_seats
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
                        trips = trips.sort((a, b) => a.price - b.price);

                        break;
                    case 2: //nb-place
                        trips = trips.sort((a, b) => (b.max_seats - b.passenger_number) - (a.max_seats - a.passenger_number));
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
                filterOpen: false,
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
            
            // console.log("params", this.$route.params);
            this.overlayLoad = true;
            try {
                await this.getTrajets;
                if (this.trajetFiltered.length == 0)
                    this.nothing = true;
            }
            catch (error) {
                console.error("Error:", error)
                this.nothing = true;
            }
            // console.log("trrrrr", this.trajets);
            // this.nothing = true;
            this.overlayLoad = false;
        },
        methods: {
            ...mapMutations("search", ["SET_DEPART", "SET_DESTINATION", "SET_NB_PASSENGER", "SET_TRAJET_SELECTED"]),
            ...mapMutations("trip", ["SET_TRIP_SELECTED"]),
            ...mapActions("trip", ["getProfilMember"]),
            reserve(event, index) {
                this.infos = this.trajetFiltered[index];
                // TODO: propre
                this.SET_TRAJET_SELECTED(this.infos);
                this.$store.commit("search/SET_DEPART", "");
                this.$store.commit("search/SET_DESTINATION", "");
                //this.$store.commit("search/SET_NB_PASSAGER", 1);
                this.callChildMethod();
            },
            async openProfilMember(){
                this.SET_TRIP_SELECTED(this.infos);
                this.$refs.BottomMenuRefResults.loading = true;
                const result = await this.getProfilMember({userUid: this.infos.driver_id});
                if(result){
                    this.$refs.PaneApearProfilMemberRef.open();
                }
                this.$refs.BottomMenuRefResults.loading = false;
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
            overlay() {
                if ( ! this.overlay ) {
                    if ( this.$refs.BottomMenuRefResults && this.$refs.BottomMenuRefResults.notif ) {
                        this.$router.replace("/search")
                    }
                }
            },
            trajets() {
                this.overlayLoad = this.trajets.length == 0 ? true : false;
            },
        },
    });
</script>
