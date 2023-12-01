
<style lang="scss" model>
    .home-search-view {
        // calendar
        .trajet-search {
            z-index: 100 !important;
        }
        .pile-search {
            z-index: 0 !important;
        }
    }

    .v-btn.map-btn{
        color: var(--font-color-label);
        margin: 10px auto;
    }
</style>

<!-- scss -->
<style lang="scss" scoped>
    .v-main{
        //margin-bottom: 25px;
        padding-top: var(--safe-top);
        .v-row.home-search-view{
            //margin: 30px auto;
            .title {
                font-size: var(--font-size-h1);
                color: var(--font-color-label);
                font-weight: bold;
                width: 100%;
                padding: 0 39px 0px 39px;
                margin: auto;
            }
        }
    }
</style>
   
<!--  -->
<template>

    <!-- overlay -->
    <v-overlay 
        v-model="overlay" 
        contained
        persistent
        style="z-index: 30;"
        @click="close()"
    ></v-overlay>

    <v-main>

        <div style="height: 100vh; width: 100%">

            <MapTrip />
        </div>

        <!-- reserve fast -->
        <!-- <BottomMenu 
            ref="BottomMenuRefResults"
            :class-name="['reserve']" 
            mode="reserve"
            v-on:close="overlay = false" 
        /> -->
        
    </v-main>

    <!-- Menu -->
    <!-- <BottomNavTrip /> -->


</template>



<!--  -->
<script>
    // import $ from 'jquery'
    import { defineComponent } from 'vue';
    import { mapMutations, mapState } from 'vuex';

    // Components
    // import BottomNavTrip from '@/components/menus/trip/BottomNavTrip.vue';
    // import BottomMenu from '@/components/menus/BottomMenu.vue';
    import MapTrip from "@/components/trip/MapTrip.vue"

    export default defineComponent({
        name: 'trip-view',
        computed: {
            ...mapState("search", ['depart', "destination", "nbPassenger"]),
        },
        components: {
            MapTrip,
            // BottomNavTrip,
            // BottomMenu,
        },
        data() {
            return {
                overlay: false,
                openP: false,
                
            };
        },
        mounted() {
        },
        methods: {
            ...mapMutations("search", ["SET_NB_PASSAGER"]),
            // TODO : inutile mode prod
        },
        watch: {
            overlay(){
                
            },
        },
    });
</script>
