

<!-- scss -->
<style lang="scss" model>

    .bottom-menu{
        z-index: 9999 !important;
    }

    .invisible {
        visibility: hidden;
    }

    .mask-container {
        position: absolute;
        top: 0;
        width: 100vw;
        height: 100vh;
        background-color: var(--bg-app-color);
        // clip-path: circle(0% at 75.5% 35%); /* Masque initialement fermé */
        clip-path: circle(0% at 317.855px 322.35px);
        transition: clip-path 0.7s ease-in-out;
        .content {
            background-color: #1a1a1a;
        }
    }

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
                background-color: var(--bg-color);
                color: var(--font-color-label);
                @include mixins.respond-to('small') {
                    width: 40%;
                }
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

    <!-- ligth-theme -->
    <!-- <div class="ligth-mode"> -->
        <CompProfil 
            v-on:on-add-card="onAddCard()"
            v-on:on-drop-money="onDropMoney()"
            v-on:on-up-money="onUpMoney()"
            v-on:open-member="$refs.PaneApearProfilMemberRef.open()"
            v-on:transfert-gain-to-soldes="transferGainToSoldes()"
            v-on:open-contacts="$refs.PaneApearRef.open();"
            v-on:on-history="onHistory()"
        />
    <!-- </div> -->
    

    <!-- dark-theme -->
    <!-- <div 
        class="mask-container"
        ref="maskContainer"
    >
        <div class="content dark-mode">
            <CompProfil
                v-on:icon-coordinates="adjustClipPathV2"
                v-on:on-add-card="onAddCard()"
                v-on:on-drop-money="onDropMoney()"
                v-on:on-up-money="onUpMoney()"
                v-on:open-member="$refs.PaneApearProfilMemberRef.open()"
                v-on:transfert-gain-to-soldes="transferGainToSoldes()"
                v-on:open-contacts="$refs.PaneApearRef.open();"
                v-on:on-history="onHistory()"
                v-on:toggle-mask="toggleMask()"
            />
        </div>
    </div> -->

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

    <PaneApear ref="PaneApearRef" :class-name="['pan-apear-contact']" mode="contacts"/>

    <PaneApear 
        ref="PaneApearProfilMemberRef"
        :class-name="['pan-apear-profil-member']" 
        mode="profil-member"
    />

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
        :params-number="{min:1, max: Math.ceil(Math.floor(pending))}"
        :upMoneyObj="{btn: 'Transferer'}"
        v-on:close="overlay = false"
        v-on:up-money="overlay = false; $refs.BottomMenuRefMoneyDriver.close()"
        />

</template>



