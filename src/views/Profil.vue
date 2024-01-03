

<!-- scss -->
<style lang="scss" model>

    .bottom-menu{
        z-index: 9999 !important;
    }

    .invisible {
        visibility: hidden;
    }

</style>

<style lang="scss" scoped>

    @import "@/styles/mixins.scss";

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
            @include respond-to('small') {
                width: 90%;
            }
            text-transform: uppercase;
            font-size: 12px;
            font-weight: 450;
            margin-top: 30px;
            margin-bottom: 20px;
            color: #616161;
        }
        .label-btn {
            margin-top: 20px;
            margin-bottom: 20px;
            width: 82.7%;
            @include respond-to('small') {
                width: 90%;
            }

            display: flex;
            justify-content: space-between;

            .v-btn {
                width: 138px;
                @include respond-to('small') {
                    width: 40%;
                }
                height: 32px;
                box-shadow: none;
                font-size: 12px;
                font-weight: 700;
                background-color: var(--bg-color);
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

    <ToolbarProfil />

    <v-main>
        <!-- Avatar -->
        <Avatar 
            :avatar="avatarUrl"
            :modeEdit="false" 
            :name="userName"
            :subTitle="profil.infos_perso.adress.commune"
            v-on:avatar-touched="goToInfoPerso()"
        />

        <!-- ? -->
        <PanneauInfo :infos_panneau="infos_panneau" v-on:history="onHistory()" />

        <!-- Parameter like menu TODO:no activate -->
        <GroupCard class="grouP" :groupeParameters="groupeParameters" v-if="false"/>

        <div>
            <!-- <div class="label mx-auto">tableau de board</div> -->
            <div class="label-btn mx-auto">
                <v-btn class="dashboard" :class="{active: onglet=='table-bord'}" @click="onglet='table-bord'" rounded="xl">{{ labelDashBoard }}</v-btn>
                <v-btn v-if="modeDriver" :class="{active: onglet=='planning'}" class="calendar" @click="onglet='planning'" rounded="xl"><v-icon>mdi-calendar-month</v-icon></v-btn>
                <v-btn class="my_trip" :class="{active: onglet=='trajets'}" @click="onglet='trajets'" rounded="xl">mes trajets</v-btn>
            </div>

            <!-- Tableau de bord -->
            <!-- Credit Card -->
            <CreditCard 
                v-if="onglet=='table-bord'"
                :load="loadCreaditCard"
                v-on:up-money="onUpMoney()"
                v-on:add-card="onAddCard()"
                v-on:drop-money="onDropMoney()"
                v-on:transfert-gain="transferGainToSoldes()"
            />

            <!-- Graph -->
            <StatsTrajet v-if="onglet=='table-bord'"/>

            <!-- Trajets & publication -->
            <HistoryTrajets 
                v-if="onglet=='trajets' || onglet=='planning'" 
                :infos="infosTravels" 
                :mode="onglet"
                v-on:open-contacts="$refs.PaneApearRef.open()"
            />
        </div>

        <!-- message error -->
        <v-snackbar
            class="error-snackbar"
            v-model="showSnackbarError"
            :timeout="4000"
            color="error"
        >
            <div class="contain-ico">
                <v-icon icon="mdi-alert-circle"></v-icon> 
            </div>
            <div>
                <span>{{ messageSnackbarError }}</span>
            </div>
        </v-snackbar>
    </v-main>
        
    <!-- <BottomNav /> -->

    <PaneApear ref="PaneApearRef" :class-name="['pan-apear-contact']" mode="contacts"/>

    <PaneApear ref="PaneApearProfilMemberRef" :class-name="['pan-apear-profil-member']" mode="profil-member"/>

    <v-overlay 
        v-model="overlay"
        contained
        persistent
        style="z-index: 0;"
        @click="overlay = false"
    ></v-overlay>

    <!-- history -->
    <BottomMenu
        :class-name="modeBottomMenu=='history' ? ['history'] : ['none']" 
        mode="history"
        ref="BottomMenuRefHistory" 
        v-on:close="overlay = false"
        />

    <!-- register credit card -->
    <BottomMenu
        ref="BottomMenuRefAddCard"
        :class-name="['register-credit-card']"
        mode="register-credit-card"
        v-on:close="overlay = false"
        />

    <!-- money -->
    <BottomMenu
        :class-name="['money']"
        :mode="modeBottomMenu"
        labelSelectorN1="Quel montant souhaitez-vous créditer sur votre compte ?"
        ref="BottomMenuRefMoney"
        v-on:close="overlay = false"
        v-on:drop-money="onDropMoney()"
        v-on:payment-intent-recharge="onPaymentIntentRecharge()"
        />

    <!-- money driver to passenger -->
    <BottomMenu
        :class-name="['money-driver']"
        mode="up-money"
        labelSelectorN1="Quel montant souhaitez-vous transferer sur votre compte passager ?"
        ref="BottomMenuRefMoneyDriver"
        :params-number="{min:1, max: Math.floor(gain)}"
        :upMoneyObj="{btn: 'Transferer'}"
        v-on:close="overlay = false"
        v-on:drop-money="onDropMoney()"
        v-on:up-money="overlay = false; $refs.BottomMenuRefMoneyDriver.close()"
        />

</template>



<!--  -->
<script>
    import { defineComponent } from 'vue';
    import { mapState, mapActions, mapMutations } from 'vuex';
    import axios from 'axios';

    // Components
    import ToolbarProfil from '@/components/menus/head/ToolbarProfil.vue';
    import Avatar from '@/components/profile/Avatar.vue';
    import PanneauInfo from '@/components/profile/PanneauInfo.vue';
    import GroupCard from '@/components/menus/setting/GroupCard.vue';
    import CreditCard from '@/components/profile/CreditCard.vue';
    import StatsTrajet from '@/components/profile/StatsTrajet.vue';
    import HistoryTrajets from '@/components/profile/HistoryTrajets.vue';
    // import BottomNav from '@/components/menus/BottomNav.vue';
    import BottomMenu from '@/components/menus/BottomMenu.vue';
    import PaneApear from '@/components/PaneApear.vue';    

    export default defineComponent({
        name: 'profil-view',
        computed: {
            ...mapState("profil", ["darkMode", "userName", "profil", "history", 'modeDriver', "avatarUrl", "userUid", "modeCo", "gain"]),
            ...mapState("trip", ["notMessageVue"]),
        },
        components: {
            ToolbarProfil,
            Avatar,
            PanneauInfo,
            GroupCard,
            CreditCard,
            StatsTrajet,
            HistoryTrajets,
            // BottomNav,
            BottomMenu,
            PaneApear,
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
            }
        },
        beforeMount(){
            this.checkSessionIn();
        },
        mounted(){
            this.switchModeDriverPanneauInfos();
            // this.askNewMessage();
            if( window.innerWidth <= 366 ){
                this.labelDashBoard = "synthèse";
            }

            // this.$refs.PaneApearProfilMemberRef.open()
            // this.$refs.PaneApearRef.open()
        },
        methods: {
            ...mapActions("profil", ["getTravels", "getPublish", "buildHistoriqueBooking"]),
            ...mapActions("auth", ["checkSession"]),
            ...mapMutations("profil", ["SET_LOAD_GET_TRIP_PUBLISH"]),
            ...mapMutations("trip", ["SET_NOT_MESSAGE_VUE"]),
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
            onHistory(){
                this.modeBottomMenu = "history"
                if ( this.$refs.BottomMenuRefHistory ) {
                    if( ! this.overlay ){
                        this.overlay = this.$refs.BottomMenuRefHistory.open();
                        if(this.overlay && ( this.history.historycalBooking == undefined || Object.keys(this.history.historycalBooking).length == 0 ) ){
                            this.buildHistoriqueBooking();
                        }
                    }
                    else {
                        this.overlay = this.$refs.BottomMenuRefHistory.close();
                    }
                }
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
            onAddCard(){
                if( this.modeBottomMenu != "register-credit-card" ){
                    this.modeBottomMenu = "register-credit-card";
                }

                if ( this.$refs.BottomMenuRefAddCard ) {
                    this.overlay = this.$refs.BottomMenuRefAddCard.open();
                }
            },
            onDropMoney(){
                if( this.gain == 0 ){
                    this.messageSnackbarError = "Désolé, vous n'avez pas de gains suffisants pour cette action."
                    this.showSnackbarError = true;
                }
                else{
                    if( this.modePathNavigation != "drop-money" ){
                        
                        this.modePathNavigation = "drop-money";
                        this.indexModeNavigation = -1;
                        this.pathNavigationNext();

                        setTimeout(function(){
                            if ( this.$refs.BottomMenuRefMoney ) {
                                this.overlay = this.$refs.BottomMenuRefMoney.open();
                            }
                        }.bind(this), 500);
                    }
                    else {
                        this.pathNavigationNext();
                    }
                }
            },
            onUpMoney(){
                if( this.modePathNavigation != "up-money" ){
                    this.modePathNavigation = "up-money";
                    this.indexModeNavigation = -1;
                    this.pathNavigationNext();
                    
                    setTimeout(function(){
                        if ( this.$refs.BottomMenuRefMoney ) {
                            this.overlay = this.$refs.BottomMenuRefMoney.open();
                        }
                    }.bind(this), 500);
                }
                else {
                    this.pathNavigationNext();
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
            transferGainToSoldes(){
                if( this.gain == 0 ){
                    this.messageSnackbarError = "Désolé, vous n'avez pas de gains suffisants pour cette action."
                    this.showSnackbarError = true;
                }
                else{
                    this.overlay = true;
                    this.$refs.BottomMenuRefMoneyDriver.open();
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
                this.SET_LOAD_GET_TRIP_PUBLISH(true);
                this.infosTravels = [];
                if( this.onglet == "trajets" && this.profil.myTravels.length == 0){
                    await this.getTravels();
                    this.infosTravels = this.profil.myTravels;
                }
                else if( this.onglet == "planning" && this.profil.myPublish.length == 0 ){
                    await this.getPublish();
                    this.infosTravels = this.profil.myPublish;
                }
                else{
                    this.askNewMessage();
                    if( this.onglet == "trajets" ){
                        this.infosTravels = this.profil.myTravels;
                    }
                    else if( this.onglet == "planning" ){
                        this.infosTravels = this.profil.myPublish;
                    }
                }
                this.SET_LOAD_GET_TRIP_PUBLISH(false);
                console.log("infos-travels:", this.infosTravels);
            },
            modeDriver(){
                this.switchModeDriverPanneauInfos();
            },
        }
    });
</script>
