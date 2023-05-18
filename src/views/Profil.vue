<!-- scss -->
<style lang="scss" scoped>
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
                box-shadow: none;
                font-size: 12px;
                font-weight: 700;
                background-color: #E5E5E5;
                &.active {
                    background-color: #1E90FF;
                    color: white;
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
    <div class="main">
        <!-- Avatar -->
        <Avatar 
            :modeEdit="false" 
            :name="'Dr. Strange'"
            @click="goToInfoPerso()"
            />

        <!-- ? -->
        <PanneauInfo :infos_panneau="infos_panneau" />

        <!--  -->
        <GroupCard class="grouP" :groupeParameters="groupeParameters" v-if="false"/>

        <div>
            <!-- <div class="label mx-auto">tableau de board</div> -->
            <div class="label-btn mx-auto">
                <v-btn class="active" rounded="xl">tableau de board</v-btn>
                <v-btn rounded="xl">mes trajets</v-btn>
            </div>
            <!-- Credit Card -->
            <CreditCard />

            <!-- Graph -->
            <StatsTrajet />
        </div>
    </div>
    <BottomNav />
</template>



<!--  -->
<script>
    import { defineComponent } from 'vue';

    // Components
    import ToolbarProfil from '@/components/menus/head/ToolbarProfil.vue';
    import Avatar from '@/components/profile/Avatar.vue';
    import PanneauInfo from '@/components/profile/PanneauInfo.vue';
    import GroupCard from '@/components/menus/setting/GroupCard.vue';
    import CreditCard from '@/components/profile/CreditCard.vue';
    import StatsTrajet from '@/components/profile/StatsTrajet.vue';
    import BottomNav from '@/components/menus/BottomNav.vue';
    

    export default defineComponent({
        name: 'profil-view',

        components: {
            ToolbarProfil,
            Avatar,
            PanneauInfo,
            GroupCard,
            CreditCard,
            StatsTrajet,
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
            goToInfoPerso(){
                this.$router.push("/profil/perso")
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
