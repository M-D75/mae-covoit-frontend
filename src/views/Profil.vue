

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
        }
        .label-btn {
            margin-top: 20px;
            margin-bottom: 20px;
            width: 82.7%;
            display: flex;
            justify-content: space-between;
            .v-btn {
                width: 138px;
                height: 32px;
                box-shadow: none;
                font-size: 12px;
                font-weight: 700;
                background-color: var(--bg-color);
                color: var(--font-color-label);
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
            :modeEdit="false" 
            :name="userName"
            v-on:avatar-touched="goToInfoPerso()"
        />

        <!-- ? -->
        <PanneauInfo :infos_panneau="infos_panneau" v-on:history="onHistory()" />

        <!-- Parameter like menu TODO:no activate -->
        <GroupCard class="grouP" :groupeParameters="groupeParameters" v-if="false"/>

        <div>
            <!-- <div class="label mx-auto">tableau de board</div> -->
            <div class="label-btn mx-auto">
                <v-btn :class="{active: onglet=='table-bord'}" @click="onglet='table-bord'" rounded="xl">tableau de bord</v-btn>
                <v-btn :class="{active: onglet=='planning'}" class="calendar" @click="onglet='planning'" rounded="xl"><v-icon>mdi-calendar-month</v-icon></v-btn>
                <v-btn :class="{active: onglet=='trajets'}" @click="onglet='trajets'" rounded="xl">mes trajets</v-btn>
            </div>

            <!-- Tableau de bord -->
            <!-- Credit Card -->
            <CreditCard 
                v-if="onglet=='table-bord'"
                v-on:up-money="onUpMoney()"
                v-on:add-card="onAddCard()"
                v-on:drop-money="onDropMoney()"
            />

            <!-- Graph -->
            <StatsTrajet v-if="onglet=='table-bord'"/>

            <!-- Trajets -->
            <HistoryTrajets v-if="onglet=='trajets' || onglet=='planning'" :infos="infosTravels" :mode="onglet"/>
        </div>
    </v-main>
        
    <BottomNav />

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
        v-on:up-money="onUpMoney()"
        />

</template>



<!--  -->
<script>
    import { defineComponent } from 'vue';
    import { mapState, mapActions, mapMutations } from 'vuex';

    // Components
    import ToolbarProfil from '@/components/menus/head/ToolbarProfil.vue';
    import Avatar from '@/components/profile/Avatar.vue';
    import PanneauInfo from '@/components/profile/PanneauInfo.vue';
    import GroupCard from '@/components/menus/setting/GroupCard.vue';
    import CreditCard from '@/components/profile/CreditCard.vue';
    import StatsTrajet from '@/components/profile/StatsTrajet.vue';
    import HistoryTrajets from '@/components/profile/HistoryTrajets.vue';
    import BottomNav from '@/components/menus/BottomNav.vue';
    import BottomMenu from '@/components/menus/BottomMenu.vue';    

    export default defineComponent({
        name: 'profil-view',
        computed: {
            ...mapState("profil", ["darkMode", "userName", "profil", "history"]),
            ...mapActions("profil", ["getTravels", "getPublish", "buildHistoriqueBooking"]),
            ...mapActions("auth", ["checkSession"]),
        },
        components: {
            ToolbarProfil,
            Avatar,
            PanneauInfo,
            GroupCard,
            CreditCard,
            StatsTrajet,
            HistoryTrajets,
            BottomNav,
            BottomMenu,
        },
        data() {
            return {
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
                        btn:false,
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
            }
        },
        beforeMount(){
            this.checkSessionIn();
        },
        mounted(){
                
        },
        methods: {
            ...mapMutations("profil", ["SET_LOAD_GET_TRIP_PUBLISH"]),
            async checkSessionIn(){
                const sessionValided = await this.$store.dispatch("auth/checkSession");
                if( ! sessionValided )
                    this.$router.replace("/");
            },
            goToInfoPerso(){
                this.$router.push("/profil/perso")
            },
            onHistory(){
                this.modeBottomMenu = "history"
                if ( this.$refs.BottomMenuRefHistory ) {
                    if( ! this.overlay ){
                        this.overlay = this.$refs.BottomMenuRefHistory.open();
                        if(this.overlay && ( history.historycalBooking == undefined || Object.keys(history.historycalBooking).length == 0 ) ){
                            this.buildHistoriqueBooking;
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
            recharger(){
                console.log("recharger");
                this.modeBottomMenu = "recharge-valided";
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
                    this.indexModeNavigation = -1;
                    this.modePathNavigation = "";
                }
            },
            async onglet(){
                this.SET_LOAD_GET_TRIP_PUBLISH(true);
                this.infosTravels = [];
                if( this.onglet == "trajets" && this.profil.myTravels.length == 0){
                    await this.getTravels;
                    this.infosTravels = this.profil.myTravels;
                }
                else if( this.onglet == "planning" && this.profil.myPublish.length == 0 ){
                    await this.getPublish;
                    this.infosTravels = this.profil.myPublish;
                }
                else{
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
        }
    });
</script>
