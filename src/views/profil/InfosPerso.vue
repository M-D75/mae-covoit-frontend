<!-- scss -->
<style lang="scss" scoped>
    .main {
        height: 100%;
        margin-bottom: 13px;
    }

    .grouP {
        margin-top: 50px;
    }


</style>
   
<!--  -->
<template>
    <v-overlay 
        v-model="overlay" 
        contained
        persistent
        style="z-index: 10;"
        @click="overlay = false"
    ></v-overlay>

    <ToolbarProfil :title="'Information personnelles'" v-on:back="back()"/>
    <v-main class="main">
        <!-- Avatar -->
        <Avatar :name="userName" :avatar="avatarUrl" :sub-title="profil.infos_perso.adress.commune"/>

        <!-- ? -->
        <PanneauInfo v-if="modeDriver" :infos_panneau="infos_panneau"/>

        <!--  -->
        <GroupCard class="grouP" :groupeParameters="groupeParameters" />

        <!-- Credit Card -->

        <!-- Car model -->
        <BottomMenu
            ref="BottomMenuRef"
            :class-name="['select-model-vehicul']"
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

        <!--  -->
    </v-main>
    <BottomNav />

    
</template>



<!--  -->
<script>
    import { defineComponent } from 'vue';
    import { mapState, mapActions } from 'vuex';

    // Components
    import ToolbarProfil from '@/components/menus/head/ToolbarProfil.vue';
    import Avatar from '@/components/profile/Avatar.vue';
    import PanneauInfo from '@/components/profile/PanneauInfo.vue';
    import GroupCard from '@/components/menus/setting/GroupCard.vue';
    import BottomNav from '@/components/menus/BottomNav.vue';
    import BottomMenu from '@/components/menus/BottomMenu.vue';

    export default defineComponent({
        name: 'infos-profil-view',
        computed: {
            ...mapState("profil", ["profil", "userName", "modeDriver", "avatarUrl", "auto_accept_trip"]),
            ...mapState("profil", {
                preferences: state => state.profil.infos_perso.preferences,
            }),
        },
        components: {
            ToolbarProfil,
            Avatar,
            PanneauInfo,
            GroupCard,
            BottomNav,
            BottomMenu,
        },
        data() {
            return {
                overlay: false,
                about: "discution",
                modeBottomMenu: "select-model-vehicul",
                infos_panneau: [
                    {
                        btn:false,
                        label: "expert",
                        text:"niveau",
                    },
                    {
                        btn:false,
                        label:"4/5",
                        text:"avis",
                    },
                    {
                        btn:false,
                        label:"bonne",
                        text:"conduite",
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
                        disable: false,
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
                                classConfig: ["chip-rounded"],
                                switchBtn: false,
                                chipText: "",
                                fun: () => {this.modeBottomMenu='select-model-vehicul'; this.overlay = this.$refs.BottomMenuRef.open();},
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
                                prependIcon:"mdi-auto-fix",
                                text:"validation automatique",
                                chip:false,
                                chipIcon: null,
                                switchBtn: true,
                                chipText: "",
                                value: this.auto_accept_trip,
                            },
                            {
                                about: "discution",
                                prependIconColor: "var(--blue-color)",
                                prependIcon:"mdi-forum",
                                text:"j'aime bien discuter--",
                                chip:false,
                                chipIcon: null,
                                switchBtn: false,
                                chipText: "",
                            },
                            {
                                about: "smoke",
                                prependIconColor: "#ff5353",
                                prependIcon:"mdi-smoking-off",
                                text:"Pas de cigarette en voiture",
                                chip:false,
                                chipIcon: null,
                                chipText: "",

                            },
                            {
                                about: "music",
                                prependIconColor: "#9fcb66",
                                prependIcon:"mdi-music",
                                text:"Music tout au long !",
                                chip:false,
                                chipIcon: null,
                                chipText: "",

                            },
                            {
                                about: "animal",
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
        mounted() {
            //this.$refs.BottomMenuRefPreference.open();
            this.updateGrouparameterPreference();
            this.switchModeDriverGroupParameters();
        },
        methods: {
            ...mapActions("profil", ["updateAutoValidation"]),
            updateAutoValidation(){
                console.log("updateAutoValidation==");
                this.updateAutoValidation();
            },
            selectModel(){
                if( this.$refs.BottomMenuRef ){
                    this.overlay = this.$refs.BottomMenuRef.open();
                }
            },
            selectPreference(about){
                this.about = about;
                if(this.$refs.BottomMenuRefPreference){
                    this.overlay = this.$refs.BottomMenuRefPreference.open();
                }
            },
            updateGrouparameterPreference(){
                
                let parameters = this.groupeParameters[2].parameters.map(
                    (pref) => { 
                        if('about' in pref){
                            console.log(this.preferences, this.preferences.filter((prefs) => prefs.about == pref.about)[0], pref);
                            this.preferences.filter((prefs) => prefs.about == pref.about)[0].fun = () => this.selectPreference(pref.about);
                            return this.preferences.filter((prefs) => prefs.about == pref.about)[0];
                        }
                        return pref;
                    }
                )

                this.groupeParameters[2].parameters = parameters;
            },
            switchModeDriverGroupParameters(){
                if( this.modeDriver ){
                    this.groupeParameters[0].disable = false;
                    this.groupeParameters[1].disable = false;
                    this.groupeParameters[2].parameters[0].none = true;
                }
                else{
                    this.groupeParameters[0].disable = true;
                    this.groupeParameters[1].disable = true;
                    this.groupeParameters[2].parameters[0].none = false;
                }
            },
            back(){
                this.$router.push("/profil")
            },
        },
        watch: {
            overlay(){
                if( ! this.overlay ){
                    if ( this.$refs.BottomMenuRef ) {
                        this.$refs.BottomMenuRef.close();
                    }

                    if(this.$refs.BottomMenuRefPreference){
                        this.$refs.BottomMenuRefPreference.close();
                        this.updateGrouparameterPreference();
                    }
                }
            },
            preferences(){
                console.log("pref modifierd");
                this.updateGrouparameterPreference();
            },
            modeDriver(){
                this.switchModeDriverGroupParameters();
            },
        }
    });
</script>
