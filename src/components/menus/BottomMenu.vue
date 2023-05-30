


<style lang="scss" scoped>
    //Animations
    /* The animation code */
    @keyframes warn-false {
        from {background-color: #FF4949;}
        to {background-color: var(--blue-color);}
    }

    @keyframes warn-true {
        from {background-color: var(--blue-color);}
        to {background-color: #FF4949;}
    }

    // global
    .label {
        font-size: 16px;
    }

    .sub-label-color {
        border-radius: 20px;
        background-color: var(--blue-color);
        color: white;
        text-transform: uppercase;
        text-align: center;
        font-weight: bold;
        width: 80%;
        margin: auto;
        animation-name: warn-false;
        animation-duration: 1s;
        &.warning {
            background-color: #FF4949;
            animation-name: warn-true;
            animation-duration: 1s;
        }
    }

    // struct
    .draggable{
        position: absolute;
        width: 100%;
        &.dragging, &.active {
            border: none;
        }
    }

    .v-container.bottom-menu {
        position: fixed;
        padding: 16px 0;
        bottom: 0;
        border-radius: 30px 30px 0 0;
        background-color: var(--white-bg-color);
        color: var(--font-color-label);
        width: 100%;
        max-width: 100%;
        .sub-cont {
            .bar-up {
                cursor: pointer;
                margin: auto;
                margin-top: 5px;
                width: 14.6%;
                border: 2px solid gray;
                border-radius: 10px;
                z-index: 999;
            }
            .bar-up-t {
                cursor: pointer;
                margin: auto;
                margin-top: 5px;
                width: 15%;
                height: 50px;
                border: 2px solid transparent;
                border-radius: 10px;
                z-index: 999;
            }


            .select-time, .select-number {
                width: 85%;
                .label {
                    margin: 15px;
                    margin-top: 50px;
                }

                .v-btn {
                    margin: 30px auto;
                }
            }

            .select-day-hour-domicile{
                width: 85%;
                .label {
                    margin: 35px;
                }

                
                .day-contain {
                    margin: auto;
                    display: flex;
                    width: 100%;
                    justify-content: space-around;
                    .day{
                        cursor: pointer;
                        display: grid;
                        align-content: center;
                        text-align: center;
                        width: 41px;
                        height: 41px;
                        background-color: gray;
                        border-radius: 100px;
                        text-transform: uppercase;
                        color: white;
                        font-weight: bold;
                        font-size: 16px;
                        &.selected {
                            background-color: var(--blue-color);
                        }
                    }
                }

                .v-btn {
                    margin: 30px auto;
                    font-weight: bold;
                }
            }
        }
    }
</style>

<template>

    <vue3-draggable-resizable
        class-name="draggable"
        v-model:x="x"
        v-model:y="y"
        :axis="'y'"
        v-model:active="active"
        :draggable="true"
        :resizable="false"
        :disabledX="true"
        :disabledY="disabledY"
        :disabledW="true"
        :disabledH="true"
        @dragging="onDrag"
        @drag-end="onDragStop"
    >
        <div class="bar-up-t"></div>
    </vue3-draggable-resizable>

    <!--  -->
    <v-container
        class="bottom-menu"
    >
        <div class="sub-cont">
            <div class="bar-up"></div>
            <TrajetMember v-if="!notif && reserve" :infos="infos"/>
            <ReservePlace v-if="!notif && reserve" v-on:test-notif-success="notif = !notif"/>
            <GroupListCardsHistory v-if="!notif && !reserve && mode=='history' "/>
            
            <div
                v-if="mode=='time'"
                class="select-time mx-auto"
            >
                <div class="label text-center">{{ labelSelectorN1 }}</div>
                <TimeCard />
                <v-btn 
                    class="text-none"
                    rounded="xl" 
                    size="x-large"
                    variant="outlined"
                    block
                    @click="emit('time-valided')"
                >Valider</v-btn>
            </div>

            <div
                v-if="mode=='nb-passenger'"
                class="select-number mx-auto"
            >
                <div class="label text-center">{{ labelSelectorN1 }}</div>
                <SelectNumber min="1" max="4" />
                <v-btn 
                    class="text-none"
                    rounded="xl" 
                    size="x-large"
                    variant="outlined"
                    block
                    @click="emit('time-valided')"
                >Valider</v-btn>
            </div>

            <!--  -->
            <div
                v-if="mode=='select-day-hour-domicile'"
                class="select-day-hour-domicile mx-auto"
            >
                <div class="label text-center" >{{ labelSelectorN1 }}</div>
                <div class="day-contain">
                    <div
                        v-for="(day, index) in daysSelected"
                        :key="index"
                        class="day"
                        :class="{selected: day.selected}"
                        @click="selectDay(index)"
                    >{{ day.day }}</div>
                </div>
                <div class="label text-center">{{ labelSelectorN2 }}</div>
                <TimeCard />
                
                <v-btn 
                    class="text-none"
                    rounded="xl" 
                    size="x-large"
                    variant="outlined"
                    block
                    @click="emit('time-valided')"
                >Valider</v-btn>
            </div>


            <!-- price -->
            <div
                v-if="mode=='select-price'"
                class="select-number mx-auto"
            >
                <div class="label text-center">{{ labelSelectorN1 }}</div>
                <div class="sub-label-color" :class="{warning: warn}">prix recommandé : 2 à 3 €</div>
                <SelectNumber ref="SelectNumberRef" icon="mdi-currency-eur" min="1" max="8" v-on:number-changed="selectNumber()" />
                <v-btn 
                    class="text-none"
                    rounded="xl" 
                    size="x-large"
                    variant="outlined"
                    block
                    @click="emit('time-valided')"
                >Valider</v-btn>
            </div>
        </div>

        <!-- Notif -->
        <Notification :message="'Votre commande a été comfirmer par le chauffeur !'" v-if="notif" />
    </v-container>
</template>


<!--  -->
<script>
    import { defineComponent } from 'vue';
    import $ from 'jquery';

    // Components
    import Vue3DraggableResizable from 'vue3-draggable-resizable';
    import TrajetMember from '@/components/search/TrajetMember.vue';
    import ReservePlace from '@/components/menus/bottom/ReservePlace.vue';
    import Notification from '@/components/menus/bottom/Notification.vue';
    import GroupListCardsHistory from '@/components/menus/bottom/GroupListCardsHistory.vue';
    import TimeCard from './bottom/TimeCard.vue';
    import SelectNumber from './bottom/SelectNumber.vue';
   

    export default defineComponent({
        name: 'bottom-menu',
        components: {
            Vue3DraggableResizable,
            TrajetMember,
            ReservePlace,
            Notification,
            GroupListCardsHistory,
            TimeCard,
            SelectNumber,
        },
        props: {
            mode: {
                type: String,
                default: "history",
            },
            labelSelectorN1: {
                type: String,
                default: "LABEL-SELECTOR",
            },
            labelSelectorN2: {
                type: String,
                default: "LABEL-SELECTOR-2",
            },
            infos: {
                type: Object,
                default() {
                    return {
                            "depart": "Tsingoni",
                            "destination": "Mamoudzou",
                            "hour_start": "4:50",
                            "hour_end": "6:55",
                            "price": 4,
                            "name": "Ledou",
                            "passenger_number": 2
                        };
                },
            },
        },
        data() {
            return {
                x: 0,
                y: 0,
                notif: false,
                reserve: false,
                active: false,
                disabledY: false,
                sizeScreen: 0,
                move: false,
                marge_bar: 30,
                subContHeigth: 0,
                open_b: false,
                daysSelected: [
                    {day: "L", selected: true},
                    {day: "M", selected: true},
                    {day: "M", selected: true},
                    {day: "J", selected: true},
                    {day: "V", selected: true},
                    {day: "S", selected: false},
                    {day: "D", selected: false},
                ],
                warn: false,
            }
        },
        mounted() {
            this.sizeScreen = parseInt($("body").css("height").replace("px", ""));
            this.y = this.sizeScreen;
            
            $(".bottom-menu").css("top", `${this.y}px`);
            this.subContHeigth = parseInt($(".sub-cont").css("height").replace("px", ""));
            console.log(this.sizeScreen, this.subContHeigth);

            this.openMiddle();
        },
        methods: {
            onDrag(pos) {
                this.move = true;
                this.active = false;
                $(".bottom-menu").css("top", `${pos.y}px`);
                if (pos.y >= this.sizeScreen - this.marge_bar) {
                    this.close()
                }
            },
            onDragStop(pos) {
                if ( ! this.move ) {
                    if ( pos.y >= this.sizeScreen-this.marge_bar ) {
                        this.open();
                    }
                    else{
                        this.close();
                        
                        // test notif
                        if (this.notif) {
                            this.notif = !this.notif;
                        }
                    }

                    $(".bottom-menu").animate({"top": `${this.y}px`}, "fast");
                }
                else if ( this.move ) {
                    if ( pos.y >= this.sizeScreen - this.marge_bar ) {
                        this.disabledY = false;
                        this.y = this.sizeScreen - this.marge_bar;
                    }
                }

                console.log("moveY : ", pos.y);
                this.move = false;
            },
            open(){
                if ( ! this.open_b ) {
                    if ( this.y >= this.sizeScreen - this.marge_bar ) {

                        // open
                        this.disabledY = false;
                        this.y = this.sizeScreen - ( this.subContHeigth + 50 );
                        console.log("y", this.y);
                        $(".bottom-menu").animate({"top": `${this.y}px`}, "fast");
                        this.open_b = true;
                    }
                }

                return this.open_b;
            },
            openMiddle(){
                if ( ! this.open_b ) {
                    if ( this.y >= this.sizeScreen - this.marge_bar ) {

                        // open
                        this.disabledY = false;
                        this.y = this.sizeScreen/2;
                        console.log("y", this.y);
                        $(".bottom-menu").animate({"top": `${this.y}px`}, "fast");
                        this.open_b = true;
                    }
                }

                return this.open_b;
            },
            close(){
                this.y = this.sizeScreen; //-this.marge_bar;
                this.open_b = false;
                $(".bottom-menu").animate({"top": `${this.y}px`}, "fast");
                this.$emit('close');
            },
            selectDay(index) {
                this.daysSelected[index]["selected"] = !this.daysSelected[index]["selected"];
            },
            selectNumber(){
                console.log("number changed")
                if( this.$refs.SelectNumberRef ){
                    console.log("number changed 2")
                    if( this.mode == "select-price" ){
                        console.log("number changed 3")
                        if ( 3 < this.$refs.SelectNumberRef.number || this.$refs.SelectNumberRef.number < 2 ) {
                            this.warn = true;
                        }
                        else{
                            this.warn = false;
                        }
                    }
                }
            },
            emit(value){
                this.$emit(value)
            },
        },
        watch:{
            y(){
                $(".bottom-menu").css("top", `${this.y}px`);
            },
        }
   });
</script>
