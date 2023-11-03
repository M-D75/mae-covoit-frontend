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
        <TrajetMemberBtn v-if="fastSearch == false" @click="getFastSearch" class="tj main" style="z-index: 88; position: absolute; top:50%"/>
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
            ...mapState("search", ["trajets", "trajetSelected"]),
            ...mapActions("search", ["getTrajets"]),
        },
        components: {
            TrajetMemberBtn,
            TrajetMember,
        },
        props: {
            // infos: {
            //     type: Object,
            //     default() {
            //     return {
            //             "depart": "Tsingoni",
            //             "destination": "Mamoudzou",
            //             "hour_start": "4:50",
            //             "hour_end": "6:55",
            //             "price": 4,
            //             "name": "Ledou",
            //             "passenger_number": 2
            //         };
            //     },
            // },
        },
        data() {
            return {
                fastSearch: false,
                infos: {},
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
                this.infos = this.trajets[0];
                this.fastSearch = true;
                this.$emit("fast-get-trip");
            },
        },
        mounted() {
        }
    });
</script>
