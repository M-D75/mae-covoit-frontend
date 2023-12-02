<!--  -->
<style lang="scss" model>

    .v-main {
       .mode-publish {
            .v-switch{
                .v-input__details{
                    display: none !important;
                }
            }
        }
    }
</style>

<!-- scss -->
<style lang="scss" scoped>

    .v-main {
       padding-top: var(--safe-top);
       .mode-publish {
            margin: auto;
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translateX(-50%);
            // display: flex !important;
            align-items: center;
            .v-icon{
                color: var(--font-color-label);
                &.disabled_icon{
                    opacity: 0.1;
                }
            }
            .v-switch{
                margin: auto 11px;
                font-weight: bold;
                color: var(--font-color-label);
                .v-input__append {
                    color: var(--gray-icon-color);
                }
                .v-input__details{
                    display: none !important;
                }
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
        style="z-index: 9999;"
        @click="close()"
    ></v-overlay>

    <v-main>

        <!-- Depart -->
        <Search 
            v-if="mode=='depart' || mode=='time'"
            ref="SearchRef"
            title="D'ou partez vous ?"
            label="Saisissez une commune"
            :switche="true"
            :items="villagesSortedFiltered"
            :history="communesHistory"
            v-on:selected="getSelected()" 
            v-on:saisi="getSaisi()"
            v-on:mode-work-switch="modeWork=!modeWork"
        />

        <!-- Destination -->
        <Search 
            v-if="mode=='destination'"
            ref="SearchRef"
            title="Où allez vous ?"
            label="Saisissez une commune"
            :focus="true"
            :items="villagesSortedFiltered"
            :history="communesHistory"
            v-on:selected="getSelected()"
            v-on:saisi="getSaisi()"
        />

        <!-- Mode Publish -->
        <!-- <div class="mode-publish">
            <v-icon class="uniq-car" :class="{disabled_icon: modeWork}">mdi-car</v-icon>
            <v-switch 
                dark 
                v-model="modeWork" 
                color="blue" 
            ></v-switch>
            <v-icon class="multiple-car" :class="{disabled_icon: !modeWork}">mdi-calendar-sync</v-icon>
        </div> -->

        <!-- time : Hour Dep -->
        <BottomMenu
            v-if="mode=='time' || mode=='depart'"
            ref="BottomMenuReftime" 
            :class-name="['time']"
            mode="time"
            labelSelectorN1="A quelle heure souhaitez-vous partir ?"
            :time-init="timeInit"
            v-on:close="overlay = false; getSelected();"
            v-on:time-valided="getSelected()"
        />

        <!-- Select car -->
        <SelectCar 
            v-if="mode=='select-car' || mode == 'nb-passenger'" 
            ref="SelectCarRef" 
            v-on:car-selected="getSelected()"
        />

        <!-- number : nb-pessenger -->
        <BottomMenu
            v-if="mode=='nb-passenger' || mode=='select-car'"
            ref="BottomMenuRefnb-passenger" 
            :class-name="['number']"
            mode="nb-passenger"
            labelSelectorN1="Combien de personnes pouvez-vous prendre à bord ?"
            v-on:close="overlay = false"
            v-on:time-valided="getSelected()"
        />


        <!-- itineraire -->
        <Itineraire 
            v-if="mode=='itineraire' || mode=='select-week' || mode=='select-price' || mode=='notification' "
            ref="ItineraireRef"
            :itineraire="itineraire"
            v-on:itineraire-valided="getSelected()" 
        />

        <!-- number : select-price -->
        <BottomMenu
            v-if=" mode=='select-price' || mode=='itineraire'"
            ref="BottomMenuRefselect-price" 
            :class-name="['select_price']"
            mode="select-price"
            labelSelectorN1="Précisez le prix unitaire des places"
            v-on:close="overlay = false"
            v-on:time-valided="getSelected()"
        />

        <!-- notification -->
        <BottomMenu
            v-if="mode=='notification' || mode=='select-price' || mode=='select-week'"
            ref="BottomMenuRefnotification"
            :class-name="['notification']"
            mode="notification"
            v-on:close="overlay = false; nextStepMode()"
            v-on:time-valided="getSelected()"
        />


        <!-- *********
            Work
        -->

        <HourProgram 
            v-if="mode=='hour-program'"
            ref="HourProgramRef"
            v-on:hour-edit="goToHourEdit()"
            v-on:hour-valided="getSelected()"
        />

        <HourDepOther 
            v-if="mode=='hour-day-program'"
            ref="HourDepOtherRef"
            :hour="infosPublish.work.hour"
            v-on:hour-dep-other-valided="getSelected()"
        />

        <!-- time : hour domicile -->
        <!-- <BottomMenu
            v-if="mode=='select-day-hour-domicile'"
            ref="BottomMenuRef"
            :class-name="['select_day_hour_domicile']"
            mode="select-day-hour-domicile"
            labelSelectorN1="Repeter quelle jour ?"
            labelSelectorN2="Heur de depart du domicile"
            v-on:close="overlay = false"
            v-on:time-valided="getSelected()"
        /> -->

        <!-- day -->
        <!-- <BottomMenu
            v-if="mode=='select-day' || mode=='hour-day-program'"
            ref="BottomMenuRef"
            :class-name="['select_day']"
            mode="select-day"
            labelSelectorN1="Repeter quelle jour ?"
            v-on:close="overlay = false"
            v-on:day-valided="getSelected()"
        /> -->

        <!-- select-week -->
        <BottomMenu
            v-if="mode=='select-week' || mode=='select-price' || mode=='itineraire'"
            ref="BottomMenuRefselect-week"
            :class-name="['select_week']"
            mode="select-week"
            labelSelectorN1="Repeter combien de semaine ?"
            v-on:close="overlay = false"
            v-on:week-valided="getSelected()"
        />


    </v-main>

    <BottomNav />
</template>



<!--  -->
<script>
    import $ from 'jquery'
    import { defineComponent } from 'vue';
    import { mapState, mapGetters, mapActions } from 'vuex';

    // Components
    import BottomNav from '@/components/menus/BottomNav.vue';
    import Search from '@/components/publish/Search.vue';
    import BottomMenu from '@/components/menus/BottomMenu.vue';
    import SelectCar from '@/components/publish/SelectCar.vue';
    import Itineraire from '@/components/publish/Itineraire.vue';
    import HourProgram from '@/components/publish/HourProgram.vue';
    import HourDepOther from '@/components/publish/HourDepOther.vue';

    //import supabase from '@/utils/supabaseClient.js';


    export default defineComponent({
        name: 'publish-view',
        components: {
            BottomNav,
            Search,
            BottomMenu,
            SelectCar,
            Itineraire,
            HourProgram,
            HourDepOther,
        },
        computed: {
            ...mapState("search", ['villages', 'communesHistory']),
            ...mapGetters("search", ["getVillagesByName", "GET_ID_VILLAGE_BY_NAME"]),
            villagesSortedFiltered(){
                const typePath = this.modeWork ? "work" : "default";

                if( this.saisi == "" || this.saisi == null ){
                    if ( this.mode == "destination" ) {
                        return this.communesHistory.filter((commune) => this.saisi != commune && commune != this.infosPublish[typePath].depart && commune.toLowerCase().includes(this.saisi.toLocaleLowerCase())).slice(0, 3);
                    }
                    else if(this.mode == "depart") {
                        return this.communesHistory.slice(0, 3);
                    }
                }
                else {
                    if ( this.mode == "destination" ) {
                        return this.villages.filter(
                                (dataVillage) => this.saisi != dataVillage.village 
                                && dataVillage.village != this.infosPublish[typePath].depart 
                                && dataVillage.village.toLowerCase().replaceAll("'", "").includes(this.saisi.toLocaleLowerCase().replaceAll("'", "")))
                            .map((dataVillage) => dataVillage.village)
                            .sort((a, b) => {
                                return this.matchValue(b.replaceAll("'", ""), this.saisi) - this.matchValue(a.replaceAll("'", ""), this.saisi);
                            });
                    }
                    else if( this.mode == "depart" ) {
                        return this.villages.filter(
                                (dataVillage) => this.saisi != dataVillage.village 
                                && dataVillage.village.toLowerCase().replaceAll("'", "").includes(this.saisi.toLocaleLowerCase().replaceAll("'", ""))
                            )
                            .map((dataVillage) => dataVillage.village)
                            .sort((a, b) => {
                                return this.matchValue(b.replaceAll("'", ""), this.saisi) - this.matchValue(a.replaceAll("'", ""), this.saisi);
                            });
                    }
                }
                return [];
            },
        },
        data() {
            return {
                saisi: "",
                open: true,
                overlay: false,
                mode: "depart",
                indexMode: 0,
                modeWork: true,
                modePublish: {
                    default: [
                        {mode: "depart"}, 
                        {mode: "time"},
                        {mode: "destination"}, 
                        {mode: "select-car"},
                        {mode: "nb-passenger"},
                        {mode: "itineraire"},
                        {mode: "select-price"},
                        {mode: "notification"},
                    ],
                    work: [
                        {mode: "depart"},
                        {mode: "destination"},
                        {mode: "hour-program", otherWay: [{mode: "hour-day-program" }]},
                        {mode: "select-car"},
                        {mode: "nb-passenger"},
                        {mode: "itineraire"},
                        {mode: "select-price"},
                        {mode: "select-week"},
                        {mode: "notification"},
                    ],
                },
                infosPublish: {
                    default: {
                        depart: "",
                        destination: "",
                        time: "",
                        car: 0,
                        nbPassager: 0,
                        hourDep: "",
                        price: 0,
                        route: [],
                    },
                    work: {
                        depart: "",
                        destination: "",
                        time: "",
                        hour: {
                            home: "08:00",
                            work: "17:00",
                        },
                        daysHour: [],
                        weeks: 1,
                        car: 0,
                        nbPassager: 0,
                        hourDep: "",
                        price: 0,
                        weeksSelected: [],
                    },
                },
                itineraire: {
                    origin: {
                        location: {
                            latLng: {
                                latitude: -12.7243245,
                                longitude: 45.0589372,
                                latLngTab: [-12.7243245, 45.0589372]
                            }
                        },
                        infos: {
                            village: "Acoua",
                            commune: "Acoua",
                        }
                    },
                    destination: {
                        location: {
                            latLng: {
                                latitude: -12.9292776,
                                longitude: 45.1763906,
                                latLngTab: [-12.9292776, 45.1763906]
                            }
                        },
                        infos: {
                            village: "Bambo-Est",
                            commune: "Bandrélé",
                        }
                    },
                    departureTime: '2023-10-15T15:01:23.045123456Z',
                },
                timeInit: {
                    hourInit: 7,
                    minuteInit: 30,
                    nbPasMinutes: 5,
                },
            }
        },
        created() {
            this.chargerHistorique();
            if( this.villages == undefined || this.villages == null || this.villages.length == 0 ){
                this.getVillages;
            }
        },
        mounted() {
            $(".mode-publish").css("display", "flex");

            // this.test();
            let date = new Date();

            let offset = date.getTimezoneOffset();
            date = new Date(((date.getTime()+(60000*10)) - (offset * 60000)));

            //let hours = date.getUTCHours().toString().padStart(2, '0');
            //let minutes = date.getUTCMinutes().toString().padStart(2, '0');
            this.timeInit.hourInit = date.getUTCHours()
            this.timeInit.minuteInit = Math.ceil(date.getUTCMinutes()/this.timeInit.nbPasMinutes)*this.timeInit.nbPasMinutes

            console.log(this.$store.state.profil.userUid);

        },
        methods: {
            ...mapActions("search", ['ajouterAuHistorique', 'sauvegarderHistorique', 'chargerHistorique']),
            ...mapActions("search", ['getVillages']),
            ...mapActions("publish", ["newTrip"]),
            getSaisi(){
                $(".mode-publish").css("display", "none");
                this.saisi = this.$refs.SearchRef.saisi;
            },
            getSelected(){
                const typePath = this.modeWork ? "work" : "default";

                console.log("child-selected", this.infosPublish[typePath].depart, this.infosPublish[typePath].destination, this.mode)
                $(".mode-publish").css("display", "none");
                var _tmp_village = null; 
                switch (this.mode) {
                    case "depart":
                        // get value
                        this.infosPublish[typePath].depart = this.$refs.SearchRef.saisi;
                        this.itineraire.origin.infos.village = this.infosPublish[typePath].depart;
                        this.ajouterAuHistorique(this.infosPublish[typePath].depart);
                        this.sauvegarderHistorique();
                        _tmp_village = this.getVillagesByName(this.itineraire.origin.infos.village);
                        this.setItineraire("origin", _tmp_village[0]);
                        console.log("Name origin", this.itineraire.origin)

                        this.nextStepMode();
                        break;

                    case "time":
                        this.$refs[`BottomMenuRef${this.mode}`]
                        if ( this.$refs[`BottomMenuRef${this.mode}`] ) {
                            this.infosPublish.default.hourDep = this.$refs[`BottomMenuRef${this.mode}`].time;
                            this.itineraire.departureTime = this.convertTimeString(this.$refs[`BottomMenuRef${this.mode}`].time);
                            console.log("Time-selected:", this.infosPublish.default.hourDep, this.convertTimeString(this.infosPublish.default.hourDep));
                        }
                        
                        //close
                        this.overlay = false;
                        this.nextStepMode();
                        this.saisi = "";
                        break;

                    case "destination":
                        if (this.$refs.SearchRef) {
                            this.infosPublish[typePath].destination = this.$refs.SearchRef.saisi;
                            this.itineraire.destination.infos.village = this.infosPublish[typePath].destination;
                            this.ajouterAuHistorique(this.infosPublish[typePath].destination);
                            this.sauvegarderHistorique();
                            _tmp_village = this.getVillagesByName(this.itineraire.destination.infos.village);
                            this.setItineraire("destination", _tmp_village[0]);
                            console.log("Name dest", this.itineraire.destination)
                        }
                        this.nextStepMode();
                        break;
                    
                    case "select-car":
                        if (this.$refs.SelectCarRef) {
                            this.infosPublish[typePath].car = this.$refs.SelectCarRef.car;
                        }
                        this.nextStepMode();
                        break;

                    case "nb-passenger":
                        if (this.$refs[`BottomMenuRef${this.mode}`]) {
                            this.infosPublish[typePath].nbPassager = this.$refs[`BottomMenuRef${this.mode}`].numberSelected;
                        }
                        this.nextStepMode();
                        break;

                    case "itineraire":
                        //
                        if( this.$refs.ItineraireRef ){
                            this.infosPublish[typePath].route = this.$refs.ItineraireRef.routes[0];
                        }
                        this.nextStepMode();
                        break;

                    case "select-price":
                        if (this.$refs[`BottomMenuRef${this.mode}`]) {
                            this.infosPublish[typePath].price = this.$refs[`BottomMenuRef${this.mode}`].numberSelected;
                        }
                        // console.log("infosPusblish:", this.infosPublish);

                        if( ! this.modeWork ){
                            let infos = {
                                villageDep: this.GET_ID_VILLAGE_BY_NAME(this.infosPublish.default.depart), 
                                villageDest: this.GET_ID_VILLAGE_BY_NAME(this.infosPublish.default.destination), 
                                driverId: this.$store.state.profil.userUid, 
                                timeDep: this.convertTimeString(this.infosPublish.default.hourDep), 
                                maxSeats: this.infosPublish.default.nbPassager,
                                price: this.infosPublish.default.price,
                                route: this.infosPublish.default.route,
                            };

                            console.log("infos", infos);

                            //this.$store.dispatch('publish/newTrip', infos);
                        }

                        this.nextStepMode();
                        this.overlay = true;
                        break;

                    case "select-week":
                        
                        if (this.$refs[`BottomMenuRef${this.mode}`]) {
                            this.infosPublish[typePath].weeksSelected = this.$refs[`BottomMenuRef${this.mode}`].weeksSelected;
                            //TODO:no week selected
                            this.$refs[`BottomMenuRef${this.mode}`].close();
                        }
                        
                        console.log("infosPusblish:", this.infosPublish);
                        if( this.modeWork ){
                            
                            let infos = {
                                villageDep: this.GET_ID_VILLAGE_BY_NAME(this.infosPublish.work.depart), 
                                villageDest: this.GET_ID_VILLAGE_BY_NAME(this.infosPublish.work.destination), 
                                driverId: this.$store.state.profil.userUid, 
                                timeDep: this.convertTimeString(this.infosPublish.work.hourDep), 
                                maxSeats: this.infosPublish.work.nbPassager,
                                price: this.infosPublish.work.price,
                                route: this.infosPublish.work.route,
                                hour: this.infosPublish.work.hour,
                                daysHour: this.infosPublish.work.daysHour,
                                weeksSelected: this.infosPublish.work.weeksSelected,
                            };

                            console.log("infos-work:", infos);

                            this.$store.dispatch('publish/newTripMultple', infos);
                        }
                        
                        this.nextStepMode();
                        this.overlay = true;
                        break;
                    
                    case "select-day-hour-domicile":
                        if ( this.$refs[`BottomMenuRef${this.mode}`] ) {
                            this.infosPublish.default.hourDep = this.$refs[`BottomMenuRef${this.mode}`].numberSelected;
                        }
                        this.nextStepMode();
                        break;

                    case "hour-program":
                        this.infosPublish.work.hour = this.$refs.HourProgramRef.hour;
                        this.itineraire.departureTime = this.convertTimeString(this.infosPublish.work.hour.home);
                        console.log("get hour", this.infosPublish.work.hour);
                        this.nextStepMode();
                        break;
                    case "hour-day-program":
                        if( this.$refs.HourDepOtherRef ){
                            this.infosPublish.work.daysHour = this.$refs.HourDepOtherRef.daysHour;
                            this.itineraire.departureTime = this.convertTimeString(this.infosPublish.work.daysHour[0].hour.home);
                        }
                        console.log(this.infosPublish.work.daysHour);
                        this.nextStepMode();
                        break;
                    case "select-day":
                        this.nextStepMode();
                        break;

                    default:
                        this.nextStepMode();
                        break;
                }
            },
            nextStepMode(){
                //
                if( this.overlay ){
                    this.overlay = false;
                }

                if( ! this.modeWork ){
                    this.indexMode = (this.indexMode + 1) % this.modePublish.default.length;
                    this.mode = this.modePublish.default[this.indexMode].mode;
                }
                else{
                    this.indexMode = (this.indexMode + 1) % this.modePublish.work.length;
                    this.mode = this.modePublish.work[this.indexMode].mode;
                }

                //Reinit
                if(this.mode == this.modePublish.default[0].mode || this.mode == this.modePublish.work[0].mode){
                    $(".mode-publish").css("display", "flex");
                }

                console.log("NEW-MODE", this.mode);

                this.actionAfterNextStep()
            },
            actionAfterNextStep(){
                switch (this.mode) {
                case "depart":
                    break;

                case "time":
                    //open
                    if (this.$refs[`BottomMenuRef${this.mode}`] && !this.overlay && !this.modeWork) {
                        this.overlay = this.$refs[`BottomMenuRef${this.mode}`].open();
                    }
                    break;

                case "destination":
                    
                    break;
                
                case "select-car":
                    //open
                    if (this.$refs[`BottomMenuRef${this.mode}`] && !this.overlay) {
                        this.overlay = this.$refs[`BottomMenuRef${this.mode}`].open();
                    }
                    break;

                case "nb-passenger":
                    //open
                    if (this.$refs[`BottomMenuRef${this.mode}`]) {
                        this.overlay = this.$refs[`BottomMenuRef${this.mode}`].open();
                    }
                    break;

                case "itineraire":

                    break;

                case "select-price":
                    this.overlay = true;
                    //open
                    if ( this.$refs[`BottomMenuRef${this.mode}`] ) {
                        this.overlay = this.$refs[`BottomMenuRef${this.mode}`].open();
                    }  
                    break;
                
                case "select-week":
                    this.overlay = true;
                    //open
                    if ( this.$refs[`BottomMenuRef${this.mode}`] ) {
                        this.overlay = this.$refs[`BottomMenuRef${this.mode}`].open();
                    }  
                    break;
                
                case "select-day-hour-domicile":
                    
                    break;

                case "hour-program":
                    console.log("Hour-program");
                    break;
                case "select-day":
                    //open
                    if (this.$refs[`BottomMenuRef${this.mode}`]) {
                        this.overlay = this.$refs[`BottomMenuRef${this.mode}`].open();
                    }
                    break;
                case "notification":
                    //open
                    if (this.$refs[`BottomMenuRef${this.mode}`]) {
                        this.overlay = this.$refs[`BottomMenuRef${this.mode}`].open();
                    }
                    break;
                default:
                    // this.nextStepMode();
                    break;
                }
            },
            close(){
                if( this.overlay ){
                    this.overlay = false;
                    if(this.$refs[`BottomMenuRef${this.mode}`]){
                        this.$refs[`BottomMenuRef${this.mode}`].close();
                        this.indexMode = -1;
                        this.nextStepMode();
                    }
                }
            },
            goToHourEdit(){
                if( this.$refs.HourProgramRef ){
                    this.infosPublish.work.hour = this.$refs.HourProgramRef.hour;
                }
                this.mode = this.modePublish.work[this.indexMode].otherWay[0].mode;
            },
            setItineraire(loc, infoVillage){
                this.itineraire[loc].infos.village = infoVillage.village;
                this.itineraire[loc].infos.commune = infoVillage.commune;
                this.itineraire[loc].location.latLng.latitude = infoVillage.lat;
                this.itineraire[loc].location.latLng.longitude = infoVillage.lon;
                this.itineraire[loc].location.latLng.latLngTab = [infoVillage.lat, infoVillage.lon];
            },
            matchValue(str, query) {
                const index = str.indexOf(query);
                if (index === -1) return Infinity;
                return index;
            },
            convertTimeString(timeString) {
                // Obtenir la date et l'heure actuelles
                const now = new Date();

                // Extraire l'heure et les minutes de la chaîne d'entrée
                const [hours, minutes] = timeString.split(':').map(Number);

                // Créer un nouvel objet Date avec l'heure et les minutes spécifiées
                const time = new Date(now);
                time.setHours(hours, minutes, 0, 0);

                // Comparer avec l'heure actuelle et ajuster la date si nécessaire
                if (time <= now) {
                    time.setDate(now.getDate() + 1);
                }

                // Retourner l'objet Date résultant
                return time;
            },
            
        },
        watch: {
        }
    });
    </script>
