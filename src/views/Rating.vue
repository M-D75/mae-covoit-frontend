<!-- scss -->
<style lang="scss" scoped>
    .v-main.rating {
        padding: 10px;
        .v-rating {
            margin: 40px auto;
            display: table;
            color: var(--font-color-label);
        }

        .title{
            margin: 20px auto;
            color: var(--font-color-label);
            text-align: center;
            width: 80%;
        }

        .sub-title{
            margin: 10px auto;
            font-size: 13px;
            color: var(--font-color-label);
            display: table;
        }
        .good-part {
            .sub-title{
                color: #1af2a7;
            }
            .sub-title.darkMode{
                color: green;
            }
        }

        .bad-part {
            .sub-title{
                color: #f2371a;
            }
        }

        .contain-btn-icon{
            padding: 10px;
            display: flex;
            justify-content: center;
            margin: 10px auto;
            flex-wrap: wrap;
            .v-btn {
                height: 48px;
                margin: 7px 15px;
                background-color: var(--white-bg-color);
                color: var(--font-color-label);
            }
        }

        .v-divider{
            color: var(--font-color-label);
            margin: 3px auto;
        }

        .v-btn.something-wrong {
            color: var(--font-color-label);
            margin: auto;
            display: block;
        }

        .v-btn.valided{
            width: 80%;
            margin: 15px auto;
            display: block;
        }
    }
</style>
   
<!--  -->
<template>
    <v-overlay v-model="overlay" contained persistent style="z-index: 10;" @click="overlay = false"></v-overlay>

    <v-main class="rating" >
        <div ref="ratingRef">
            <!-- Avatar -->
            <Avatar :name="userName" :modeEdit="false" :avatar="avatarUrl" :sub-title="profil.infos_perso.adress.commune" />

            <!-- ? -->
            <PanneauInfo v-if="modeDriver" :infos_panneau="infos_panneau" />

            <v-rating
                v-model="avis"
                hover
                :length="5"
                :size="44"
                :active-color=" darkMode ? 'white' : 'black'"
            />

            <div class="good-part">
                <div class="title">Qu'avez vous pensez du service offert par {{ userName }} ?</div>

                <div 
                    class="contain-btn-icon good-trip"
                >
                    <v-btn
                        v-for="(btn, indexB) in btnIco.good"
                        :key="indexB"
                        :icon="btn.icon"
                        :color="btn.select ? (darkMode ? '#1af2a7' : 'green' ) : ''"
                        :disabled="btnIco.bad[indexB].select ? true : false"
                        variant="outlined"
                        @mouseenter="goodDescription=(indexB+1)+'. '+btn.description"
                        @click="btn.select=!btn.select; goodDescription=(indexB+1)+'. '+btn.description;"
                    >
                    </v-btn>
                    
                </div>
                <div class="sub-title" :class="{darkMode: !darkMode}">{{ goodDescription }}</div>
            </div>

            <v-divider inset></v-divider>

            <v-btn
                class="something-wrong text-none" 
                variant="text"
                size="large"
                color="red"
                @click="notHappy=true"
            >
                Vous n'êtes pas satisfait ?
            </v-btn>

            <div 
                v-if="notHappy"
                class="bad-part zoom-bounce">
                <div class="title">Que sait il passé ?</div>

                <div 
                    class="contain-btn-icon bad-trip"
                >
                    <v-btn
                        v-for="(btn, indexB) in btnIco.bad"
                        :key="indexB"
                        :icon="btn.icon"
                        :color="btn.select ? 'red' : ''"
                        :disabled="btnIco.good[indexB].select ? true : false"
                        variant="outlined"
                        @mouseenter="badDescription=(indexB+1)+'. '+btn.description"
                        @click="btn.select=!btn.select; badDescription=(indexB+1)+'. '+btn.description"
                    >
                    </v-btn>
                </div>
                <div class="sub-title">{{ badDescription }}</div>
            </div>

            <v-btn
                class="text-none valided"
                variant="flat"
                color="black"
                size="large"
                @click="rated()"
            >
                XXXXXXXXXXXXXXXX
            </v-btn>

        </div>

    </v-main>
</template>


