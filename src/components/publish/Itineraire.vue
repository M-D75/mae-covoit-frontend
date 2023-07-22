
<style lang="scss" model>
    .itineraire {
        .v-btn {
            margin: 20px auto;
            color: var(--font-color-label) !important;
        }

        .v-switch {
            .v-selection-control {
                min-height: inherit !important;
            }
        }
    }
</style>

<!-- scss -->
<style lang="scss" scoped>
    .itineraire {
        .title {
            cursor: pointer;
            position: relative;
            z-index: 990;
            font-size: var(--font-size-h1);
            color: var(--font-color-label);
            font-weight: bold;
            width: 95%;
            padding: 0 39px 0px 39px;
            margin: 100px auto;
            margin-bottom: 150px;
            color: white;
            background-color: #33333366;
            border-radius: 20px;
        }

        .cont {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            margin: auto;
            height: 990px;
            .over {
                display: none;
                position: absolute;
                top: 0;
                left: 0;
                z-index: 25;
                width: 100%;
                height: 100%;
                background-color: #33333311;
            }
            iframe {
                z-index: 1;
                width: 100%;
                height: 100%;
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
        style="z-index: 10;"
        @click="overlay = false"
    ></v-overlay>

    <div class="itineraire">
        <div
            class="title text-center"
        >Quelle est votre route ?</div>

        <div 
            class="cont" 
        >
            <div 
                class="over"
            ></div>
            <Map :itineraire="itineraire" v-on:trajet-selected="itineraireValided()"></Map>
        </div>
    </div>
</template>



<!--  -->
<script>
    import $ from 'jquery';
    import { defineComponent } from 'vue';
    import { mapState } from 'vuex';


    // Components
    import Map from "@/components/publish/Map.vue"

    export default defineComponent({
        name: 'itineraire-comp',
        computed: {
            ...mapState(["trajets"]),
        },
        components: {
            Map,
        },
        props: {
            itineraire: {
                type: Object,
                default: () => {
                    return {
                        origin: {
                            location: {
                                latLng: {
                                    latitude: -12.7243245,
                                    longitude: 45.0589372,
                                    latLngTab: [-12.7243245, 45.0589372]
                                }
                            },
                            infos: {
                                village: "Acoua",
                                commune: "Acoua",
                            }
                        },
                        destination: {
                            location: {
                                latLng: {
                                    latitude: -12.9292776,
                                    longitude: 45.1763906,
                                    latLngTab: [-12.9292776, 45.1763906]
                                }
                            },
                            infos: {
                                village: "Bambo-Est",
                                commune: "Bandrélé",
                            }
                        },
                    }
                }
            },
        },
        data() {
            return {
                overlay: false,
                labelSelectorTime: "",
            }
        },
        mounted(){
            
        },
        methods: {
            hourEdit(){
                console.log("hour-edit");
            },
            selectHour(type) {
                console.log(type);
                if( ! this.overlay ){
                    if( type == "dom" ){
                        $(".dom .btn .sub-btn").css("z-index", 15);
                        this.labelSelectorTime = "Heure de départ du domicile";
                    }
                    else{
                        $(".work .btn .sub-btn").css("z-index", 15);
                        this.labelSelectorTime = "Heure de départ du travail";
                    }
                    this.overlay = this.$refs.BottomMenuRef.openMiddle();
                }
            },
            getSelectedRef(){
                console.log("time-getting")
            },
            itineraireValided(){
                console.log("itineraireValided")
                this.$emit("itineraire-valided")
            },
        },
        watch: {
            overlay(){
                if( ! this.overlay ){
                    this.$refs.BottomMenuRef.close();
                    $(".dom .btn .sub-btn").css("z-index", 1);
                    $(".work .btn .sub-btn").css("z-index", 1);
                }
            },
        },
    });
</script>
