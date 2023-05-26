

<style lang="scss" model>
    .v-container {
        .sub-cont {
            .vc-calendar-pi {
                box-shadow: none;
                border: none;
            }
        }
    }
</style>


<style lang="scss" scoped>
    .v-container {
        position: absolute;
        padding: 0;
        background-color: white;
        width: 100%;
        max-width: 100%;
        height: 100%;
        z-index: 9999;
        .sub-cont {
            height: 100%;
            .title {
                font-size: var(--font-size-h1);
                font-weight: bold;
                width: 100%;
                margin: 25px auto;
            }
        }
    }

</style>

<template>

    <!--  -->
    <v-container
        class="pan-get-value"
    >
        <div class="sub-cont">
            <div
                v-if="mode=='date'"
                class="title text-center"
            >Quand partez vous ?</div>
            <VDatePicker 
                v-if="mode=='date'"
                class="vc-calendar-pi" 
                v-model="date" 
                :columns="columns"  
                :expanded="expanded" 
                :rows="3"
                :min-date="new Date()"
            />

            <Search 
                v-if="mode=='depart'"
                ref="SearchRef"
                title="D'ou partez vous ?"
                label="Saisissez une commune"
                :focus="true"
                :items="items"
                @selected="getSelected()" 
                @saisi="getSaisi()"
            />

            <Search 
                v-if="mode=='arriver'"
                ref="SearchRef"
                title="Où allez vous ?"
                label="Saisissez une commune"
                :focus="true"
                :items="items"
                @selected="getSelected()" 
                @saisi="getSaisi()"
            />
        </div>

    </v-container>
</template>


<!-- vuejs -->
<script>
    import { defineComponent } from 'vue';
    import { mapState } from 'vuex';
    import $ from 'jquery';

    import { useScreens } from 'vue-screen-utils';

    //Component
    import Search from '../publish/Search.vue';
    
    export default defineComponent({
        name: 'pan-get-value-comp',
        computed: {
            ...mapState(['communes']),
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
                startTrajet: "",
                endTrajet: "",
                saisi: "",
                date: null,
                columns: null,
                expanded: false,
                items: [],
                opened: false,
            }
        },
        mounted() {
            this.sizeScreen = parseInt($("body").css("height").replace("px", ""));
            
            console.log("sizeScreen:", this.sizeScreen);
            $(".pan-get-value").css("top", `${this.sizeScreen}px`)

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
            console.log("end-mouted")
        },
        methods: {
            open(){
                console.log("pane-open:")
                $(".pan-get-value").animate({top: "0px"}, 'fast')
                $(".pan-get-value").css("top", `0px`)
                console.log(this.date)
                if( this.date == null ){
                    const date = new Date();

                    let day = date.getDate();
                    let month = date.getMonth() + 1;
                    let year = date.getFullYear();

                    this.date = new Date(`${month}/${day}/${year}`);
                }
                this.opened = true;
            },
            close(){
                console.log("pane-close")
                $(".pan-get-value").animate({top: `${this.sizeScreen}px`}, "fast");
                $(".pan-get-value").css("top", `${this.sizeScreen}px`);
                this.opened = false;
            },
            getDate(){
                return this.date;
            },
            getSaisi(){
                console.log("getSaisi:", this.$refs.SearchRef.getSaisi())
                this.saisi = this.$refs.SearchRef.getSaisi();
                if( this.saisi == "" ) {
                    this.items = this.communes;
                    return;
                }

                this.items = this.communes.filter((commune) => this.saisi != commune && commune.toLowerCase().includes(this.saisi.toLocaleLowerCase()));
            },
            getSelected(){
                console.log("child-selected", this.startTrajet, this.endTrajet, this.mode)
                console.log("t:", this.$refs.SearchRef.getSaisi());
                
                if ( this.mode == "depart" ) {
                    this.startTrajet = this.$refs.SearchRef.getSaisi();
                    this.items = [];
                    this.saisi = "";
                    this.$emit("dep-selected");
                }
                else if(this.mode == "arriver") {
                    this.endTrajet = this.$refs.SearchRef.getSaisi();
                    this.$emit("dest-selected");
                }
            },
            getDep(){
                return this.startTrajet;
            },
            getDest(){
                return this.endTrajet;
            },
        },
        watch: {
            openP(){
                console.log("open--", this.openP)
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
                        this.$emit("close-calendar");
                    }
                }
            },
        }
   });
</script>
