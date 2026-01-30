

<!-- scss -->
<style lang="scss" model>

    .bottom-menu{
        z-index: 9999 !important;
    }

    .invisible {
        visibility: hidden;
    }

    // .mask-container {
    //     position: absolute;
    //     top: 0;
    //     width: 100vw;
    //     height: 100vh;
    //     background-color: var(--bg-app-color);
    //     clip-path: circle(0% at 75.5% 35%); /* Masque initialement fermé */
    //     transition: clip-path 0.7s ease-in-out;
    // }

    // .content {
    //     // position: absolute;
    //     // top: 0;
    //     // left: 0;
    //     // width: 100%;
    //     // height: 100%;
    //     background-color: #1a1a1a;
    //     // display: flex;
    //     // align-items: center;
    //     // justify-content: center;
    // }

</style>

<style lang="scss" scoped>

    @use "@/styles/mixins.scss" as mixins;

    .ligth-mode * {
        --bg-color: #E5E5E5;
    }
    .dark-mode * {
        --bg-color: #333333;
    }

    .v-main {
        margin-bottom: 15px;
        div .label {
            width: 82.7%;
            text-transform: uppercase;
            font-size: 12px;
            font-weight: 450;
            margin-top: 30px;
            margin-bottom: 20px;
            color: #616161;
            @include mixins.respond-to('small') {
                width: 90%;
            }
        }
        .label-btn {
            margin-top: 20px;
            margin-bottom: 20px;
            width: 82.7%;
            display: flex;
            justify-content: space-between;
            @include mixins.respond-to('small') {
                width: 90%;
            }

            .v-btn {
                width: 138px;
                height: 32px;
                box-shadow: none;
                font-size: 12px;
                font-weight: 700;
                background-color: var(--border-color);
                color: var(--font-color-label);
                &.dashboard{
                    content: "nbonjo";
                }
                &.active {
                    background-color: var(--blue-color);
                    color: white;
                }
                &.calendar {
                    width: 0px !important;
                    min-width: 20px !important;
                    .v-icon {
                        font-size: 20px;
                    }
                }
                .notif-point {
                    border-radius: 500px;
                    background-color: red;
                    opacity: 0.5;
                    width: 10px;
                    height: 10px;
                    position: absolute;
                    top: -2px;
                    left: -2px;
                }
                @include mixins.respond-to('small') {
                    width: 40%;
                }
            }
        }
    }

    .grouP {
        margin-top: 50px;
    }

    .bc-cal{
        background-color: #e5e5e5;
        width: 20px;
        height: 20px;
        font-size: 20px;
        border-radius: 50px;
    }
    
</style>
   
<!--  -->
<template>

    <!-- <ToolbarProfil /> -->

    <v-main>
        <!-- Avatar -->
        <Avatar 
            :avatar="avatarUrl"
            :modeEdit="false" 
            :name="userName"
            :subTitle="profil.infos_perso.adress.commune"
            :identity="identity"
            v-on:avatar-touched="goToInfoPerso()"
        />
        
        <!-- ? -->
        <PanneauInfo 
            :infos_panneau="infos_panneau" 
            v-on:history="$emit('on-history')" 
            v-on:switch-theme-color="$emit('toggle-mask');" 
            v-on:icon-coordinates="forwardCoordinates"
            />

        <!-- Parameter like menu TODO:no activate -->
        <GroupCard class="grouP" :groupeParameters="groupeParameters" v-if="false"/>

        <div>
            <!-- <div class="label mx-auto">tableau de board</div> -->
            <!-- onglets -->
            <div class="label-btn mx-auto">
                <v-btn class="dashboard" :class="{active: onglet=='table-bord'}" @click="onglet='table-bord'" rounded="xl">{{ labelDashBoard }}</v-btn>
                <v-btn v-if="modeDriver" :class="{active: onglet=='planning'}" class="calendar" @click="onglet='planning'" rounded="xl">
                    <v-icon>mdi-calendar-month</v-icon>
                    <div v-if="trajetAvail=='driver'" class="notif-point"></div>
                </v-btn>
                <v-btn class="my_trip" :class="{active: onglet=='trajets'}" @click="onglet='trajets'" rounded="xl">
                    mes trajets
                    <div v-if="trajetAvail=='passenger'" class="notif-point"></div>
                </v-btn>
            </div>

            <!-- Tableau de bord -->
            <!-- Credit Card -->
            <CreditCard 
                v-if="onglet=='table-bord'"
                :load="loadCreaditCard"
                v-on:up-money="$emit('on-up-money')"
                v-on:add-card="$emit('on-add-card')"
                v-on:drop-money="$emit('on-drop-money')"
                v-on:transfert-gain="$emit('transfert-gain-to-soldes')"
            />

            <!-- Graph -->
            <StatsTrajet v-if="onglet=='table-bord' && 2==4"/>

            <!-- Trajets & publication -->
            <HistoryTrajets 
                v-if="onglet=='trajets' || onglet=='planning'" 
                :infos="infosTravels" 
                :mode="onglet"
                v-on:open-contacts="$emit('open-contacts')"
                v-on:open-member="$emit('open-member')"
                v-on:booking-removed="updateTripInfos()"
            />
        </div>
    </v-main>

