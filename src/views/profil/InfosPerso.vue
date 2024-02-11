<!-- scss -->
<style lang="scss" scoped>
    .main {
        margin-bottom: 13px;
    }

    .grouP {
        margin-top: 50px;
    }
</style>
   
<!--  -->
<template>
    <v-overlay v-model="overlay" contained persistent style="z-index: 10;" @click="overlay = false"></v-overlay>

    <ToolbarProfil :title="'Informations personnelles'" v-on:back="back()" />
    <v-main class="main info-perso profil">

        <!-- Avatar -->
        <Avatar :name="userName" :avatar="avatarUrl" :sub-title="profil.infos_perso.adress.commune" />

        <!-- ? -->
        <PanneauInfo v-if="modeDriver" :infos_panneau="infos_panneau" />

        <!-- Preference et autres -->
        <GroupCard class="grouP" :groupeParameters="groupeParameters" />

        <!-- Car model -->
        <BottomMenu 
            ref="BottomMenuRefModelVehicul" 
            :class-name="['model-vehicul']" 
            mode="select-model-vehicul"
            v-on:close="overlay = false" 
        />

        <!-- Select Preference -->
        <BottomMenu 
            ref="BottomMenuRefPreference" 
            :class-name="['preference-choice']" 
            :about="about"
            mode="preference-choice" 
            v-on:close="overlay = false" 
        />

    </v-main>

    <PaneApear ref="PaneApearIdentityRef" mode="identity"/>
    <!-- <BottomNav /> -->
</template>



