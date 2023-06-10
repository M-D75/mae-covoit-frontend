
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
            z-index: 20;
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
            @click="itineraireValided()"
        >Quelle est votre route ?</div>

        <div 
            class="cont" 
            @click="itineraireValided()"
        >
            <div 
                class="over"
                @click="itineraireValided()"
            ></div>
            <iframe 
                @click="itineraireValided()"
                src="https://www.google.com/maps/embed?pb=!1m28!1m12!1m3!1d62247.9645979931!2d45.12841160868707!3d-12.811077447246229!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!4m13!3e6!4m5!1s0x220a139b9d42adeb%3A0x5fe36e6ae771dfb2!2sMamoudzou%2C%20Mayotte!3m2!1d-12.78064!2d45.232696399999995!4m5!1s0x220a0e804fac5abb%3A0x98b3aa548324265a!2sTsingoni%2C%20Mayotte!3m2!1d-12.790541099999999!2d45.1047941!5e0!3m2!1sfr!2sfr!4v1685893487317!5m2!1sfr!2sfr&z=0" 
                width="375"
                height="990"
                style="border:0;"
                allowfullscreen="" 
                loading="lazy" 
                referrerpolicy="no-referrer-when-downgrade">
            </iframe>
        </div>
    </div>
</template>



<!--  -->
<script>
    import $ from 'jquery';
    import { defineComponent } from 'vue';
    import { mapState } from 'vuex';


    // Components

    export default defineComponent({
        name: 'itineraire-comp',
        computed: {
            ...mapState(["trajets"]),
        },
        components: {
        },
        props: {
            
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