</template>



<!--  -->
<script>
    import { defineComponent } from 'vue';
    import { mapState, mapActions, mapMutations } from 'vuex';
    import axios from 'axios';

    // import $ from 'jquery';

    // Components
    import Avatar from '@/components/profile/Avatar.vue';
    import PanneauInfo from '@/components/profile/PanneauInfo.vue';
    import GroupCard from '@/components/menus/setting/GroupCard.vue';
    import CreditCard from '@/components/profile/CreditCard.vue';
    import StatsTrajet from '@/components/profile/StatsTrajet.vue';
    import HistoryTrajets from '@/components/profile/HistoryTrajets.vue';

    export default defineComponent({
        name: 'comp-profil',
        emits: [
            "on-history", "on-up-money", "on-add-card", "on-drop-money", 
            "transfert-gain-to-soldes", "open-contacts", "open-member",
            "toggle-mask", "icon-coordinates"
        ],
        computed: {
            ...mapState("profil", ["darkMode", "userName", "profil", "history", 'modeDriver', "avatarUrl", "userUid", "modeCo", "gain", "identity"]),
            ...mapState("trip", ["notMessageVue"]),
        },
        components: {
            Avatar,
            PanneauInfo,
            GroupCard,
            CreditCard,
            StatsTrajet,
            HistoryTrajets,
        },
        data() {
            return {
                labelDashBoard: "tableau de bord",
                modeBottomMenu: "password",
                modeEdit: false,
                overlay: false,
                onglet: "table-bord",
                infos_panneau: [
                    {
                        btn:true,
                        icon:"mdi-history",
                        text:"historique",
                    },
                    {
                        btn:true,
                        icon:"mdi-car",
                        text:"chauffeur",
                    },
                    {
                        btn:true,
                        icon: ! this.$store.state.profil.darkMode ? "mdi-lightbulb-on" : "mdi-moon-waning-crescent",
                        text:"mode",
                    },
                ],
                groupeParameters: [
                    {
                        label: "profil vérifié",
                        parameters: [
                            {
                                prependIconColor: "var(--blue-color)",
                                prependIcon:"mdi-fingerprint",
                                text:"Identité & coordonnées",
                                chip:true,
                                chipIcon: null,
                                chipText: "3/3",
                            },
                        ],
                    },
                    {
                        label: "véhicule",
                        parameters: [
                            {
                                prependIconColor: "var(--blue-color)",
                                prependIcon:"mdi-car",
                                text:"VW - GOLF 7",
                                chip:true,
                                chipIcon: null,
                                chipText: "",
                            },
                        ],
                    },
                    {
                        label: "préferences de voyage",
                        parameters: [
                            {
                                prependIconColor: "var(--blue-color)",
                                prependIcon:"mdi-forum",
                                text:"J'aime bien discuter",
                                chip:false,
                                chipIcon: null,
                                chipText: "",
                            },
                            {
                                prependIconColor: "#ff5353",
                                prependIcon:"mdi-smoking-off",
                                text:"Pas de cigarette en voiture",
                                chip:false,
                                chipIcon: null,
                                chipText: "",

                            },
                            {
                                prependIconColor: "#9fcb66",
                                prependIcon:"mdi-music",
                                text:"Music tout au long !",
                                chip:false,
                                chipIcon: null,
                                chipText: "",

                            },
                            {
                                prependIconColor: "#ff9c00",
                                prependIcon:"mdi-paw",
                                text:"J'aime bien les animaux",
                                chip:false,
                                chipIcon: null,
                                chipText: "",

                            },
                        ],
                    },
                ],
                indexModeNavigation: 0,
                modePathNavigation: '',
                pathNavigation: {
                    'drop-money': [
                            {mode:'drop-money'}, 
                            {mode:'confirme-drop-money'},
                        ],
                    'up-money': [
                            {mode:'up-money'}, 
                            {mode:'confirme-up-money'},
                        ],
                },
                infosTravels: [],
                loadCreaditCard: false,
                showSnackbarError: false,
                messageSnackbarError: "",
                trajetAvail: "",
            }
        },
        beforeMount(){
            this.checkSessionIn();
        },
        mounted(){
            this.switchModeDriverPanneauInfos();

            //this.$refs.BottomMenuRefConfirmChoice.open()
            // this.askNewMessage();
            if( window.innerWidth <= 366 ){
                this.labelDashBoard = "synthèse";
            }

            if( this.$route.params.action == 'open-trip-passenger' ){
                this.onglet = "trajets";
            }
            else if( this.$route.params.action == 'open-trip-driver' ){
                this.SET_MODE_DRIVER(true);
                this.onglet = "planning";
            }

            this.checkDateTrip()

            // this.$refs.PaneApearProfilMemberRef.open()
            // this.$refs.PaneApearRef.open()
        },
        methods: {
            ...mapActions("profil", ["getTravels", "getPublish", "buildHistoriqueBooking"]),
            ...mapActions("auth", ["checkSession"]),
            ...mapMutations("profil", ["SET_LOAD_GET_TRIP_PUBLISH", "SET_MODE_DRIVER", "SET_REMOVE_HISTORY_DATES", "SET_NB_PASSAGER"]),
            ...mapMutations("trip", ["SET_NOT_MESSAGE_VUE"]),
            forwardCoordinates(coordinates){
                this.$emit('icon-coordinates', coordinates);
            },
            async checkSessionIn(){
                this.loadCreaditCard = true
                const sessionValided = await this.$store.dispatch("auth/checkSession");
                if( ! sessionValided )
                    this.$router.replace("/");
                else
                    this.loadCreaditCard = false;
            },
            goToInfoPerso(){
                this.$router.push("/profil/perso")
            },
            callCloseBottomChild() {
                if ( this.$refs.BottomMenuRef ) {
                    this.overlay = this.$refs.BottomMenuRef.close();
                }
            },
            addCredit(){
                console.log("addCredit")
                if( this.modeBottomMenu != "add-credit-notif" ){
                    this.modeBottomMenu = "add-credit-notif";
                    if ( this.$refs.BottomMenuRefMoney ) {
                        console.log("add-credit-2")
                        this.overlay = this.$refs.BottomMenuRefMoney.open();
                    }
                }
                else if( this.modeBottomMenu == "add-credit-notif" ){
                    this.modeBottomMenu = "add-credit";
                    if ( this.$refs.BottomMenuRefMoney ) {
                        console.log("add-credit-3")
                        this.overlay = this.$refs.BottomMenuRefMoney.open();
                    }
                }
            },
            pathNavigationNext(){
                this.indexModeNavigation = (this.indexModeNavigation + 1) % this.pathNavigation[this.modePathNavigation].length;
                this.modeBottomMenu = this.pathNavigation[this.modePathNavigation][this.indexModeNavigation].mode;
                console.log("pathNavNext:", this.modeBottomMenu, this.indexModeNavigation, this.modePathNavigation)
            },
            switchModeDriverPanneauInfos(){
                if(this.modeDriver){
                    this.infos_panneau[1].icon = "mdi-car";
                    this.infos_panneau[1].text = "chauffeur";
                }
                else{
                    this.infos_panneau[1].icon = "mdi-seat-passenger";
                    this.infos_panneau[1].text = "passager";
                    if(this.onglet == "planning")
                        this.onglet = "table-bord";
                }
            },
            askNewMessage(){
                const adresse = {local: "http://localhost:3001", online: window.location.protocol == 'http:' ? "http://server-mae-covoit-notif.infinityinsights.fr" : "https://server-mae-covoit-notif.infinityinsights.fr"}

                const typeUrl = this.modeCo;
                if(this.infosTravels.length > 0){
                    axios.post(`${adresse[typeUrl]}/askNewMessage`, {
                            userId: this.userUid,
                        })
                        .then(response => {
                            console.log("askNewMessage", response.data);
                            const data = response.data;

                            this.SET_NOT_MESSAGE_VUE(data.idsTrip);
                            if( this.infosTravels.length > 0){
                                this.updateNotifMessage();
                            }
                        })
                        .catch(error => {
                            console.error('Il y a eu une erreur :', error);
                        });
                }
            },
            updateNotifMessage(){
                console.log("updateNotifMessage");
                for ( const key in this.infosTravels ) {
                    //const infos = this.infosTravels[key].infos;
                    for ( const keyInfo in this.infosTravels[key].infos ) {
                        console.log(this.infosTravels[key].infos[keyInfo], this.notMessageVue.includes(this.infosTravels[key].infos[keyInfo].id + ""));
                        if ( this.notMessageVue.includes(this.infosTravels[key].infos[keyInfo].id + "") ) {
                            this.infosTravels[key].infos[keyInfo].notifMessage = true;
                        }
                        else{
                            this.infosTravels[key].infos[keyInfo].notifMessage = false;
                        }
                    }
                }
            },
            onPaymentIntentRecharge(){
                if(this.$refs.BottomMenuRefMoney){
                    this.modeBottomMenu = 'payment-intent';
                    setTimeout(function(){
                        this.$refs.BottomMenuRefMoney.reOpenB();
                    }.bind(this), 1000);
                    // this.$refs.BottomMenuRefMoney.
                }
            },
            checkDateTrip(){
                console.log("\ncheckDateTrip:", this.history);
                const dateToday = new Date();
                // date passenger
                for (let index = 0; index < this.history.datesTripPassenger.length; index++) {
                    const departure_time = this.history.datesTripPassenger[index];
                    const dateTrip = new Date(departure_time);
                    if( dateTrip.getTime() + ((60*1000)*10) < dateToday.getTime() ){
                        this.SET_REMOVE_HISTORY_DATES({ type: "passenger", index: index });
                    }
                    else if( dateTrip.getTime() > dateToday.getTime() - ((60*1000)*30) ){
                        this.trajetAvail = "passenger";
                        console.log("Trip Passenger Founded\n");
                        return;
                    }
                }

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
            async updateTripInfos(){
                // TODO : infosTravels need to reloaded every time
                this.SET_LOAD_GET_TRIP_PUBLISH(true);
                this.infosTravels = [];
                if( this.onglet == "trajets" ){
                    await this.getTravels();
                    this.infosTravels = this.profil.myTravels;
                    this.askNewMessage();
                }
                else if( this.onglet == "planning" ){
                    await this.getPublish();
                    this.infosTravels = this.profil.myPublish;
                    this.askNewMessage();
                }
                // else{
                //     this.askNewMessage();
                //     if( this.onglet == "trajets" ){
                //         this.infosTravels = this.profil.myTravels;
                //     }
                //     else if( this.onglet == "planning" ){
                //         this.infosTravels = this.profil.myPublish;
                //     }
                // }
                this.SET_LOAD_GET_TRIP_PUBLISH(false);
                console.log("infos-travels:", this.infosTravels);
            },
        },
        watch: {
            darkMode(){
                this.infos_panneau[2].icon = ! this.darkMode ? "mdi-lightbulb-on" : "mdi-moon-waning-crescent";
            },
            overlay(){
                if( ! this.overlay ){
                    if ( this.$refs.BottomMenuRefHistory ) {
                        this.$refs.BottomMenuRefHistory.close();
                    }

                    if ( this.$refs.BottomMenuRefMoney ) {
                        this.$refs.BottomMenuRefMoney.close();
                    }

                    if ( this.$refs.BottomMenuRefAddCard ) {
                        this.$refs.BottomMenuRefAddCard.close();
                    }

                    if ( this.$refs.BottomMenuRefMoneyDriver ) {
                        this.$refs.BottomMenuRefMoneyDriver.close();
                    }
                    this.indexModeNavigation = -1;
                    this.modePathNavigation = "";
                }
            },
            async onglet(){
                this.updateTripInfos();
            },
            modeDriver(){
                this.switchModeDriverPanneauInfos();
            },
            
        }
    });
</script>
