

<style lang="scss" model>
    .v-container {
        .sub-cont {
            position: relative;
            .btn-close {
                color: var(--font-color-label);
                background-color: var(--bg-app-color);
            }
            .vc-calendar-pi {
                box-shadow: none;
                border: none;
                display: grid;
                margin: 25% auto;
            }
        }
    }
</style>


<style lang="scss" scoped>
    .closed {
        visibility: collapse;
        z-index: 0;
        pointer-events: none;
    }

    .v-container {
        position: fixed;
        padding: 0;
        padding-top: var(--safe-top);
        background-color: var(--bg-app-color);
        width: 100%;
        max-width: 100%;
        height: 100vh;
        z-index: 9999;
        .sub-cont {
            height: 90%;
            &.scrolling {
                overflow: scroll;
            }
            &.not-scroll{
                overflow: hidden;
            }
            .title {
                font-size: var(--font-size-h1);
                font-weight: bold;
                width: 100%;
                margin: 25px auto;
                color: var(--font-color-label);
            }
        }
    }

    // .bg-white {
    //     background-color: white;
    // }

</style>

<template>

    <!--  -->
    <v-container
        class="pan-get-value" 
    >
        <div class="sub-cont" :class="mode=='date' ? 'scrolling' : 'not-scroll'">
            
            <v-btn
                v-if="mode=='date'"
                class="btn-close"
                icon="mdi-close"
                style="position: absolute; left: 0; top: 0;"
                @click="$emit('close')"
            />

            <div
                v-if="mode=='date'"
                class="title text-center"
            >
                Quand partez vous ?
            </div>

            <VDatePickerIo
                v-if="mode=='date'"
                transparent 
                borderless
                mode="date"
                class="vc-calendar-pi" 
                v-model="date" 
                is-required
                expanded 
                :min-date="new Date()"
                :rows="5"
                :is-dark="darkMode"
            />

            <Search 
                v-if="mode=='depart'"
                ref="SearchRef"
                title="D'ou partez vous ?"
                label="Saisissez un village"
                :focus="true"
                :items="villagesSortedFiltered"
                :history="communesHistory"
                @selected="getSelected()" 
                @saisi="getSaisi()"
            />

            <Search 
                v-if="mode=='arriver'"
                ref="SearchRef"
                title="Où allez vous ?"
                label="Saisissez un village"
                :focus="true"
                :items="villagesSortedFiltered"
                :history="communesHistory"
                @selected="getSelected()" 
                @saisi="getSaisi()"
            />
        </div>

    </v-container>
</template>


