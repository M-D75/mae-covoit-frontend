<style lang="scss" model>

    .grouPreference {
        margin-top: 50px;
        .v-list-item-title {
            white-space: inherit !important;
            overflow: visible !important;
        }
    }
</style>

<!-- scss -->
<style lang="scss" scoped>

    .grouPreference {
        margin-top: 50px;
        .v-list-item-title {
            white-space: inherit !important;
            overflow: visible !important;
        }
    }
</style>
   
<!--  -->
<template>

    <!--  -->
    <GroupCard class="grouPreference" :groupeParameters="groupeParameters" />
   
</template>



<!--  -->
<script>
    import { defineComponent } from 'vue';
    import { mapState, mapMutations, mapActions } from 'vuex';

    // Components
    import GroupCard from '@/components/menus/setting/GroupCard.vue';

    const _ = require('lodash');

    export default defineComponent({
        name: 'preference-choice-comp',
        computed: {
            ...mapState("profil", [ "profil" ]),
            ...mapState("profil", {
                preferences: state => state.profil.infos_perso.preferences,
            }),
        },
        components: {
            GroupCard,
        },
        props: {
            labelAbout: {
                type: String,
                default: "disscution",
            },
            about: {
                type: String,
                default: "discution",
            },
        },
        data() {
            return {
                overlay: false,
                //Warn : if update here update in trip
                aboutPreference: {
                    discution: [
                        {
                            index: 0,
                            about: "discution",
                            prependIconColor:  "#9fcb66",
                            prependIcon:"mdi-forum",
                            text:"Bavard enthousiaste!",
                            chip:false,
                            chipIcon: null,
                            switchBtn: false,
                            chipText: "",
                            fun: () => this.updatePref(1),
                        },
                        {
                            index: 1,
                            about: "discution",
                            prependIconColor: "var(--blue-color)",
                            prependIcon:"mdi-forum",
                            text: "Papotage occasionnel.",
                            chip:false,
                            chipIcon: null,
                            switchBtn: false,
                            chipText: "",
                            fun: () => this.updatePref(2),
                        },
                        {
                            index: 2,
                            about: "discution",
                            prependIconColor: "#ff5353",
                            prependIcon:"mdi-forum",
                            text:"Plutôt silencieux.",
                            chip:false,
                            chipIcon: null,
                            switchBtn: false,
                            chipText: "",
                            fun: () => this.updatePref(3),
                        },
                    ],
                    smoke: [
                        {
                            index: 0,
                            about: "smoke",
                            prependIconColor:  "#9fcb66",
                            prependIcon:"mdi-smoking-off",
                            text:"Fumeur en voiture.",
                            chip:false,
                            chipIcon: null,
                            chipText: "",
                            fun: () => this.updatePref(1),
                        },
                        {
                            index: 1,
                            about: "smoke",
                            prependIconColor: "var(--blue-color)",
                            prependIcon:"mdi-smoking-off",
                            text:"Fumeur hors voiture.",
                            chip:false,
                            chipIcon: null,
                            chipText: "",
                            fun: () => this.updatePref(2),
                        },
                        {
                            index: 2,
                            about: "smoke",
                            prependIconColor: "#ff5353",
                            prependIcon:"mdi-smoking-off",
                            text:"Voiture sans fumée.",
                            chip:false,
                            chipIcon: null,
                            chipText: "",
                            fun: () => this.updatePref(3),
                        },
                    ],
                    music: [
                        {
                            index: 0,
                            about: "music",
                            prependIconColor: "#9fcb66",
                            prependIcon:"mdi-music",
                            text:"Musique non-stop!",
                            chip:false,
                            chipIcon: null,
                            chipText: "",
                            fun: () => this.updatePref(1),
                        },
                        {
                            index: 1,
                            about: "music",
                            prependIconColor: "var(--blue-color)",
                            prependIcon:"mdi-music",
                            text:"Musique selon l'humeur.",
                            chip:false,
                            chipIcon: null,
                            chipText: "",
                            fun: () => this.updatePref(2),
                        },
                        {
                            index: 2,
                            about: "music",
                            prependIconColor: "#ff5353",
                            prependIcon:"mdi-music",
                            text:"Le silence est d'or",
                            chip:false,
                            chipIcon: null,
                            chipText: "",
                            fun: () => this.updatePref(3),
                        },
                    ],
                    animal: [
                        {
                            index: 0,
                            about: "animal",
                            prependIconColor: "#9fcb66",
                            prependIcon:"mdi-paw",
                            text:"Ami des animaux.",
                            chip:false,
                            chipIcon: null,
                            chipText: "",
                            fun: () => this.updatePref(1),
                        },
                        {
                            index: 1,
                            about: "animal",
                            prependIconColor: "var(--blue-color)",
                            prependIcon:"mdi-paw",
                            text:"Sélectif avec les animaux.",
                            chip:false,
                            chipIcon: null,
                            chipText: "",
                            fun: () => this.updatePref(2),
                        },
                        {
                            index: 2,
                            about: "animal",
                            prependIconColor: "#ff5353",
                            prependIcon:"mdi-paw",
                            text:"Pas d'animaux en voiture.",
                            chip:false,
                            chipIcon: null,
                            chipText: "",
                            fun: () => this.updatePref(3),
                        },
                    ],
                },
                groupeParameters: [
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
            this.groupeParameters[0].label = this.labelAbout;
            this.groupeParameters[0].parameters = this.aboutPreference[this.about].slice();
        },
        methods: {
            ...mapMutations("profil", ["SET_PREFERENCE_ABOUT"]),
            ...mapActions("profil", ["updatePreference"]),
            updatePref(index){
                this.SET_PREFERENCE_ABOUT(_.cloneDeep(this.groupeParameters[0].parameters[index-1]));
                this.updatePreference();
                this.$emit('pref-selected');
            },
        },
        watch: {
            about(){
                //rebuild parameter when about changing
                this.groupeParameters[0].label = this.labelAbout;
                this.groupeParameters[0].parameters = this.aboutPreference[this.about].slice();
            }
        }
    });
</script>
