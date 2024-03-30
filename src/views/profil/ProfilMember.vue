<!-- scss -->
<style lang="scss" scoped>
    .main {
        &.profil-member{
            overflow: auto;
        }
        height: 100%;
        margin-bottom: 13px;
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

    <ToolbarProfil ref="ToolbarRef" :setting="false" :title="'Profil'" v-on:back="back()"/>
    <v-main class="main profil-member">
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
    import { defineComponent } from 'vue';
    import { mapState } from 'vuex';

    import { formatNumber } from '@/utils/utils.js'

    // Components
    import ToolbarProfil from '@/components/menus/head/ToolbarProfil.vue';
    import Avatar from '@/components/profile/Avatar.vue';
    import PanneauInfo from '@/components/profile/PanneauInfo.vue';
    import GroupCard from '@/components/menus/setting/GroupCard.vue';

    export default defineComponent({
        name: 'profil-member-view',
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
            ToolbarProfil,
            Avatar,
            PanneauInfo,
            GroupCard,
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
                    },
                    {
                        label: "préferences de voyage",
                        parameters: [
                            {
                                about: "discution",
                                prependIconColor: "var(--blue-color)",
                                prependIcon:"mdi-forum",
                                text:"j'aime bien discuter",
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
            this.$refs.ToolbarRef.needToComeBack = true;
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
