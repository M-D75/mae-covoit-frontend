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
            <Avatar :name="ratings.data[0].trip[0].account[0].firstname + ' ' +  ratings.data[0].trip[0].account[0].lastname" :modeEdit="false" :avatar="ratings.data[0].trip[0].account[0].avatar" :sub-title="'Non spécifié'" />

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
                <div class="title">Qu'avez vous pensez du service offert par {{ ratings.data[0].trip[0].account[0].firstname }} {{ ratings.data[0].trip[0].account[0].lastname }} ?</div>

                <IconRating
                    :class-name="['good-trip']"
                    :type="'good'"
                    :editable="true"
                    ref="iconRatingRefGood"
                    v-on:description-changed="goodDescription=$refs.iconRatingRefGood.description"
                />
               
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

                <IconRating
                    :class-name="['bad-trip']"
                    :type="'bad'"
                    :editable="true"
                    ref="iconRatingRefBad"
                    v-on:description-changed="badDescription=$refs.iconRatingRefBad.description"
                />

                <div class="sub-title">{{ badDescription }}</div>
            </div>

            <v-btn
                class="text-none valided"
                variant="flat"
                color="black"
                size="large"
                @click="rated()"
            >
                VALIDER
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

    import supabase from '@/utils/supabaseClient.js';


    import { formatNumber } from '@/utils/utils.js'

    // Components
    import Avatar from '@/components/profile/Avatar.vue';
    import PanneauInfo from '@/components/profile/PanneauInfo.vue';
    import IconRating from '@/components/rating/IconRating.vue';

    export default defineComponent({
        name: 'rating-view',
        computed: {
            ...mapState("profil", ["profil", "userName", "userId", "modeDriver", "avatarUrl", "darkMode"]),
            ...mapState("profil", {
                nbTrip: state => state.profil.nbTrip,
            }),
            ...mapState("trip", ["ratings"]),
            ...mapState("rating", ["btnIco"]),
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
            IconRating,
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
            async rated(){
                if( this.ratings.rating ){

                    //TODO : Notation = get infos selected by users
                    const tab = this.btnIco.good.map((note) => note.select ? 1 : 0);
                    console.log("tab-rating", tab);

                    //get rating
                    
                    let { data: settings, error } = await supabase
                        .from('settings')
                        .select('rating')
                        .eq("account_id", this.userId)
          
                    if( error ){
                        console.err("Error:", error);

                        // ------------- exit
                        this.SET_RATINGS_REMOVE({id: this.ratings.data.id})

                        console.log("this.ratings.bookings", this.ratings.bookings);
                        if( this.ratings.bookings.length == 0 ){
                            this.SET_RATING(false);
                        }

                        this.$router.push("/");

                        return;
                    }

                    console.log("settings", settings);

                    let newRatingGood = settings[0].rating.good.map((value, index) => this.btnIco.good[index] ? value + 1 : value)
                    let newRatingBad = settings[0].rating.bad.map((value, index) => this.btnIco.bad[index] ? value + 1 : value)

                    //update rating

                    const { data: setting_update, error: error_update } = await supabase
                        .from('settings')
                        .update({ "rating": {bad: newRatingBad, good: newRatingGood } })
                        .eq("account_id", this.userId)
                        .select()
          
                    if( error_update ){
                        console.err("Error update:", error_update);
                        console.log("Id to remove", this.ratings.data.id);

                        // ------------- exit
                        this.SET_RATINGS_REMOVE({id: this.ratings.data.id})

                        console.log("this.ratings.bookings", this.ratings.bookings);
                        if( this.ratings.bookings.length == 0 ){
                            this.SET_RATING(false);
                        }

                        this.$router.push("/");
                        return;
                    }

                    console.log("setting_update", setting_update);



                    //**update rating store
                    //*remove data = null
                    //*remove infos in bookings list
                    console.log("Id to remove", this.ratings.data.id);
                    this.SET_RATINGS_REMOVE({id: this.ratings.data.id})

                    console.log("this.ratings.bookings", this.ratings.bookings);
                    if( this.ratings.bookings.length == 0 ){
                        this.SET_RATING(false);
                    }

                    this.$router.push("/");
                }
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
            modeDriver() {
                this.switchModeDriverGroupParameters();
            },
            nbTrip(){
                this.infos_panneau[0].label = formatNumber(this.nbTrip);
            },
            
        }
    });
</script>
