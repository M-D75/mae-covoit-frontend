<!-- scss -->
<!-- scss -->
<style lang="scss" model>
    

    .inf-comp {
        .blc-btn {
            div.label {
                width: 100% !important;
                font-size: 20px !important;
                text-align: center !important;
                text-transform: uppercase !important;
                font-weight: 450 !important;
            }
        }
    }
</style>

<style lang="scss" scoped>

    @import "@/styles/mixins.scss";

    .ligth-mode * {
        --border-color: white;
        --bg-color: #f5f5f5;
    }
    .dark-mode * {
        --border-color: #333333;
        --bg-color: #292929;
    }

    /* ? */
    .inf-comp {
        border-radius: 24px;
        border: solid var(--border-color) 10px;
        // margin-top: 30px;
        margin-bottom: 15px;
        background-color: var(--white-bg-color);
        width: 82.7%;
        @include respond-to('small') {
            width: 90%;
        }
        
        height: 94px;
        .blc-btn {
            border-radius: 15px;
            height: 100%;
            display: flex;
            align-items: center;
            background-color: var(--bg-color);
            div {
                
                width: 33%;
                text-align: center;
                &.btn {
                    cursor: pointer;
                    i.mdi-moon-waning-crescent {
                        transform: rotate(-30deg);
                    }
                }
                .text-subtitle{
                    margin-top: 5px;
                    text-transform: uppercase;
                    text-align: center;
                    width: 100%;
                    color: var(--font-color-label);
                    font-size: 12px;
                    font-weight: bold;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                .label {
                    color: var(--font-color-label);
                }
                .v-icon {
                    color: var(--font-color-label);
                    
                }
            }
        }
    }

</style>
   
<!--  -->
<template>

    <!-- ? -->
    <div
        class="inf-comp mx-auto"
    >
        <div
            class="blc-btn"
        >
            <div 
                v-for="(info, index) in infos_panneau"
                :key="index"
                :class="{btn : info.btn}"
                @click="choiceFunctionBtnInfo(info.text)"
            >
                <div v-if="info.label && ! info.icon" class="label text-body-2">{{ info.label }}</div>
                <v-icon 
                    v-if="info.icon"
                >
                    {{info.icon}}
                </v-icon>
                <div class="text-subtitle">{{info.text}}</div>
            </div>
        </div>
    </div>

</template>



<!--  -->
<script>
    import { defineComponent } from 'vue';
    import $ from 'jquery'
    import { mapMutations, mapState } from 'vuex';

    // Components
    // ...

    export default defineComponent({
        name: 'info-comp',
        emits: ["history", "switch-theme-color"],
        computed: {
            ...mapState("profil", ['modeDriver', 'darkMode', "blockChangingTheme"]),
        },
        components: {
        },
        props: {
            modeEdit: {
                type:Boolean,
                default:true,
            },
            infos_panneau: {
                type:Array,
                default: () => [
                    {
                        btn:true,
                        icon:"mdi-history",
                        text:"historique",
                    },
                    {
                        btn:false,
                        icon:"mdi-car",
                        text:"chauffeur",
                    },
                    {
                        btn:true,
                        icon:"mdi-lightbulb-on",
                        text:"mode",
                    },
                ]
            },
        },
        data() {
            return {
                //mdi-seat-passenger
            }
        },
        methods: {
            ...mapMutations("profil", ["SET_DARKMODE", "SET_MODE_DRIVER", "SET_BLOCK_CHANGING_THEME"]),
            choiceFunctionBtnInfo(name){
                switch (name.toLowerCase()) {
                    case 'mode':
                        if(!this.blockChangingTheme){
                            this.$emit("switch-theme-color");
                            this.SET_BLOCK_CHANGING_THEME(true)
                            if(!this.darkMode){
                                setTimeout(function(){
                                    this.ligthToDarkness();
                                }.bind(this), 300)

                                setTimeout(function(){

                                    this.SET_BLOCK_CHANGING_THEME(false)
                                }.bind(this), 700)
                            }
                            else{
                                this.ligthToDarkness();
                                setTimeout(function(){ 
                                    this.SET_BLOCK_CHANGING_THEME(false)
                                }.bind(this), 700)
                            }
                        }
                            
                        break;
                    case 'historique':
                        this.history();
                        break;
                    case 'chauffeur':
                        this.SET_MODE_DRIVER( ! this.modeDriver );
                        break;
                    case 'passager':
                        this.SET_MODE_DRIVER( ! this.modeDriver );
                        break;
                    default:
                        console.log(`Sorry, we are out of ${name}.`);
                }
            },
            history(){
                console.log("text2")
                this.$emit('history');
            },
            ligthToDarkness(){
                if( $("#app .v-application").hasClass("ligth-mode") ){
                    $("#app .v-application").removeClass("ligth-mode");
                    $("#app .v-application").addClass("dark-mode");
                    $(".conti.mask").addClass("display")
                    this.SET_DARKMODE(true);
                    localStorage.setItem("mae-covoit-darkMode", true);
                }
                else{
                    $("#app .v-application").addClass("ligth-mode");
                    $("#app .v-application").removeClass("dark-mode");
                    this.SET_DARKMODE(false);
                    localStorage.setItem("mae-covoit-darkMode", false);
                }

                // if(  ! $(".conti.mask").hasClass("display") ){
                //     // $("#app .v-application").removeClass("ligth-mode");
                //     // $("#app .v-application").addClass("dark-mode");
                //     $(".conti.mask").addClass("display")
                //     this.$store.state.darkMode = true;
                // }
                // else{
                //     // $("#app .v-application").addClass("ligth-mode");
                //     // $("#app .v-application").removeClass("dark-mode");
                //     $(".conti.mask").removeClass("display");
                //     $(".conti.mask").removeClass("mask");
                //     $(".conti.dark-mode").addClass("mask");
                //     this.$store.state.darkMode = false;
                // }
            }
        }
    });
</script>
