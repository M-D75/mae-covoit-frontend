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

        .nothing {
            display: table;
            text-align: center;
            height: 83vh;

            .contenu {
                text-align: center;
                display: table-cell;
                vertical-align: middle;
                color: var(--font-color-label);
                i {
                    font-size: 35px;
                    // margin-bottom: 5px;
                }

                span {
                    font-size: 17px;
                    // text-transform: uppercase;
                    display: block;
                    margin: 15px auto;
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

    <v-main v-if="isDriver">

        <!-- Depart -->
        <Search 
            v-if="mode=='depart' || mode=='time'"
            ref="SearchRefdepart"
            title="D'ou partez vous ?"
            label="Saisissez un village"
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
            ref="SearchRefdestination"
            title="Où allez vous ?"
            label="Saisissez un village"
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
            :paramsNumber="{min: 1, max: max_seats}"
            mode="nb-passenger"
            labelSelectorN1="Combien de personnes pouvez-vous prendre à bord ?"
            v-on:close="overlay = false"
            v-on:time-valided="getSelected()"
        />


        <!-- itineraire -->
        <Itineraire 
            v-if="mode=='itineraire' || mode=='select-day' || mode=='select-week' || mode=='select-price' || mode=='notification' "
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
            :message="notification.message"
            :notification="notification"
            v-on:close="overlay = false; nextStepMode()"
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
        <BottomMenu
            v-if="mode=='select-day' || mode=='hour-day-program' || mode=='select-price'"
            ref="BottomMenuRefselect-day"
            :class-name="['select_day']"
            mode="select-day"
            labelSelectorN1="Repeter quelle jour ?"
            v-on:close="overlay = false"
            v-on:day-valided="getSelected()"
            v-on:day-not-selected="showError('Aucun jour n\'a été selectionné')"
        />

        <!-- select-week -->
        <BottomMenu
            v-if="mode=='select-week' || mode=='select-day' || mode=='select-price' || mode=='itineraire'"
            ref="BottomMenuRefselect-week"
            :class-name="['select_week']"
            mode="select-week"
            labelSelectorN1="Repeter combien de semaine ?"
            v-on:close="overlay = false"
            v-on:week-valided="getSelected()"
        />

        
    </v-main>

    <v-main v-else>
        <div class="nothing label-filter text-caption mx-auto">
            <div v-if="nothing" class="contenu">
                <v-icon icon="mdi-car-off"></v-icon>
                <span v-if="cars.length == 0 ">Oups ! Il semble que votre garage soit vide. Que diriez-vous de lui donner vie en ajoutant un véhicule pour votre annonce ? 🚗✨</span>
                <span v-if="cars.length != 0 && ! payouts_enabled">Attention vous ne serez pas payé si vous n'enregistrer pas vos coordonnées bancaire, souhaitez vous continuer ? 🚗✨</span>
                <v-btn
                    color="blue"
                    icon
                    @click="goToAddVehicul()"
                >
                    <!-- <v-progress-circular v-if="load" indeterminate color="white"></v-progress-circular> -->
                    <v-icon class="zoom-bounce" icon="mdi-car-side"></v-icon>
                </v-btn>
            </div>
        </div>
    </v-main>

    <!-- message error -->
    <v-snackbar
        v-model="showSnackbar.showError"
        :timeout="4000"
        color="error"
    >
        <div class="contain-ico">
            <v-icon icon="mdi-alert-circle"></v-icon> 
        </div>
        <div>
            <span>{{ showSnackbar.messageError }}</span>
        </div>
    </v-snackbar>

    <!-- Load -->
    <v-overlay
        :model-value="overlayLoad"
        disabled
        class="align-center justify-center"
        style="z-index: 9999;"
    >
        <v-progress-circular
            color="blue"
            indeterminate
            size="64"
        ></v-progress-circular>
    </v-overlay>

</template>



<!--  -->
<script>
    import $ from 'jquery'
    import { defineComponent } from 'vue';
    import { mapState, mapGetters, mapActions } from 'vuex';

    // Components
    import Search from '@/components/publish/Search.vue';
    import BottomMenu from '@/components/menus/BottomMenu.vue';
    import SelectCar from '@/components/publish/SelectCar.vue';
    import Itineraire from '@/components/publish/Itineraire.vue';
    import HourProgram from '@/components/publish/HourProgram.vue';
    import HourDepOther from '@/components/publish/HourDepOther.vue';


    //import supabase from '@/utils/supabaseClient.js';
    import { getFirstDayOfWeek, findKeyOfNullOrUndefined } from '@/utils/utils.js'
    // import { Capacitor } from '@capacitor/core';

    // const isIOS = Capacitor.getPlatform() === 'ios';

    export default defineComponent({
        name: 'publish-view',
        components: {
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
            ...mapState("profil", ['cars', "payouts_enabled"]),
            villagesSortedFiltered(){
                const typePath = this.modeWork ? "work" : "default";

                if( this.saisi == "" || this.saisi == null ){
                    if ( this.mode == "destination" ) {
                        return this.communesHistory.filter((commune) => this.saisi != commune && commune != this.infosPublish[typePath].depart && commune.toLowerCase().includes(this.saisi.toLocaleLowerCase())).slice(0, 3);
                    }
                    else if( this.mode == "depart" ) {
                        return this.communesHistory.slice(0, 3);
                    }
                }
                else {
                    if ( this.mode == "destination" ) {
                        const villages = this.villages.filter(
                                (dataVillage) => this.saisi != dataVillage.village 
                                && dataVillage.village != this.infosPublish[typePath].depart 
                                && dataVillage.village.toLowerCase().replaceAll("'", "").includes(this.saisi.toLocaleLowerCase().replaceAll("'", "")))
                            .map((dataVillage) => dataVillage.village)
                            .sort((a, b) => {
                                return this.matchValue(a.toLocaleLowerCase().replaceAll("'", ""), this.saisi.toLocaleLowerCase().replaceAll("'", "")) - this.matchValue(b.toLocaleLowerCase().replaceAll("'", ""), this.saisi.toLocaleLowerCase().replaceAll("'", ""));                                
                            });

                        return villages;

                    }
                    else if( this.mode == "depart" ) {

                        const villages = this.villages.filter(
                                (dataVillage) => this.saisi != dataVillage.village 
                                && dataVillage.village.toLowerCase().replaceAll("'", "").includes(this.saisi.toLocaleLowerCase().replaceAll("'", ""))
                            )
                            .map((dataVillage) => dataVillage.village)
                            .sort((a, b) => {
                                return this.matchValue(a.toLocaleLowerCase().replaceAll("'", ""), this.saisi.toLocaleLowerCase().replaceAll("'", "")) - this.matchValue(b.toLocaleLowerCase().replaceAll("'", ""), this.saisi.toLocaleLowerCase().replaceAll("'", "")); 
                            });
                        
                        return villages;
                        // else
                        //     return villages.slice().reverse();
                    }
                }
                return [];
            },
        },
        data() {
            return {
                isDriver: false,
                nothing: false,
                overlayLoad: true,
                saisi: "",
                open: true,
                overlay: false,
                mode: "depart",
                indexMode: 0,
                modeWork: false,
                max_seats: 2,
                notification: {
                    color:  "mdi-check-circle",
                    icon: "#9fcb66",
                    message: "Votre trajet à bien été publié !!!",
                },
                modePublish: {
                    default: [
                        {mode: "depart", go: true}, 
                        {mode: "time", go: true},
                        {mode: "destination", go: true}, 
                        {mode: "select-car", go: true},
                        {mode: "nb-passenger", go: true},
                        {mode: "itineraire", go: true},
                        {mode: "select-price", go: true},
                        {mode: "notification", go: true},
                    ],
                    work: [
                        {mode: "depart", go: true },
                        {mode: "destination", go: true },
                        {mode: "hour-program", go: true, otherWay: [{mode: "hour-day-program", go: true }]},
                        {mode: "select-car", go: true },
                        {mode: "nb-passenger", go: true },
                        {mode: "itineraire", go: true },
                        {mode: "select-price", go: true },
                        {mode: "select-day", go: true },
                        {mode: "select-week", go: true },
                        {mode: "notification", go: true },
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
                        sameHour: true,
                        hour: {
                            home: "08:00",
                            work: "17:00",
                        },
                        daysSelected: [],
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
                showSnackbar: {
                    showError: false,
                    messageError: "",
                }
            }
        },
        created() {
            this.chargerHistorique();
            if( this.villages == undefined || this.villages == null || this.villages.length == 0 ){
                this.getVillages();
            }
        },
        async mounted() {
            $(".mode-publish").css("display", "flex");

            await this.getProvider();
            

            // const res = await this.getCars();
            // if( res.status == 0 ){
            //     if( this.cars.length == 0 || ! this.payouts_enabled ){
            //         this.nothing = true;
            //     }
            //     else{
            //         this.isDriver = true;
            //     }
            // }
            // else{
            //     this.showError("Une erreur s'est produite. Veuillez réessayer plus tard. Si le problème persiste, n'hésitez pas à contacter notre support.");
            // }
            
            // TODO : test
            this.isDriver = true;

            this.overlayLoad = false;

            // this.test();
            let date = new Date();

            let offset = date.getTimezoneOffset();
            date = new Date(((date.getTime()+(60000*15)) - (offset * 60000)));

            //let hours = date.getUTCHours().toString().padStart(2, '0');
            //let minutes = date.getUTCMinutes().toString().padStart(2, '0');
            this.timeInit.hourInit = date.getUTCHours()
            this.timeInit.minuteInit = (Math.ceil(date.getUTCMinutes()/this.timeInit.nbPasMinutes)*this.timeInit.nbPasMinutes)%60;
            

            console.log(this.$store.state.profil.userUid, this.timeInit);

            console.log("getFirstDayOfWeek:", getFirstDayOfWeek("S50").getUTCDate());

        },
        methods: {
            ...mapActions("search", ['ajouterAuHistorique', 'sauvegarderHistorique', 'chargerHistorique']),
            ...mapActions("search", ['getVillages']),
            ...mapActions("publish", ["newTrip", "getPriceRecommended"]),
            ...mapActions("profil", ["getCars", "getProvider"]),
            getSaisi(){
                $(".mode-publish").css("display", "none");
                if(this.$refs[`SearchRef${this.mode}`])
                    this.saisi = this.$refs[`SearchRef${this.mode}`].saisi;
            },
            async getSelected(){
                const typePath = this.modeWork ? "work" : "default";

                console.log("child-selected", this.infosPublish[typePath].depart, this.infosPublish[typePath].destination, this.mode)
                $(".mode-publish").css("display", "none");
                var _tmp_village = null; 
                var _tmp_village_orig = null;
                let selectDayObj = null;
                var result = null;

                switch (this.mode) {
                    case "depart":
                        //reinit
                        selectDayObj = this.modePublish.work.find((mode) => (mode.mode == "select-day"));
                        if ( selectDayObj )
                            selectDayObj.go = true;
                        this.infosPublish.work.sameHour = true;

                        // get value
                        this.infosPublish[typePath].depart = this.$refs[`SearchRef${this.mode}`].saisi;
                        this.itineraire.origin.infos.village = this.infosPublish[typePath].depart;
                        this.ajouterAuHistorique(this.infosPublish[typePath].depart);
                        this.sauvegarderHistorique();
                        _tmp_village = this.getVillagesByName(this.itineraire.origin.infos.village);
                        this.setItineraire("origin", _tmp_village);
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
                        if ( this.$refs[`SearchRef${this.mode}`] ) {
                            this.infosPublish[typePath].destination = this.$refs[`SearchRef${this.mode}`].saisi;
                            this.itineraire.destination.infos.village = this.infosPublish[typePath].destination;
                            this.ajouterAuHistorique(this.infosPublish[typePath].destination);
                            this.sauvegarderHistorique();
                            _tmp_village = this.getVillagesByName(this.itineraire.destination.infos.village);
                            this.setItineraire("destination", _tmp_village);
                            console.log("Name dest", this.itineraire.destination)
                            _tmp_village_orig = this.getVillagesByName(this.itineraire.origin.infos.village);
                            result = await this.getPriceRecommended({orig_id: _tmp_village_orig.id, dest_id: _tmp_village.id});
                            if( result.status != 0 ){
                                this.showError(result.message);
                                setTimeout(this.$router.go(), 4000);
                                // this.mode = "depart";
                                return;
                            }

                        }
                        this.nextStepMode();
                        break;
                    
                    case "select-car":
                        if (this.$refs.SelectCarRef) {
                            console.log("car--", this.$refs.SelectCarRef.car);
                            this.infosPublish[typePath].car = this.$refs.SelectCarRef.car;
                            this.max_seats = this.$refs.SelectCarRef.seats;
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
                                car_id: this.infosPublish.default.car,
                            };

                            console.log("infos", infos);

                            const keyNovalue = findKeyOfNullOrUndefined(infos)

                            if(keyNovalue == null){
                                console.log("infos-work:", infos);

                                this.overlayLoad = true;
                                const response = await this.$store.dispatch('publish/newTrip', infos);

                                if( response.status == 0 ){
                                    this.notification = {
                                            message: "Votre trajet à bien était publié !",
                                            icon: "mdi-check-circle",
                                            color: "#9fcb66",
                                        }
                                }
                                else{
                                    this.notification = {
                                            message: response.message,
                                            icon: "mdi-alert-circle",
                                            color: "red",
                                        }
                                }
                            }
                            else{
                                this.showError(`Une valeur est manquante, veuillez réesayez plus tard (${keyNovalue})`)
                                this.notification = {
                                        message: "Une erreur s'est produite, veuillez réessayer plus tard !",
                                        icon: "mdi-alert-circle",
                                        color: "red",
                                    };
                            }
                        }

                        this.overlayLoad = false;
                        this.nextStepMode();
                        this.overlay = true;
                        break;
                    case "select-day":
                        if (this.$refs[`BottomMenuRef${this.mode}`]) {
                            this.infosPublish[typePath].daysSelected = this.$refs[`BottomMenuRef${this.mode}`].daysSelected;
                        }
                        this.nextStepMode();
                        break;
                    case "select-week":
                        
                        if (this.$refs[`BottomMenuRef${this.mode}`]) {
                            this.infosPublish[typePath].weeksSelected = this.$refs[`BottomMenuRef${this.mode}`].weeksSelected;
                            //TODO:no week selected
                            this.$refs[`BottomMenuRef${this.mode}`].close();
                        }
                        
                        console.log("infosPusblish:", this.infosPublish);
                        if( this.modeWork ){

                            if( this.infosPublish.work.sameHour ){
                                //Build days Hour
                                for (let index = 0; index < this.infosPublish[typePath].daysSelected.length; index++) {
                                    const dayHour = {
                                            day: this.infosPublish[typePath].daysSelected[index].dayName, 
                                            hour: {
                                                home: this.infosPublish.work.hour.home,
                                                work: this.infosPublish.work.hour.work,
                                            },
                                            values: {
                                                home: this.infosPublish[typePath].daysSelected[index].selected,
                                                work: this.infosPublish[typePath].daysSelected[index].selected,
                                            },
                                        }
                                    this.infosPublish.work.daysHour.push(dayHour);
                                }
                                console.log("sameHour", this.infosPublish.work.daysHour);
                            }
                            
                            
                            let infos = {
                                villageDep: this.GET_ID_VILLAGE_BY_NAME(this.infosPublish.work.depart), 
                                villageDest: this.GET_ID_VILLAGE_BY_NAME(this.infosPublish.work.destination), 
                                driverId: this.$store.state.profil.userUid, 
                                maxSeats: this.infosPublish.work.nbPassager,
                                price: this.infosPublish.work.price,
                                route: this.infosPublish.work.route,
                                daysHour: this.infosPublish.work.daysHour,
                                weeksSelected: this.infosPublish.work.weeksSelected,
                                car_id: this.infosPublish.work.car,
                            };

                            const keyNovalue = findKeyOfNullOrUndefined(infos)

                            if(keyNovalue == null){
                                console.log("infos-work:", infos);

                                this.overlayLoad = true;
                                const response = await this.$store.dispatch('publish/newTripMultple', infos);

                                if( response.status == 0 ){
                                    this.notification = {
                                            message: "Vos trajets ont bien était publié !",
                                            icon: "mdi-check-circle",
                                            color: "#9fcb66",
                                        }
                                }
                                else{
                                    this.notification = {
                                            message: response.message,
                                            icon: "mdi-alert-circle",
                                            color: "red",
                                        }
                                }
                            }
                            else{
                                this.showError(`Une valeur est manquante, veuillez réesayez plus tard (${keyNovalue})`)
                                this.notification = {
                                        message: "Une erreur s'est produite, veuillez réessayer plus tard !",
                                        icon: "mdi-alert-circle",
                                        color: "red",
                                    }
                            }
                        }
                        
                        this.overlayLoad = false;
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

                const typePath = this.modeWork ? "work" : "default";
                let found = false;
                while( ! found ){
                    this.indexMode = (this.indexMode + 1) % this.modePublish[typePath].length;
                    if( this.modePublish[typePath][this.indexMode].go ){
                        this.mode = this.modePublish[typePath][this.indexMode].mode;
                        found = true;
                    }
                }

                //Reinit
                if(this.mode == this.modePublish.default[0].mode || this.mode == this.modePublish.work[0].mode){
                    $(".mode-publish").css("display", "flex");
                }

                console.log("NEW-MODE:", this.mode);

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
                    if ( this.$refs[`BottomMenuRef${this.mode}`] ) {
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
                    if( this.$refs[`BottomMenuRef${this.mode}`] ){
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
                this.infosPublish.work.sameHour = false;
                
                let selectDayObj = this.modePublish.work.find(item => item.mode === "select-day");
                if ( selectDayObj )
                    selectDayObj.go = false;

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
            showError(message){
                this.showSnackbar.messageError = message;
                this.showSnackbar.showError = true;
            },
            goToAddVehicul(){
                this.$router.push('/profil/perso/open-add-vehicle');
            },
        },
        watch: {
        }
    });
    </script>
