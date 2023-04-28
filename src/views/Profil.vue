<!-- scss -->
<style lang="scss" scoped>
    /* avatar */
    .avatar-comp {
        margin-top: 30px;
        .v-avatar {
            .v-icon {
                display: none;
                background-color: transparent;
                position: absolute;
                font-size: 3.358em;
                color: white;
                opacity: 0.7;
            }
        }
        .title {
            font-size: 24px !important;
            font-weight: 500;
            margin: 10px auto 5px auto;
        }
        .sub-title{
            font-size: 12px;
            font-weight: bold;
            color: gray;
        }
    }

    /* ? */
    .inf-comp {
        border-radius: 20px;
        margin-top: 30px;
        margin-bottom: 15px;
        background-color: white;
        padding: 10px;
        width: 82.7%;
        height: 94px;
        .blc-btn {
            border-radius: 15px;
            height: 100%;
            display: flex;
            align-items: center;
            background-color: #f5f5f5;
            div {
                
                width: 33%;
                text-align: center;
                &.btn {
                    cursor: pointer;
                }
                .text-subtitle{
                    margin-top: 10px;
                    text-transform: uppercase;
                    text-align: center;
                    width: 100%;
                    color: #616161;
                    font-size: 12px;
                    font-weight: bold;
                }
            }
        }
    }

    .grouP {
        margin-top: 50px;
    }

</style>
   
<!--  -->
<template>

    <ToolbarProfil />

    <!-- Avatar -->
    <div
        class="avatar-comp text-center"
    >
        <v-avatar size="108">
            <v-img
                alt="Avatar"
                src="https://avatars0.githubusercontent.com/u/9064066?v=4&s=460"
            ></v-img>
            <v-icon>
                mdi-camera-plus
            </v-icon>
        </v-avatar>
        <div
            class="title text-center mx-auto"
        >Dr. Mourdas</div>
        <div
            class="sub-title text-center mx-auto"
            preprend-icon="mdi-map-marker-radius"
        ><v-icon>mdi-map-marker-radius</v-icon>NEW YORK</div>
    </div>

    <!-- ? -->
    <div
        class="inf-comp mx-auto"
    >
        <div
            class="blc-btn"
        >
            <div 
                v-for="(info, index) in infos_panneau"
                :key="index"
                :class="{btn : info.btn}"
                @click="choiceFunctionBtnInfo(info.text)"
                >
                
                <v-icon>
                    {{info.icon}}
                </v-icon>
                <div class="text-subtitle">{{info.text}}</div>
            </div>
        </div>
    </div>

    <!--  -->
    <GroupCard class="grouP" :groupeParameters="groupeParameters" />

    <!-- Credit Card -->

    <!--  -->

    <BottomNav />
</template>



<!--  -->
<script>
    import { defineComponent } from 'vue';

    // Components
    import ToolbarProfil from '@/components/menus/head/ToolbarProfil.vue';
    import BottomNav from '@/components/menus/BottomNav.vue';
    import GroupCard from '@/components/menus/setting/GroupCard.vue';

    export default defineComponent({
        name: 'profil-view',

        components: {
            ToolbarProfil,
            GroupCard,
            BottomNav,
        },
        data() {
            return {
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
                        icon:"mdi-lightbulb-on",
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
                                text:"j'aime bien discuté",
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
                };
            },
            test2(){
                console.log("text2")
            },
            test3(){
                console.log("text3")
            }
        }
    });
</script>
