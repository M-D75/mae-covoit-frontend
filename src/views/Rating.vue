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
        <div v-if="ratingDriver" ref="ratingRef">
            <!-- Avatar -->
            <Avatar :name="ratingDriver.firstname + ' ' + ratingDriver.lastname" :modeEdit="false" :avatar="ratingDriver.avatar" :sub-title="'Non spécifié'" />

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
                <div class="title">Qu'avez vous pensé du service offert par {{ ratingDriver.firstname }} {{ ratingDriver.lastname }} ?</div>

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
                :loading="isSubmitting"
                @click="rated()"
            >
                VALIDER
            </v-btn>

            <div v-if="ratingError" class="sub-title bad-part">{{ ratingError }}</div>

        </div>

    </v-main>
</template>


<!--  -->
<script>
    import $ from 'jquery';
    import { defineComponent } from 'vue';
    import { mapState, mapActions, mapMutations } from 'vuex';
    import { onMounted, onUnmounted, ref } from 'vue';

    import { serverRequest } from '@/utils/serverApi.js';


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
            ratingTrip(){
                const relation = this.ratings?.data?.[0]?.trip;
                return Array.isArray(relation) ? relation[0] : relation;
            },
            ratingDriver(){
                const relation = this.ratingTrip?.account;
                return Array.isArray(relation) ? relation[0] : relation;
            },
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
                isSubmitting: false,
                ratingError: "",
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
            if( !this.ratingDriver ){
                this.$router.replace("/");
            }
        },
        methods: {
            ...mapActions("profil", ["getNotation"]),
            ...mapMutations("trip", ["SET_RATINGS_REMOVE"]),
            back() {
                this.$router.push("/profil")
            },
            async rated(){
                if( !this.ratings.rating || !this.ratings.data || !this.ratings.data[0] ){
                    return;
                }

                const bookingData = this.ratings.data[0];
                const tripId = bookingData.trip_id || (bookingData.trip && bookingData.trip[0] && bookingData.trip[0].id);

                if( !tripId ){
                    this.$router.push("/");
                    return;
                }

                this.ratingError = "";
                this.isSubmitting = true;
                try {
                    const goodIndices = this.btnIco.good
                        .map((item, index) => item.select ? index : null)
                        .filter((index) => index !== null);
                    const badIndices = this.btnIco.bad
                        .map((item, index) => item.select ? index : null)
                        .filter((index) => index !== null);
                    await serverRequest('post', '/ratings', {
                        mode: this.$store.state.profil.modeCo,
                        data: { tripId, score: Number(this.avis), goodIndices, badIndices },
                    });
        
                    this.SET_RATINGS_REMOVE({
                        id: tripId,
                        markRated: true,
                    });
                    this.$router.push("/");
                }
                catch(error){
                    console.error("rating error:", error);
                    if( error.response?.data?.code === 'RATING_ALREADY_SUBMITTED' ){
                        this.SET_RATINGS_REMOVE({ id: tripId, markRated: true });
                        this.$router.push("/");
                        return;
                    }
                    this.ratingError = error.response?.data?.message || "Votre avis n'a pas pu être enregistré. Vous pouvez réessayer.";
                }
                finally{
                    this.isSubmitting = false;
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