<!-- vuejs -->
<script>
    import { defineComponent } from 'vue';
    import { mapMutations, mapState, mapGetters, mapActions } from 'vuex';
    import $ from 'jquery';

    import { useScreens } from 'vue-screen-utils';
    import { Capacitor } from '@capacitor/core';

    const isIOS = Capacitor.getPlatform() === 'ios';

    //Component
    import Search from '../publish/Search.vue';
    
    export default defineComponent({
        name: 'pan-get-value-comp',
        emits: ["close", "date-selected"],
        computed: {
            ...mapState("profil", ['darkMode']),
            ...mapGetters("search", ['historiqueTrie']),
            ...mapState("search", ['villages', 'communesHistory', 'depart', 'destination']),
            ...mapMutations("search", ["SET_DEPART"]),
            villagesSortedFiltered(){
                if( this.saisi == "" || this.saisi == null ){
                    return this.communesHistory.filter((commune) => (commune != this.depart && commune != this.destination)).slice(0, 3);
                }
                else {
                    return this.villages.filter(
                            (dataVillage) => this.saisi != dataVillage.village 
                            && dataVillage.village.toLowerCase().replaceAll("'", "").includes(this.saisi.toLocaleLowerCase().replaceAll("'", "")) 
                            && dataVillage.village != this.depart 
                            && dataVillage.village != this.destination
                        )
                        .map((dataVillage) => dataVillage.village)
                        .sort((a, b) => {
                            if( isIOS )
                                return this.matchValue(a.replaceAll("'", ""), this.saisi) - this.matchValue(b.replaceAll("'", ""), this.saisi);
                            else
                                return this.matchValue(b.replaceAll("'", ""), this.saisi) - this.matchValue(a.replaceAll("'", ""), this.saisi);
                        });
                }
            },
        },
        components: {
            Search,
        },
        props: {
            openP: {
                type: Boolean,
                default: () => false,
            },
            mode: {
                type: String,
                default: "depart",
            },
        },
        data() {
            return {
                sizeScreen: 0,
                saisi: "",
                date: null,
                columns: null,
                expanded: false,
                opened: false,
            }
        },
        created() {
            this.chargerHistorique();
        },
        mounted() {
            this.sizeScreen = $(window).innerHeight();            
            $(".pan-get-value").css("top", `${this.sizeScreen}px`);
            $(".pan-get-value").addClass("closed");

            //Init calendar
            const { mapCurrent } = useScreens({
                xs: '0px',
                sm: '640px',
                md: '768px',
                lg: '1024px',
            });
            this.columns = mapCurrent({ lg: 2 }, 1);
            this.expanded = mapCurrent({ lg: false }, true);

            const date = new Date();

            let day = date.getDate();
            let month = date.getMonth() + 1;
            let year = date.getFullYear();

            this.date = new Date(`${month}/${day}/${year}`);

        },
        methods: {
            ...mapActions("search", ['ajouterAuHistorique', 'sauvegarderHistorique', 'chargerHistorique']),
            open(){
                console.log("bar-hei-", this.barHeight);
                $(".pan-get-value").removeClass("closed");
                const vue = this;
                switch (this.mode) {
                    case "depart":
                        this.$store.commit("search/SET_DEPART", "");                     
                        break;
                    case "arriver":
                        this.$store.commit("search/SET_DESTINATION", "");
                        break;
                    default:
                        break;
                }

                if(this.$refs.SearchRef){
                    this.$refs.SearchRef.saisi = "";
                }
                this.saisi = "";
                $(".pan-get-value").animate({top: `0px`}, 'fast', 
                                function(){
                                    $(this).css("top", `0px`);
                                    vue.opened = true;
                                }
                            );
                
            },
            close(){
                const vue = this;
                $(".pan-get-value").animate({top: `${this.sizeScreen}px`}, "fast", function(){
                    $(this).addClass("closed");
                    $(".pan-get-value").css("top", `${this.sizeScreen}px`);
                    vue.opened = false;
                });

                if( this.date == null ){
                    const date = new Date();

                    let day = date.getDate();
                    let month = date.getMonth() + 1;
                    let year = date.getFullYear();

                    this.date = new Date(`${month}/${day}/${year}`);
                }
            },
            getDate(){
                return this.date;
            },
            getSaisi(){
                if(this.$refs.SearchRef){
                    this.saisi = this.$refs.SearchRef.saisi;
                }
            },
            getSelected(){
                if ( this.mode == "depart" ) {
                    this.$store.commit("search/SET_DEPART", this.$refs.SearchRef.saisi);
                    this.ajouterAuHistorique(this.$refs.SearchRef.saisi);
                    this.sauvegarderHistorique();
                    this.saisi = "";
                    this.$emit("close");
                }
                else if(this.mode == "arriver") {
                    this.$store.commit("search/SET_DESTINATION", this.$refs.SearchRef.saisi);
                    this.ajouterAuHistorique(this.$refs.SearchRef.saisi);
                    this.sauvegarderHistorique();
                    this.$emit("close");
                }
            },
            matchValue(str, query) {
                const index = str.indexOf(query);
                if (index === -1) return Infinity;
                return index;
            },
        },
        watch: {
            openP(){
                console.log("openP:", this.openP)
                if(this.openP){
                    this.open();
                }
                else{
                    this.close();
                }
            },
            date(){
                if( this.opened ){
                    if( this.openP && this.date != null ){
                        this.$emit("date-selected");
                    }
                    else if(this.openP && this.date == null){
                        // this.opened = false;
                        // const date = new Date();

                        // let day = date.getDate();
                        // let month = date.getMonth() + 1;
                        // let year = date.getFullYear();

                        // this.date = new Date(`${month}/${day}/${year}`);
                        this.$emit("close");
                    }
                }
            },
            
        }
   });
</script>