<!--  -->
<script>
    import { defineComponent } from 'vue';
    import { mapState, mapActions, mapMutations } from 'vuex';
    import axios from 'axios';
    // import { SafeArea } from '@aashu-dubey/capacitor-statusbar-safe-area';
    import { Capacitor } from '@capacitor/core';

    const isAndroid = Capacitor.getPlatform() === 'android';
    const isIOS = Capacitor.getPlatform() === 'ios';


    import $ from 'jquery';

    // Components
    import ToolbarProfil from '@/components/menus/head/ToolbarProfil.vue';
    import CompProfil from '@/components/profile/CompProfil.vue';
    import BottomMenu from '@/components/menus/BottomMenu.vue';
    import PaneApear from '@/components/PaneApear.vue';

    export default defineComponent({
        name: 'profil-view',
        computed: {
            ...mapState("profil", ["darkMode", "userName", "profil", "history", 'modeDriver', "avatarUrl", "userUid", "modeCo", "gain", "identity"]),
            ...mapState("profil", {
                pending: state => state.gain.pending,
                transit: state => state.gain.transit,
            }),
            ...mapState("trip", ["notMessageVue"]),
        },
        components: {
            ToolbarProfil,
            CompProfil,
            BottomMenu,
            PaneApear,
        },
        data() {
            return {
                anime: false,
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
                insets: { top: 0, bottom: 0, left: 0, right: 0 },
            }
        },
        beforeMount(){
            this.checkSessionIn();
            window.removeEventListener('resize', this.adjustClipPath);
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

            console.log("this.darkMode", this.darkMode);
            // if(this.darkMode){
            //     console.log("tootlemasl");
            //     this.toggleMask();
            // }

            //this.adjustClipPath();
            // window.addEventListener('resize', this.adjustClipPath);

            // Pour ajuster lorsque SafeArea change
            // SafeArea.getSafeAreaInsets().then(insets => {
            //     this.insets = insets;
            //     this.adjustClipPath();
            // });

            // this.$refs.PaneApearProfilMemberRef.open()
            // this.$refs.PaneApearRef.open()
        },
        methods: {
            ...mapActions("profil", ["getTravels", "getPublish", "buildHistoriqueBooking"]),
            ...mapActions("auth", ["checkSession"]),
            ...mapMutations("profil", ["SET_LOAD_GET_TRIP_PUBLISH", "SET_MODE_DRIVER", "SET_REMOVE_HISTORY_DATES", "SET_NB_PASSAGER"]),
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
                if( this.gain.pending < 1 ){
                    this.messageSnackbarError = "Désolé, vous n'avez pas de gain en attente suffisant."
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
            toggleMask() {
                if(!this.anime && 2!=2){
                    this.anime = true;
                    // $('.mask-container').each(function() {
                    //     var $this = $(this);
                    //     var isOpen = $this.css('clip-path').includes('120%');
                    //     $this.css('clip-path', isOpen ? 'circle(0% at 75.5% 35%)' : 'circle(120% at 75.5% 35%)');
                    // });
                    const maskContainer = this.$refs.maskContainer;
                    const insets = this.insets;

                    console.log("adjustClipPath toogle:", this.insets, JSON.stringify(this.insets));

                    // Calculer les nouvelles valeurs de clip-path
                    const maskWidth = window.innerWidth - insets.left - insets.right;
                    // const maskHeight = window.innerHeight;

                    // Calculer les positions en fonction des nouvelles dimensions
                    const xPos = (75.5 / 100) * maskWidth + insets.left;
                    // const yPos = (35 / 100) * maskHeight + insets.top;

                    // const xPos = 317.855 + insets.left;
                    const yPos = 322.35 + insets.top + ( isAndroid || isIOS ? 40 : 0 );

                    console.log("xPos:", xPos, "yPos:", yPos);

                    // Appliquer le nouveau clip-path
                    // var $this = $('.mask-container');
                    // var isOpen = $this.css('clip-path').includes('120%');
                    //$this.css('clip-path', isOpen ? 'circle(0% at 75.5% 35%)' : 'circle(120% at 75.5% 35%)');
                    maskContainer.style.clipPath = this.darkMode ? `circle(0% at ${xPos}px ${yPos}px)` : `circle(120% at ${xPos}px ${yPos}px)`;
                    
                    setTimeout(function(){
                        this.anime = false;
                    }.bind(this), 700)
                    //this.adjustClipPath();
                }
            },
            adjustClipPathV2(coordinates) {
                console.log("adjustClipPathV2======", coordinates);
                if (!coordinates || 2==2) return;

                this.buttonCoordinates = coordinates;
                const maskContainer = this.$refs.maskContainer;

                const { top, bottom, left, right } = this.insets;

                console.log(bottom, right);

                // Calculer les nouvelles valeurs de clip-path
                const xPos = coordinates.x + left;
                const yPos = coordinates.y + top;

                // Appliquer le nouveau clip-path
                maskContainer.style.clipPath = `circle(0% at ${xPos}px ${yPos}px)`;
            },
            adjustClipPath() {
                if(!this.anime){
                    this.anime = true;
                    const maskContainer = this.$refs.maskContainer;
                    const insets = this.insets;

                    console.log("adjustClipPath v1:", this.insets, JSON.stringify(this.insets));

                    // Calculer les nouvelles valeurs de clip-path
                    const maskWidth = window.innerWidth - insets.left - insets.right;
                    // const maskHeight = window.innerHeight;

                    // Calculer les positions en fonction des nouvelles dimensions
                    // 317.855px 322.35px
                    const xPos = (75.5 / 100) * maskWidth + insets.left;
                    // const yPos = (35 / 100) * maskHeight + insets.top;

                    // const xPos = 317.855 + insets.left;
                    //const yPos = 322.35  + insets.top;
                    const yPos = 322.35 + insets.top + ( isAndroid || isIOS ? 40 : 0 );
                    console.log("xPos:", xPos, "yPos:", yPos);

                    // Appliquer le nouveau clip-path
                    var $this = $('.mask-container');
                    var isOpen = $this.css('clip-path').includes('120%');
                    //$this.css('clip-path', isOpen ? 'circle(0% at 75.5% 35%)' : 'circle(120% at 75.5% 35%)');
                    maskContainer.style.clipPath = !isOpen ? `circle(0% at ${xPos}px ${yPos}px)` : `circle(120% at ${xPos}px ${yPos}px)`;

                    setTimeout(function(){
                        this.anime = false;
                    }.bind(this), 700)
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
                this.updateTripInfos();
            },
            modeDriver(){
                this.switchModeDriverPanneauInfos();
            },
            
        }
    });
</script>