<!--  -->
<script>
    import { defineComponent } from 'vue';
    import { mapState, mapActions } from 'vuex';


    import { formatNumber } from '@/utils/utils.js'

    // Components
    import ToolbarProfil from '@/components/menus/head/ToolbarProfil.vue';
    import Avatar from '@/components/profile/Avatar.vue';
    import PanneauInfo from '@/components/profile/PanneauInfo.vue';
    import GroupCard from '@/components/menus/setting/GroupCard.vue';
    import PaneApear from '@/components/PaneApear.vue';
    import BottomMenu from '@/components/menus/BottomMenu.vue';

    export default defineComponent({
        name: 'infos-profil-view',
        computed: {
            ...mapState("profil", ["profil", "userName", "modeDriver", "avatarUrl", "auto_accept_trip", "cars", "payouts_enabled", "identity"]),
            ...mapState("profil", {
                preferences: state => state.profil.infos_perso.preferences,
                nbTrip: state => state.profil.nbTrip,
            }),
        },
        components: {
            ToolbarProfil,
            Avatar,
            PanneauInfo,
            GroupCard,
            PaneApear,
            BottomMenu,
        },
        props: {
        },
        data() {
            return {
                overlay: false,
                about: "discution",
                modeBottomMenu: "select-model-vehicul",
                infos_panneau: [
                    {
                        btn: false,
                        label: "0",
                        text: "TRAJETS",
                    },
                    {
                        btn: false,
                        label: "0/5",
                        text: "avis",
                    },
                    {
                        btn: false,
                        label: "0%",
                        text: "satisfaction",
                    },
                ],
                groupeParameters: [
                    {
                        label: "profil vérifié",
                        parameters: [
                            {
                                prependIconColor: "var(--blue-color)",
                                prependIcon: "mdi-fingerprint",
                                text: "Identité & coordonnées",
                                chip: true,
                                chipIcon: null,
                                chipText: "1/3",
                                fun: () => { this.$refs.PaneApearIdentityRef.open() },
                            },
                        ],
                        disable: false,
                    },
                    {
                        label: "véhicule",
                        parameters: [
                            {
                                prependIconColor: "gray",
                                prependIcon: "mdi-car-off",
                                text: "AUCUN VEHICULE",
                                chip: true,
                                chipIcon: null,
                                classConfig: ["chip-rounded"],
                                switchBtn: false,
                                chipText: "",
                                optionChip: {
                                    color: "var(--bg-app-color)",
                                },
                                fun: () => { this.modeBottomMenu = 'select-model-vehicul'; this.overlay = this.$refs.BottomMenuRefModelVehicul.open(); },
                            },
                        ],
                        fun: this.selectModel,
                        disable: false,
                    },
                    {
                        label: "préferences de voyage",
                        parameters: [
                            {
                                prependIconColor: "#bc62ff",
                                prependIcon: "mdi-auto-fix",
                                text: "validation automatique",
                                chip: false,
                                chipIcon: null,
                                switchBtn: true,
                                chipText: "",
                                value: this.auto_accept_trip,
                            },
                            {
                                about: "discution",
                                prependIconColor: "var(--blue-color)",
                                prependIcon: "mdi-forum",
                                text: "j'aime bien discuter--",
                                chip: false,
                                chipIcon: null,
                                switchBtn: false,
                                chipText: "",
                            },
                            {
                                about: "smoke",
                                prependIconColor: "#ff5353",
                                prependIcon: "mdi-smoking-off",
                                text: "Pas de cigarette en voiture",
                                chip: false,
                                chipIcon: null,
                                chipText: "",

                            },
                            {
                                about: "music",
                                prependIconColor: "#9fcb66",
                                prependIcon: "mdi-music",
                                text: "Music tout au long !",
                                chip: false,
                                chipIcon: null,
                                chipText: "",

                            },
                            {
                                about: "animal",
                                prependIconColor: "#ff9c00",
                                prependIcon: "mdi-paw",
                                text: "J'aime bien les animaux",
                                chip: false,
                                chipIcon: null,
                                chipText: "",
                            },
                        ],
                    },
                ],
                infosModelVehicul: [
                    { model: "Moto", color: "silver", icon: "mdi-motorbike", maxSeats: 1 },
                    { model: "Compact", color: "white", icon: "mdi-car-hatchback", maxSeats: 4 },
                    { model: "Berline", color: "red", icon: "mdi-car-sports", maxSeats: 4 },
                    { model: "SUV", color: "navy", icon: "mdi-car-estate", maxSeats: 8 },
                    { model: "Monospace", color: "gray", icon: "mdi-car-estate", maxSeats: 8 },
                ],
            }
        },
        mounted() {
            // console.log("action", this.action, this.$route.params);
            if( this.$route.params.action == 'open-add-vehicle' ){
                if ( this.$refs.BottomMenuRefModelVehicul ) {
                    this.overlay = this.$refs.BottomMenuRefModelVehicul.open();
                }
            }
            else if( this.$route.params.action == 'open-check-identiy' ){
                if( this.$refs.PaneApearIdentityRef ){
                    this.$refs.PaneApearIdentityRef.open();
                }
            }
            //this.$refs.BottomMenuRefPreference.open();
            this.updateGrouparameterPreference();
            this.switchModeDriverGroupParameters();
            this.updateCar();

            this.getNotation();

            if(this.payouts_enabled || this.identity)
                this.groupeParameters[0].parameters[0].chipText = "2/3";
            if(this.payouts_enabled && this.identity)
                this.groupeParameters[0].parameters[0].chipText = "3/3";
        },
        methods: {
            ...mapActions("profil", ["updateAutoValidation", "getCars", "getNotation"]),
            updateAutoValidation() {
                console.log("updateAutoValidation:");
                this.updateAutoValidation();
            },
            selectModel() {
                if (this.$refs.BottomMenuRefModelVehicul) {
                    this.overlay = this.$refs.BottomMenuRefModelVehicul.open();
                }
            },
            selectPreference(about) {
                this.about = about;
                if (this.$refs.BottomMenuRefPreference) {
                    this.overlay = this.$refs.BottomMenuRefPreference.open();
                }
            },
            updateGrouparameterPreference() {

                let parameters = this.groupeParameters[2].parameters.map(
                    (pref) => {
                        if ('about' in pref) {
                            console.log(this.preferences, this.preferences.filter((prefs) => prefs.about == pref.about)[0], pref);
                            //Assigne methode select
                            this.preferences.filter((prefs) => prefs.about == pref.about)[0].fun = () => this.selectPreference(pref.about);
                            return this.preferences.filter((prefs) => prefs.about == pref.about)[0];
                        }
                        return pref;
                    }
                )

                this.groupeParameters[2].parameters = parameters;
            },
            async updateCar() {
                if (this.modeDriver) {
                    const result = await this.getCars();
                    if ( result.status == 0 && this.cars.length > 0 ) {
                        this.groupeParameters[1].parameters[0].text = this.cars[0].brand != "UNKNOWN" ? this.cars[0].brand : this.cars[0].license_plate;
                        this.groupeParameters[1].parameters[0].optionChip.color = this.cars[0].color;
                        this.groupeParameters[1].parameters[0].prependIcon = this.infosModelVehicul.find((car) => car.model == this.cars[0].model).icon
                    }
                }
            },
            switchModeDriverGroupParameters() {
                //show only necessary
                if (this.modeDriver) {
                    this.groupeParameters[0].disable = false;
                    this.groupeParameters[1].disable = false;
                    this.groupeParameters[2].parameters[0].none = true;
                }
                else {
                    this.groupeParameters[0].disable = true;
                    this.groupeParameters[1].disable = true;
                    this.groupeParameters[2].parameters[0].none = false;
                }
            },
            back() {
                this.$router.push("/profil")
            },
        },
        watch: {
            overlay() {
                if (!this.overlay) {
                    if (this.$refs.BottomMenuRefModelVehicul) {
                        this.$refs.BottomMenuRefModelVehicul.close();
                    }

                    if (this.$refs.BottomMenuRefPreference) {
                        this.$refs.BottomMenuRefPreference.close();
                        this.updateGrouparameterPreference();
                    }
                }
            },
            preferences() {
                console.log("pref modifierd");
                this.updateGrouparameterPreference();
            },
            modeDriver() {
                this.switchModeDriverGroupParameters();
            },
            nbTrip(){
                this.infos_panneau[0].label = formatNumber(this.nbTrip);
            }
        }
    });
</script>
