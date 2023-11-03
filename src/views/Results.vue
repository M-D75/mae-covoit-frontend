
<style lang="scss" model>

    .v-main, .v-application__wrap {
        overflow: hidden;
    }

    .label-filter.text-caption {
        width: 85%;
        max-width: 500px;
    }

</style>

<!-- scss -->
<style lang="scss" scoped>
    .container-trajet-member {
        margin: 13px 0;
        .label-filter {
            color: var(--font-color-label);
        }
        .nothing {
            display: table;
            text-align: center;
            height: 83vh;
            .contenu {
                text-align: center;
                display: table-cell;
                vertical-align: middle;
                i {
                    font-size: 35px;
                    margin-bottom: 5px;
                }
                span {
                    font-size: 17px;
                    text-transform: uppercase;
                    display: block;
                }
            }
        }
    }

</style>
   
<!--  -->
<template>

    <!-- toolbar -->
    <Toolbar 
        :trajet="{depart: depart, destination: destination}"
        :nombre_trajet="trajets.filter(trajet => trajet.depart == depart && trajet.destination == destination).length"
        :nbPassager="nbPassager"
        :date="date.replaceAll('-', '/')"
    />

    <!--  -->
    <v-main class="container-trajet-member">
        <div class="label-filter text-caption text-uppercase mx-auto">{{ date.replaceAll("-", "/") }}</div>
        <TrajetMember 
            v-for="(infos, index) in trajetFiltered" 
            :key="index" 
            :infos="infos"
            :data-index="index"
            @click="reserve($event, index)"
        />

        <div
            v-if="nothing"
            class="nothing label-filter text-caption mx-auto"
        >
            <div class="contenu">
                <v-icon icon="mdi-alert-circle-outline"></v-icon>
                <span>Aucun trajet n'a été trouvé</span>
            </div>
        </div>

        <v-overlay 
            v-model="overlay" 
            contained
            persistent
            style="z-index: 0;"
            @click="callCloseBottomChild()"
        ></v-overlay>
    </v-main>

    <!-- reserve -->
    <BottomMenu 
        :class-name="['results']" 
        ref="BottomMenuRef" 
        mode="reserve" 
        v-on:close="overlay = false;" 
        :infos="infos"
    />

    <!-- loading -->
    <v-overlay
        :model-value="overlayLoad"
        class="align-center justify-center"
    >
        <v-progress-circular
            color="black"
            indeterminate
            size="64"
        ></v-progress-circular>
    </v-overlay>
</template>



<!--  -->
<script>
    //import $ from 'jquery';
    import { defineComponent } from 'vue';
    import { mapActions, mapMutations, mapState } from 'vuex';


    // Components
    import Toolbar from '@/components/menus/head/Toolbar.vue'
    import TrajetMember from '@/components/search/TrajetMember.vue';
    import BottomMenu from '@/components/menus/BottomMenu.vue';

    export default defineComponent({
        name: 'results-view',
        computed: {
            ...mapState("search", ["trajets", "trajetSelected"]),
            ...mapActions("search", ["getTrajets"]),
            trajetFiltered(){
                console.log("filtred trajjj");
                return this.trajets.filter(
                    (trajet) => trajet.depart == this.depart 
                    && trajet.destination == this.destination
                    && trajet.passenger_number + this.nbPassager <= trajet.max_seats
                );
            },
        },
        components: {
            Toolbar,
            TrajetMember,
            BottomMenu,
        },
        props: {
            depart: {
                type: String,
                default: "Tsingoni",
            },
            destination: {
                type: String,
                default: "Mamoudzou",
            },
            date: {
                type: String,
                default: "Aujourd'hui",
            },
            nbPassager: {
                type: Number,
                default: 0,
            }
        },
        data() {
            return {
                infos: {
                    depart: "Tsingoni",
                    destination: "Mamoudzou",
                    hour_start: "4:50",
                    hour_end: "6:55",
                    price: 4,
                    name: "Ledou",
                    passenger_number: 2,
                    max_seats: 4
                },
                nothing: false,
                overlay: false,
                overlayLoad: true,
            }
        },
        mounted(){
            this.waitInit();
            // console.log("params", this.$route.params);
        },
        methods: {
            ...mapMutations("search", ["SET_DEPART", "SET_DESTINATION", "SET_NB_PASSENGER"]),
            reserve(event, index){
                this.infos = this.trajetFiltered[index];
                // TODO: propre
                this.trajetSelected = this.infos;
                this.$store.commit("search/SET_DEPART", "");
                this.$store.commit("search/SET_DESTINATION", "");
                this.$store.commit("search/SET_NB_PASSAGER", 1);
                this.callChildMethod();
            },
            callChildMethod() {
                if ( this.$refs.BottomMenuRef ) {
                    this.overlay = this.$refs.BottomMenuRef.open();
                }
            },
            callCloseBottomChild() {
                if ( this.$refs.BottomMenuRef ) {
                    this.$refs.BottomMenuRef.close();
                    this.trajetSelected = null;
                    setTimeout(
                            function(){
                                this.overlay = false;
                            }.bind(this), 1000
                        );
                }
            },
            async waitInit(){
                this.overlayLoad = true;
                try{
                    await this.getTrajets;
                    if(this.trajetFiltered.length == 0)
                        this.nothing = true;
                } 
                catch (error) {
                    console.error("Error:", error)
                    this.nothing = true;
                }
            },
        },
        watch: {
            overlay(){
                if( ! this.overlay ){
                    if(this.$refs.BottomMenuRef && this.$refs.BottomMenuRef.notif){
                        this.$router.replace("/search")
                    }
                }
            },
            trajets(){
                this.overlayLoad = this.trajets.length == 0 ? true : false;
            },
        },
    });
</script>
