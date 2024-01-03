<style lang="scss" model>

</style>

<!-- scss -->
<style lang="scss" scoped>
    .blc-pile{
        position: relative;
        width: 100%;
        height: 200px;
        z-index: 0;
        .tj{
            margin: auto;
            left: 50%;
            transform: translate(-50%, 0%);
            box-shadow: 1px 1px 3px #bbb;
        }

        //Animate Pile
        .s1 {
            width: 83% !important;
            top: 3%;
            animation-name: roll-down-s1;
            animation-duration: 0.8s;
            animation-timing-function: ease-in-out;
        }
        .s1.open {
            width: 87.2% !important;
            top: 46%;
            animation-name: roll-down-s1-open;
            animation-duration: 0.8s;
            animation-timing-function: ease-in-out;
        }
        .s1.open-with-s2 {
            width: 87.2% !important;
            top: 32%;
            animation-name: roll-down-s1-open-with-s2;
            animation-duration: 0.8s;
            animation-timing-function: ease-in-out;
        }

        .s2 {
            width: 77% !important;
            top: 6%;
            animation-name: roll-down-s2;
            animation-duration: 1s;
            animation-timing-function: ease-in-out;
        }
        .s2.follow-s1 {
            width: 83% !important;
            top: 48%;
            animation-name: roll-down-s2-follow-s1-open;
            animation-duration: 1s;
            animation-timing-function: ease-in-out;
        }
        .s2.open {
            width: 87.2% !important;
            top: 64%;
            animation-name: roll-down-s2-open;
            animation-duration: 1s;
            animation-timing-function: ease-in-out;
        }

        @keyframes roll-down-s1 {
            0% {
                top: 0%;
            }
            100% {
                top: 3%;
            }
        }

        @keyframes roll-down-s1-open {
            0% {
                top: 3%;
            }
            100% {
                top: 46%;
            }
        }

        @keyframes roll-down-s1-open-with-s2 {
            0% {
                top: 3%;
            }
            100% {
                top: 32%;
            }
        }

        @keyframes roll-down-s2 {
            0% {
                top: 0%;
            }
            100% {
                top: 6%;
            }
        }

        @keyframes roll-down-s2-follow-s1-open {
            0% {
                top: 6%;
            }
            100% {
                top: 48%;
            }
        }

        @keyframes roll-down-s2-open {
            0% {
                top: 6%;
            }
            100% {
                top: 64%;
            }
        }
    }

</style>
   
<!--  -->
<template>
    <div class="blc-pile" ref="blocPile">
        <TrajetMemberBtn v-if="fastSearch == false" @click="getFastSearch" :load="load" :empty="empty" class="tj main" style="z-index: 88; position: absolute; top:0%"/>
        <TrajetMember
            v-if="fastSearch == true"
            class="tj main fss" 
            style="z-index: 88; position: absolute; top:0%"
            :infos="trajetFiltered.length > 0 ? trajetFiltered[0] : {}"
            @click="reserve(0)"
            
        />
        <TrajetMember 
            class="tj sub s1" 
            style="z-index: 87; position: absolute;"
            :infos="trajetFiltered.length > 1 ? trajetFiltered[1] : {}"
            @click="reserve(1)"
        />
        <TrajetMember
            class="tj sub s2" 
            style="z-index: 86; position: absolute;"
            :infos="trajetFiltered.length > 2 ? trajetFiltered[2] : {}"
            @click="reserve(2)"
        />
    </div>
</template>



<!--  -->
<script>
    import $ from 'jquery';
    import { defineComponent } from 'vue';
    import { mapActions, mapState, mapMutations } from 'vuex';
    import { onMounted, onUnmounted, ref } from 'vue';

    // Components
    import TrajetMemberBtn from './TrajetMemberBtn.vue';
    import TrajetMember from '@/components/search/TrajetMember.vue';

    export default defineComponent({
        name: 'pile-search-comp',
        setup() {
            const blocPile = ref(null);

            const resizeObserver = new ResizeObserver(() => {
                // for (let entry of entries) {
                    // const rect = entry.contentRect;
                    $(".v-application__wrap").scrollTop($(".v-main")[0].clientHeight);
                    // console.log(`size : ${rect.width}px x ${rect.height}px ${$(".v-main")[0].clientHeight} ${$(".v-application__wrap").scrollTop()}`);
                // }
            });

            onMounted(() => {
                if (blocPile.value) {
                    resizeObserver.observe(blocPile.value);
                }
            });

            onUnmounted(() => {
                resizeObserver.disconnect();
            });

            return { blocPile };
        },
        computed: {
            ...mapState("search", ["trajets", "nbPassenger"]),
            trajetFiltered(){
                const currentDate = new Date();
                return this.trajets.filter(
                    (trajet) => trajet.passenger_number + parseInt(this.nbPassenger) <= trajet.max_seats
                    && currentDate.getTime() < new Date(trajet.departure_time).getTime()
                    && this.isSameDay(currentDate, new Date(trajet.departure_time))
                );
            },
        },
        components: {
            TrajetMemberBtn,
            TrajetMember,
        },
        props: {
        },
        data() {
            return {
                fastSearch: false,
                empty: false,
                load: false,
            }
        },
        methods: {
            ...mapMutations("search", ["SET_TRAJET_SELECTED"]),
            ...mapActions("search", ["getTrajets", "getTrajetsFake"]),
            reserve(index){
                if( this.trajetFiltered.length > index ){
                    this.SET_TRAJET_SELECTED(this.trajetFiltered[index]);
                    this.$emit("reserve");
                }
            },
            async getFastSearch(){
                this.empty = false;
                this.info = {};
                this.load = true;

                await this.getTrajets();
                // await this.getTrajetsFake();
                
                setTimeout(function(){

                    if( this.trajetFiltered.length > 0 ){
                        this.fastSearch = true;
                        this.$emit("fast-get-trip");
                        // Animation open trajet-member-pile
                        if( this.trajetFiltered.length == 2 ){
                            $(".blc-pile").animate({"height": `360px`}, "fast", function(){
                                $(this).css("height", `360px`);
                            });
                            $(".s1").addClass("open");
                            $(".s1.open").animate({"width": `87.2%`}, 'fast');
                            $(".s2").addClass("follow-s1");
                            $(".s2.follow-s1").animate({"width": `83%`}, 'fast');
                        }
                        else if( this.trajetFiltered.length >= 3 ){
                            $(".blc-pile").animate({"height": `520px`}, "fast", function(){
                                $(this).css("height", `520px`);
                            });
                            $(".s1").addClass("open-with-s2");
                            $(".s1.open-with-s2").animate({"width": `87.2%`}, 'fast');
                            $(".s2").addClass("open");
                            $(".s2.open").animate({"width": `87.2%`}, 'fast');
                        }
                    }
                    else{
                        this.empty = true;
                    }
                    this.load = false;
                }.bind(this), 1000);
            },
            isSameDay(date1, date2) {
                return (
                    date1.getFullYear() === date2.getFullYear() &&
                    date1.getMonth() === date2.getMonth() &&
                    date1.getDate() === date2.getDate()
                );
            },
        },
        mounted() {
        }
    });
</script>
