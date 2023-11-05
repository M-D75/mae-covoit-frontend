<style lang="scss" model>

    //Animate Pile
    .s1 {
        animation-name: roll-down-s1;
        animation-duration: 0.8s;
        animation-timing-function: ease-in-out;
    }

    .s2 {
        animation-name: roll-down-s2;
        animation-duration: 1s;
        animation-timing-function: ease-in-out;
    }

    @keyframes roll-down-s1 {
        0% {
            top: 50%;
        }
        100% {
            top: 55%;
        }
    }

    @keyframes roll-down-s2 {
        0% {
            top: 50%;
        }
        100% {
            top: 60%;
        }
    }
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
            transform: translate(-50%, -50%);
            box-shadow: 1px 1px 3px #bbb;
        }
    }
</style>
   
<!--  -->
<template>
    <div class="blc-pile">
        <TrajetMemberBtn v-if="fastSearch == false" @click="getFastSearch" :empty="empty" class="tj main" style="z-index: 88; position: absolute; top:50%"/>
        <TrajetMember
            v-if="fastSearch == true" 
            @click="reserve()"
            :infos="infos"
            class="tj main" 
            style="z-index: 88; 
            position: absolute; 
            top:50%"
        />
        <TrajetMember class="tj sub s1" style="z-index: 87; position: absolute; top:55%; width: 83%;"/>
        <TrajetMember class="tj sub s2" style="z-index: 86; position: absolute; top:60%; width: 77%;"/>
    </div>
</template>



<!--  -->
<script>
    import { defineComponent } from 'vue';
    import { mapActions, mapState, mapMutations } from 'vuex';

    // Components
    import TrajetMemberBtn from './TrajetMemberBtn.vue';
    import TrajetMember from '@/components/search/TrajetMember.vue';

    export default defineComponent({
        name: 'pile-search-comp',
        computed: {
            ...mapState("search", ["trajets", "trajetSelected", "nbPassenger"]),
            ...mapActions("search", ["getTrajets"]),
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
                infos: {},
                empty: false,
            }
        },
        methods: {
            ...mapMutations("search", ["SET_TRAJET_SELECTED"]),
            reserve(){
                this.SET_TRAJET_SELECTED(this.infos);
                this.$emit("reserve");
            },
            async getFastSearch(){
                await this.getTrajets;
                if( this.trajetFiltered.length > 0 ){
                    this.infos = this.trajetFiltered[0];
                    this.fastSearch = true;
                    this.$emit("fast-get-trip");
                }
                else{
                    this.infos = {};
                    this.empty = true;
                }
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
