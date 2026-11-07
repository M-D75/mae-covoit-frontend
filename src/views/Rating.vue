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
        <v-btn variant="text" @click="skip">Plus tard · revenir à l’accueil</v-btn>
        <p class="text-center">Votre avis est facultatif.</p>
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

    import {App} from '@capacitor/app';
    import {Capacitor} from '@capacitor/core';
    import {deferRating} from '@/services/ratingPreferences.js';
    import { serverRequest } from '@/utils/serverApi.js';


    import { formatNumber } from '@/utils/utils.js'

    // Components
    import Avatar from '@/components/profile/Avatar.vue';
    import PanneauInfo from '@/components/profile/PanneauInfo.vue';
    import IconRating from '@/components/rating/IconRating.vue';

    export default defineComponent({
        name: 'rating-view',
        computed: {
            ...mapState("profil", ["profil", "userName", "userId", "userUid", "modeDriver", "avatarUrl", "darkMode"]),
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
                isSubmitting: false,disposed:false,backListener:null,
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
            this.$store.commit('rating/RESET_RATING_SELECTION');
            if(Capacitor.getPlatform()==='android')App.addListener('backButton',()=>this.skip()).then(listener=>{if(this.disposed)listener.remove();else this.backListener=listener;}).catch(()=>{});
            if( !this.ratingDriver ){
                this.$router.replace("/");
            }
        },
        beforeUnmount(){this.disposed=true;this.backListener?.remove();},
        beforeRouteLeave(to,from,next){this.rememberDeferral();next();},
        methods: {
            currentTripId(){return this.ratings?.data?.[0]?.trip_id||this.ratingTrip?.id;},
            rememberDeferral(){const id=this.currentTripId();if(id&&this.ratings.rating){deferRating(this.userUid,id);this.SET_RATINGS_REMOVE({id,markRated:false});}},
            skip(){this.rememberDeferral();this.$router.replace('/search');},
            ...mapActions("profil", ["getNotation"]),
            ...mapMutations("trip", ["SET_RATINGS_REMOVE"]),
            back() {
                this.skip()
            },
            async rated(){
                if(this.isSubmitting)return;
                if( !this.ratings.rating || !this.ratings.data || !this.ratings.data[0] ){
                    return;
                }

                const tripId = this.currentTripId();

                if( !tripId ){
                    this.$router.push("/");
                    return;
                }

                const owner=this.userUid;
                const submittedScore=Number(this.avis);
                const generation=this.$store.state.profil.accountGeneration;
                this.ratingError = "";
                this.isSubmitting = true;
                try {
                    const goodIndices = this.btnIco.good
                        .map((item, index) => item.select ? index : null)
                        .filter((index) => index !== null);
                    const badIndices = this.btnIco.bad
                        .map((item, index) => item.select ? index : null)
                        .filter((index) => index !== null);
                    const response = await serverRequest('post', '/ratings', {
                        mode: this.$store.state.profil.modeCo,
                        data: { tripId, score: submittedScore, goodIndices, badIndices },
                    });
        
                    if(this.disposed||this.userUid!==owner||this.$store.state.profil.accountGeneration!==generation)return;
                    if(response.data?.status !== 'ok' || Number(response.data?.data?.tripId) !== Number(tripId)
                        || Number(response.data?.data?.score) !== submittedScore) {
                        throw new Error("La confirmation de votre avis n’a pas été reçue. Réessayez.");
                    }
                    this.SET_RATINGS_REMOVE({
                        id: tripId,
                        markRated: true,
                    });
                    this.$router.push("/");
                }
                catch(error){
                    if(this.disposed||this.userUid!==owner||this.$store.state.profil.accountGeneration!==generation)return;
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
