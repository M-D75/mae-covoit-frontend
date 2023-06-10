<!-- scss -->
<style lang="scss" scoped>
    .main {
        height: 100%;
        margin-top: 100px;
        margin-bottom: 50px;
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

    <ToolbarProfil :title="'Information personnelles'"/>
    <div class="main">
        <!-- Avatar -->
        <Avatar />

        <!-- ? -->
        <PanneauInfo :infos_panneau="infos_panneau"/>

        <!--  -->
        <GroupCard class="grouP" :groupeParameters="groupeParameters" />

        <!-- Credit Card -->

        <!--  -->
    </div>
    <BottomNav />

    <!-- Car model -->
    <BottomMenu
        v-if="modeBottomMenu=='select-model-car'"
        ref="BottomMenuRef"
        :class-name="['notification']"
        :mode="modeBottomMenu"
        v-on:close="overlay = false"
    />
</template>



<!--  -->
<script>
    import { defineComponent } from 'vue';

    // Components
    import ToolbarProfil from '@/components/menus/head/ToolbarProfil.vue';
    import Avatar from '@/components/profile/Avatar.vue';
    import PanneauInfo from '@/components/profile/PanneauInfo.vue';
    import GroupCard from '@/components/menus/setting/GroupCard.vue';
    import BottomNav from '@/components/menus/BottomNav.vue';
    import BottomMenu from '@/components/menus/BottomMenu.vue';

    export default defineComponent({
        name: 'infos-profil-view',

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
                        fun: this.selectModel,
                    },
                    {
                        label: "préferences de voyage",
                        parameters: [
                            {
                                prependIconColor: "var(--blue-color)",
                                prependIcon:"mdi-forum",
                                text:"j'aime bien discuter",
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
            choiceFunctionBtnInfo(name){
                switch (name.toLowerCase()) {
                    case 'mode':
                        this.test2();
                        break;
                    case 'historique':
                        this.test3();
                        break;
                    case 'Papayas':
                        console.log('Mangoes and papayas are $2.79 a pound.');
                        // Expected output: "Mangoes and papayas are $2.79 a pound."
                        break;
                    default:
                        console.log(`Sorry, we are out of ${name}.`);
                }
            },
            test2(){
                console.log("text2")
            },
            test3(){
                console.log("text3")
            },
            selectModel(){
                if( this.$refs.BottomMenuRef ){
                    this.overlay = this.$refs.BottomMenuRef.open();
                }
            },
        },
        watch: {
            overlay(){
                if( ! this.overlay ){
                    if ( this.$refs.BottomMenuRef ) {
                        this.$refs.BottomMenuRef.close();
                    }
                }
            },
        }
    });
</script>
