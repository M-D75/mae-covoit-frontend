<!-- scss -->
<style lang="scss" scoped>
    .v-toolbar {
        z-index: 27;
        background-color: var(--bg-app-color);
        color: var(--font-color-label);
        border-bottom: 1px solid #4d4d4d45;
        .v-toolbar-title{
            color: var(--font-color-label);
        }
    }

    .main {
        z-index: 26;
        height: 100%;
        margin-bottom: 13px;
        overflow: scroll;
        // top: 0;
        // position: absolute;
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

    <v-toolbar >
        <v-btn 
            variant="text" 
            icon="mdi-chevron-left"
            @click="$emit('go-back')"    
        ></v-btn>

        <v-toolbar-title>Profil</v-toolbar-title>
        <v-spacer></v-spacer>
    </v-toolbar>

    <v-main class="main">
        <!-- Avatar -->
        <Avatar :avatar="avatar" :modeEdit="false" :name="userName" :subTitle="location"/>

        <!-- ? -->
        <PanneauInfo :infos_panneau="infos_panneau"/>

        <!--  -->
        <GroupCard class="grouP" :groupeParameters="groupeParameters" />

    </v-main>
</template>



<!--  -->
<script>
    import $ from 'jquery';
    import { defineComponent } from 'vue';
    import { mapState } from 'vuex';

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
                overlay: false,
                about: "discution",
                modeBottomMenu: "select-model-car",
                infos_panneau: [
                    {
                        btn:false,
                        label: "expert",
                        text:"trajets",
                    },
                    {
                        btn:false,
                        label:"0/5",
                        text:"avis",
                    },
                    {
                        btn:false,
                        label:"0%",
                        text:"satisfaction",
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
            if(this.toolbarDouble)
                $(".main").css({position: "absolute", top: "0px"})
            //this.$refs.BottomMenuRefPreference.open();
            this.updateGrouparameterPreference();
            // this.$refs.ToolbarRef.needToComeBack = true;
        },
        methods: {
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
                if(this.preferences[0] != undefined){
                    this.groupeParameters[1].parameters = this.groupeParameters[1].parameters.map(
                        (pref) => { 
                            if('about' in pref){
                                // Assigne methode select
                                this.preferences.filter((prefs) => prefs && prefs["about"] != undefined && prefs.about == pref.about)[0].fun = () => this.selectPreference(pref.about);
                                return this.preferences.filter((prefs) => prefs && prefs["about"] != undefined && prefs.about == pref.about)[0];
                            }
                            return pref;
                        }
                    )
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
            nbTrip(){
                this.infos_panneau[0].label = formatNumber(this.nbTrip);
            }
        }
    });
</script>