<!--  -->
<script>
    import $ from 'jquery';
    import { defineComponent } from 'vue';
    import { mapState, mapActions, mapMutations } from 'vuex';
    import { onMounted, onUnmounted, ref } from 'vue';


    import { formatNumber } from '@/utils/utils.js'

    // Components
    import Avatar from '@/components/profile/Avatar.vue';
    import PanneauInfo from '@/components/profile/PanneauInfo.vue';

    export default defineComponent({
        name: 'rating-view',
        computed: {
            ...mapState("profil", ["profil", "userName", "modeDriver", "avatarUrl", "darkMode"]),
            ...mapState("profil", {
                nbTrip: state => state.profil.nbTrip,
            }),
            ...mapState("trip", ["ratings"]),
        },
        setup(){
            const ratingRef = ref(null);

            const resizeObserver = new ResizeObserver(() => {
                // for (let entry of entries) {
                //     const rect = entry.contentRect;
                    // $(".v-application__wrap").scrollTop($(".v-main.rating")[0].clientHeight);
                    $(".v-application__wrap").animate({scrollTop: `${$(".v-main.rating")[0].clientHeight}px`}, 'slow');
                    // console.log(`size : ${rect.width}px x ${rect.height}px ${$(".v-main.rating")[0].clientHeight}`);
                // }
            });

            onMounted(() => {
                if (ratingRef.value) {
                    resizeObserver.observe(ratingRef.value);
                }
            });

            onUnmounted(() => {
                resizeObserver.disconnect();
            });

            return { ratingRef };
        },
        components: {
            Avatar,
            PanneauInfo,
        },
        props: {
        },
        data() {
            return {
                goodDescription: "",
                badDescription: "",
                notHappy: false,
                avis: 3,
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
                btnIco: {
                    good: [
                        {
                            icon: "mdi-emoticon-dead",
                            select: false,
                            description: "Gentille",
                            fun: ()=>console.log("click"),
                        },
                        {
                            icon: "mdi-alert-octagon", 
                            select: false,
                            description: "Bon communiquant",
                            fun: ()=>console.log("click"),
                        },
                        {
                            icon: "mdi-map-marker-alert", 
                            select: false,
                            description: "Bon conducteur",
                            fun: ()=>console.log("click"),
                        },
                        {
                            icon: "mdi-train-car-flatbed-tank", 
                            select: false,
                            fun: ()=>console.log("click"),
                        },
                        {
                            icon: "mdi-alert-octagon", 
                            select: false,
                            fun: ()=>console.log("click"),
                        },
                        {
                            icon: "mdi-map-marker-alert", 
                            select: false,
                            fun: ()=>console.log("click"),
                        
                        },
                        {
                            icon: "mdi-train-car-flatbed-tank", 
                            select: false,
                            fun: ()=>console.log("click"),
                        },
                    ],
                    bad: [
                        {
                            icon: "mdi-emoticon-dead", 
                            select: false,
                            description: "Pas gentille",
                            fun: ()=>console.log("click"),
                        },
                        {
                            icon: "mdi-alert-octagon", 
                            select: false,
                            description: "Pas bon communiquant",
                            fun: ()=>console.log("click"),
                        },
                        {
                            icon: "mdi-map-marker-alert", 
                            select: false,
                            description: "Pas bon conducteur",
                            fun: ()=>console.log("click"),
                        
                        },
                        {
                            icon: "mdi-train-car-flatbed-tank", 
                            select: false,
                            fun: ()=>console.log("click"),
                        },
                        {
                            icon: "mdi-alert-octagon", 
                            select: false,
                            fun: ()=>console.log("click"),
                        },
                        {
                            icon: "mdi-map-marker-alert", 
                            select: false,
                            fun: ()=>console.log("click"),
                        
                        },
                        {
                            icon: "mdi-train-car-flatbed-tank", 
                            select: false,
                            fun: ()=>console.log("click"),
                        },
                    ],
                }
            }
        },
        mounted() {
            // this.getNotation();
        },
        methods: {
            ...mapActions("profil", ["getNotation"]),
            ...mapMutations("trip", ["SET_RATING", "SET_RATINGS_REMOVE"]),
            back() {
                this.$router.push("/profil")
            },
            rated(){
                if( this.ratings.rating ){

                    //TODO : Notation = get infos selected by users
                    const tab = this.btnIco.good.map((note) => note.select ? 1 : 0);
                    console.log("tab-rating", tab);

                    //**update rating store
                    //*remove data = null
                    //*remove infos in bookings list
                    // console.log("Id to remove", this.ratings.data.id);
                    // this.SET_RATINGS_REMOVE({id: this.ratings.data.id})

                    // console.log("this.ratings.bookings", this.ratings.bookings);
                    // if( this.ratings.bookings.length == 0 ){
                    //     this.SET_RATING(false);
                    // }
                }
            },
            // ratingIcon(index){

            // }
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
            modeDriver() {
                this.switchModeDriverGroupParameters();
            },
            nbTrip(){
                this.infos_panneau[0].label = formatNumber(this.nbTrip);
            },
            
        }
    });
</script>
