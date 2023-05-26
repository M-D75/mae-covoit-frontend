

<!-- scss -->
<style lang="scss" model>
    .bottom-menu{
        z-index: 9999 !important;
    }
</style>

<style lang="scss" scoped>
    .ligth-mode * {
        --bg-color: #E5E5E5;
    }
    .dark-mode * {
        --bg-color: #333333;
    }

    .main {
        height: 100%;
        margin-top: 100px;
        margin-bottom: 50px;
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
            margin-top: 30px;
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
                    background-color: #1E90FF;
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

        div {
            
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
    <div class="main">
        <!-- Avatar -->
        <Avatar 
            :modeEdit="false" 
            :name="'Dr. Strange'"
            @click="goToInfoPerso()"
            />

        <!-- ? -->
        <PanneauInfo :infos_panneau="infos_panneau" v-on:history="history()" />

        <!-- Parameter like menu TODO:no activate -->
        <GroupCard class="grouP" :groupeParameters="groupeParameters" v-if="false"/>

        <div>
            <!-- <div class="label mx-auto">tableau de board</div> -->
            <div class="label-btn mx-auto">
                <v-btn :class="{active: onglet=='table-bord'}" @click="onglet='table-bord'" rounded="xl">tableau de board</v-btn>
                <v-btn :class="{active: onglet=='planning'}" class="calendar" @click="onglet='planning'" rounded="xl"><v-icon>mdi-calendar-month</v-icon></v-btn>
                <v-btn :class="{active: onglet=='trajets'}" @click="onglet='trajets'" rounded="xl">mes trajets</v-btn>
            </div>

            <!-- Tableau de bord -->
            <!-- Credit Card -->
            <CreditCard v-if="onglet=='table-bord'"/>

            <!-- Graph -->
            <StatsTrajet v-if="onglet=='table-bord'"/>

            <!-- Trajets -->
            <HistoryTrajets v-if="onglet=='trajets' || onglet=='planning'"/>
        </div>
    </div>
    
    <BottomNav />

    <v-overlay 
        v-model="overlay" 
        contained
        persistent
        style="z-index: 0;"
        @click="callCloseBottomChild"
    ></v-overlay>
    <BottomMenu ref="BottomMenuRef" v-on:close="overlay = false"/>
</template>



<!--  -->
<script>
    import { defineComponent } from 'vue';
    import { mapState } from 'vuex';

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
            ...mapState(["darkMode"]),
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
                        icon: ! this.$store.state.darkMode ? "mdi-lightbulb-on" : "mdi-moon-waning-crescent",
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
            }
        },
        methods: {
            goToInfoPerso(){
                this.$router.push("/profil/perso")
            },
            history(){
                console.log("history");

                if ( this.$refs.BottomMenuRef ) {
                    if( ! this.overlay ){
                        this.overlay = this.$refs.BottomMenuRef.open();
                    }
                    else {
                        this.overlay = this.$refs.BottomMenuRef.close();
                    }
                }

            },
            callCloseBottomChild() {
                if ( this.$refs.BottomMenuRef ) {
                    this.overlay = this.$refs.BottomMenuRef.close();
                }
            },
        },
        watch: {
            darkMode(){
                this.infos_panneau[2].icon = ! this.$store.state.darkMode ? "mdi-lightbulb-on" : "mdi-moon-waning-crescent";
            }
        }
    });
</script>
