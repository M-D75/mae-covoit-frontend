<!-- scss -->
<style lang="scss" model>
    
</style>

<style lang="scss" scoped>
    // toolbar        
    .v-toolbar {
        box-shadow: var(--box-shadow-card);
        z-index: 27;
        background-color: var(--bg-app-color);
        box-shadow: var(--box-shadow-card);

        // natif
        // padding-top: var(--safe-area-inset-top);
        // margin-top: var(--safe-area-inset-top);
        .v-btn {
            color: var(--gray-icon-color);
            i.v-icon {
                margin-right: 0 !important;
                color: var(--gray-icon-color);
            }
        }
        .v-toolbar-title {
            font-size: var(--font-size-h1-toolbar);
            color: var(--font-color-label);
        }
        
        .label-filter.text-caption {
            width: 85%;
        }
    }

    .main.profil-member {
        z-index: 26;
        height: 100%;
        margin-bottom: 13px;
        overflow: scroll;
        padding-top: 0 !important;
        // top: 0;
        // position: absolute;
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

    <v-toolbar class="profil-member-comp">
        <v-btn 
            variant="text" 
            icon="mdi-chevron-left"
            @click="$emit('go-back')"    
        ></v-btn>

        <v-toolbar-title>Profil</v-toolbar-title>
        <v-spacer></v-spacer>
    </v-toolbar>

    <v-main class="main profil-member">
        <!-- Avatar -->
        <Avatar :avatar="avatar" :modeEdit="false" :name="userName" :subTitle="location" :identity="identity"/>

        <!-- ? -->
        <PanneauInfo :infos_panneau="infos_panneau"/>

        <!--  -->
        <GroupCard class="grouP" :groupeParameters="groupeParameters" />

    </v-main>
</template>



<!--  -->
<script>
    //import $ from 'jquery';
    import { defineComponent } from 'vue';
    import { mapState } from 'vuex';
    import { SafeAreaController, SafeArea } from '@aashu-dubey/capacitor-statusbar-safe-area';

    import { formatNumber } from '@/utils/utils.js'

    // Components
    import Avatar from '@/components/profile/Avatar.vue';
    import PanneauInfo from '@/components/profile/PanneauInfo.vue';
    import GroupCard from '@/components/menus/setting/GroupCard.vue';

    export default defineComponent({
        name: 'profil-member-comp',
        emits: ["go-back"],
        computed: {
            ...mapState("trip", {
                avatar: state => state.member.avatar,
                userName: state => state.member.userName,
                location: state => state.member.location,
                identity: state => state.member.identity,
                payouts_enabled: state => state.member.payouts_enabled,
                // notation
                nbTrip: state => state.member.notation.nbTrip,
                avis: state => state.member.notation.avis,
                satisfaction: state => state.member.notation.satisfaction,
                
            }),
            ...mapState("trip", {
                preferences: state => state.member.preferences,
            }),
        },
        components: {
            Avatar,
            PanneauInfo,
            GroupCard,
        },
        props: {
            toolbarDouble: {
                type: Boolean,
                default: false,
            },
        },
        data() {
            return {
                barHeight: 0,
                overlay: false,
                about: "discution",
                modeBottomMenu: "select-model-car",
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
                                prependIcon:"mdi-fingerprint",
                                text:"Identité & coordonnées",
                                chip:true,
                                chipIcon: null,
                                chipText: "1/3",
                            },
                        ],
                    },
                    {
                        label: "préferences de voyage",
                        parameters: [
                            {
                                about: "discution",
                            },
                            {
                                about: "smoke",
                            },
                            {
                                about: "music",
                            },
                            {
                                about: "animal",
                            },
                        ],
                    },
                ],
            }
        },
        mounted() {
            // if(this.toolbarDouble){
            //     $(".main").css({position: "absolute", top: "0px"});
            //     $(".v-app-bar.profil-member-comp").css({position: "absolute", top: "0px"});
            // }

            SafeAreaController.injectCSSVariables();

            this.initStatusBarHeight();

            this.updateGrouparameterPreference();
            this.infos_panneau[0].label = formatNumber(this.nbTrip);

            console.log("pa:", this.payouts_enabled, this.identity);

            if(this.payouts_enabled || this.identity)
                this.groupeParameters[0].parameters[0].chipText = "2/3";
            if(this.payouts_enabled && this.identity)
                this.groupeParameters[0].parameters[0].chipText = "3/3";
        },
        methods: {
            updateGrouparameterPreference(){
                if(this.preferences[0] != undefined){
                    this.groupeParameters[1].parameters = this.groupeParameters[1].parameters.map(
                        (pref) => { 
                            if('about' in pref){
                                // Assigne methode select
                                let current_pref = this.preferences.find((prefs) => prefs && prefs["about"] != undefined && prefs.about == pref.about);
                                if(current_pref){
                                    return current_pref;
                                }
                            }
                            return pref;
                        }
                    )
                }
            },
            async initStatusBarHeight(){
                const insets = await this.getSafeAreaInsets();
                this.barHeight = insets["top"];
                console.log("barHeight:", this.barHeight);
            },
            async getSafeAreaInsets () {
                const insets = await SafeArea.getSafeAreaInsets();
                return insets; // Ex. { "bottom":34, "top":47, "right":0, "left":0 }
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
                console.log("pref-modified");
                this.updateGrouparameterPreference();
            },
            nbTrip(){
                console.log("nbTrip-modified");
                this.infos_panneau[0].label = formatNumber(this.nbTrip);
            },
            payouts_enabled(){
                if(this.payouts_enabled || this.identity)
                    this.groupeParameters[0].parameters[0].chipText = "2/3";
                if(this.payouts_enabled && this.identity)
                    this.groupeParameters[0].parameters[0].chipText = "3/3";
            },
            identity(){
                if(this.payouts_enabled || this.identity)
                    this.groupeParameters[0].parameters[0].chipText = "2/3";
                if(this.payouts_enabled && this.identity)
                    this.groupeParameters[0].parameters[0].chipText = "3/3";
            }
        }
    });
</script>
