
<style lang="scss" model>
    .hour-program-comp {
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
    .hour-program-comp {
        overflow: auto;
        height: 90vh;
        .title {
            font-size: var(--font-size-h1);
            color: var(--font-color-label);
            font-weight: bold;
            width: 100%;
            padding: 0 39px 0px 39px;
            margin: 30px auto;
            margin-bottom: 100px;
        }

        .cont {
            width: 90%;
            margin: auto;
                
            .types {
                display: flex;
                margin: 10px 0;
                position: relative;
                .dom, .work {
                    width: 100%;
                    text-align: center;
                    div {
                        width: 100%;
                        margin: auto;
                        color: var(--font-color-label);
                        .v-icon {
                            font-size: 106px;
                            color: var(--gray-icon-color);
                        }
                        &.type {
                            text-align: center;
                            color: var(--font-color-label);
                            margin: 10px auto;
                        }
                        &.btn {
                            margin: 20px auto;
                            padding: 0 10px;
                            height: 150px;
                            .sub-btn {
                                position: relative;
                                z-index: 5;
                                cursor: pointer;
                                display: grid;
                                align-content: center;
                                background-color: var(--white-bg-color);
                                height: 150px;
                                width: auto;
                                border-radius: 16px;
                                font-size: 2.5em;
                                box-shadow: var(--box-shadow-card);
                            }
                        }
                    }

                }
            }
        }

        .hour-edit {
            margin: 20px auto;
            margin-bottom: 80px;
            font-size: 16px;
            text-align: center;
            width: 90%;
            color: #1E90FF;
            font-weight: bold;
            cursor: pointer;
            padding: 0 20px;
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

    <div class="hour-program-comp">
        <div
            class="title text-center"
        >Indiquez vos horaires</div>

        <div class="cont">
            <div
                class="types"
            >
                <div class="dom">
                    <div><v-icon>mdi-sofa-single</v-icon></div>
                    <div class="type">Domicile</div>
                    <div 
                        class="btn"
                        @click="selectHour('dom')"
                    >
                        <div class="sub-btn">
                            {{ hour.domicile }}
                        </div>
                    </div>
                </div>

                <div class="work">
                    <div><v-icon>mdi-briefcase-variant</v-icon></div>
                    <div class="type">Travail</div>
                    <div 
                        class="btn"
                        @click="selectHour('work')" 
                    >
                        <div class="sub-btn">
                            {{ hour.work }}
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div
            class="hour-edit"
            @click="hourEdit()"
        >
            Vous ne partez pas aux mêmes horaires chaque jour ?
        </div>
        
        <div class="cont">
            <v-btn
                class="text-none"
                rounded="xl" 
                size="x-large"
                variant="outlined"
                block
                @click="$emit('hour-valided')"
            >Continuer</v-btn>
        </div>

        
    </div>

    <!-- time -->
    <BottomMenu
        mode="time"
        :class-name="['time-dom']"
        :labelSelectorN1="labelSelectorTime"
        :time-init="timeDomInit"       
        ref="BottomMenuRefDom"
        v-on:close="overlay = false"
        v-on:time-changed="getTimeChanged()"
        v-on:time-valided="getSelectedRef()"
    />

    <BottomMenu
        mode="time"
        :class-name="['time-work']"
        :labelSelectorN1="labelSelectorTime"
        :time-init="timeWorkInit"       
        ref="BottomMenuRefWork"
        v-on:close="overlay = false"
        v-on:time-changed="getTimeChanged()"
        v-on:time-valided="getSelectedRef()"
    />
   
</template>



<!--  -->
<script>
    import $ from 'jquery';
    import { defineComponent } from 'vue';
    import { mapState } from 'vuex';


    // Components
    import BottomMenu from '../menus/BottomMenu.vue';

    export default defineComponent({
        name: 'hour-program-comp',
        emits: ['hour-valided'],
        computed: {
            ...mapState(["trajets"]),
        },
        components: {
            BottomMenu,
        },
        props: {
            
        },
        data() {
            return {
                overlay: false,
                labelSelectorTime: "Heure",
                modeHour: "dom",
                hour: {
                    "domicile":"07:00",
                    "work":"17:00",
                },
                timeDomInit: {
                    hourInit: 7,
                    minuteInit: 0,
                },
                timeWorkInit: {
                    hourInit: 17,
                    minuteInit: 0,
                },
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
                this.modeHour = type;
                if( ! this.overlay ){
                    if( type == "dom" ){
                        $(".dom .btn .sub-btn").css("z-index", 15);
                        this.labelSelectorTime = "Heure de départ du domicile";
                        this.overlay = this.$refs.BottomMenuRefDom.open();
                    }
                    else{
                        $(".work .btn .sub-btn").css("z-index", 15);
                        this.labelSelectorTime = "Heure de départ du travail";
                        this.overlay = this.$refs.BottomMenuRefWork.open();
                    }
                    
                }
            },
            getTimeChanged(){
                if( this.$refs.BottomMenuRef ){
                    if( this.modeHour == 'dom' ){
                        this.hour.domicile = this.$refs.BottomMenuRefDom.time;
                    }
                    else {
                        this.hour.work = this.$refs.BottomMenuRefWork.time;
                    }
                }
            },
            getSelectedRef(){
                if( this.modeHour == 'dom' ){
                    if( this.$refs.BottomMenuRefDom ){
                        console.log("time-getting-dom", this.$refs.BottomMenuRefDom.time);
                        this.hour.domicile = this.$refs.BottomMenuRefDom.time;
                        this.overlay = this.$refs.BottomMenuRefDom.close();
                    }
                }
                else{
                    if( this.$refs.BottomMenuRefWork ){
                        console.log("time-getting-work", this.$refs.BottomMenuRefWork.time);
                        this.hour.work = this.$refs.BottomMenuRefWork.time;
                        this.overlay = this.$refs.BottomMenuRefWork.close();
                    }
                }
            },
        },
        watch: {
            overlay(){
                if( ! this.overlay ){
                    this.$refs.BottomMenuRefDom.close();
                    this.$refs.BottomMenuRefWork.close();
                    $(".dom .btn .sub-btn").css("z-index", 1);
                    $(".work .btn .sub-btn").css("z-index", 1);
                }
            },
        },
    });
</script>
