


<style lang="scss" scoped>
    //Animations
    /* The animation code */
    @keyframes warn-bad-to-good {
        from {background-color: #FF4949;}
        to {background-color: var(--blue-color);}
    }

    @keyframes warn-good-to-bad {
        from {background-color: var(--blue-color);}
        to {background-color: #FF4949;}
    }

    @keyframes warn-good-to-low {
        from {background-color: var(--blue-color);}
        to {background-color: #fa9801;}
    }

    @keyframes warn-low-to-good {
        from {background-color: #fa9801;}
        to {background-color: var(--blue-color);}
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
        &.warn-good-to-bad {
            background-color: #FF4949;
            animation-name: warn-good-to-bad;
            animation-duration: 1s;
        }
        &.warn-good-to-low {
            background-color: #fa9801;
            animation-name: warn-good-to-low;
            animation-duration: 1s;
        }
        &.warn-low-to-good {
            background-color: var(--blue-color);
            animation-name: warn-low-to-good;
            animation-duration: 1s;
        }
        &.warn-bad-to-good {
            background-color: var(--blue-color);
            animation-name: warn-bad-to-good;
            animation-duration: 1s;
        }
    }

    // struct
    .draggable{
        position: absolute;
        width: 100%;
        height: 50px;
        z-index: 99999;
        cursor: pointer;
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
            height: max-content;
            .bar-up {
                cursor: pointer;
                margin: auto;
                margin-top: 5px;
                width: 14.6%;
                border: 2px solid gray;
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
        :class="className"
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
    </vue3-draggable-resizable>

    <!--  -->
    <v-container
        class="bottom-menu"
        :class="Object.keys(className).join(' ')"
    >
        <div class="sub-cont" :class="Object.keys(className).join(' ')" ref="subCont">

            <div class="bar-up"></div>

            <!-- ** Results **
                **************
            -->
            <TrajetMember v-if="!notif && mode=='reserve'" :infos="infos"/>
            <ReservePlace v-if="!notif && mode=='reserve'" v-on:test-notif-success="notif = !notif"/>

            <Notification :message="'Votre commande a été comfirmé par le chauffeur !'" v-if="notif" />
            <!-- End Results -->

            <!-- ** Publish **
                **************
            -->
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

            <!-- select nb passenger -->
            <div
                v-if="mode=='nb-passenger'"
                class="select-number mx-auto"
            >
                <div class="label text-center">{{ labelSelectorN1 }}</div>
                <SelectNumber min="1" max="8" />
                <v-btn 
                    class="text-none"
                    rounded="xl" 
                    size="x-large"
                    variant="outlined"
                    block
                    @click="emit('time-valided')"
                >Valider</v-btn>
            </div>

            <!-- select day and hour -->
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
                <!-- <div class="sub-label-color" :class="{warning_yellow: warn=='low', warning_red: warn=='bad'}">prix recommandé : 2 à 3 €</div> -->
                <div class="sub-label-color">prix recommandé : 2 à 3 €</div>
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

            
            <Notification v-if="mode=='notification'" :message="'Votre trajet a bien été publé !'"  />
            <!-- End Publish -->

            <!-- ** Pofile ***
                **************
            -->
            <GroupListCardsHistory v-if="!notif && mode=='history'"/>

            <!-- Select credit to add -->
            <Notification 
                v-if="mode=='add-credit-notif'"
                :mode="mode"
                label-head="Souhaitez-vous déposer l'argent dans votre compte ?" 
                label-btn="Confirmer"
                icon="mdi-shield-alert"
                color="#ff9c00"
                v-on:add-credit-confirmed="emit('add-credit-notif')"
                />
            <div
                v-if="mode=='add-credit'"
                class="select-number mx-auto"
            >
                <div class="label text-center">{{ labelSelectorN1 }}</div>
                <SelectNumber min="1" max="200" icon="mdi-currency-eur" />
                <v-btn 
                    class="text-none"
                    rounded="xl" 
                    size="x-large"
                    variant="outlined"
                    block
                    @click="recharger()"
                >Recharger</v-btn>
            </div>
            <Notification 
                v-if="mode=='recharge-valided'"
                :mode="mode"
                message="Nous avons effectué la recharge sur votre compte. Elle sera disponible dans quelques instants." 
                />

            

            <!-- End Pofile -->
        </div>

        
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
            className: {
                type: String,
                default: "",
            },
        },
        data() {
            return {
                x: 0,
                y: 0,
                notif: false,
                active: true,
                disabledY: false,
                sizeScreen: 0,
                move: false,
                marge_bar: 30,
                subContHeigth: 0,
                open_b: false,
                priceRecomended: {
                    min: 2,
                    max: 3,
                },
                daysSelected: [
                    {day: "L", selected: true},
                    {day: "M", selected: true},
                    {day: "M", selected: true},
                    {day: "J", selected: true},
                    {day: "V", selected: true},
                    {day: "S", selected: false},
                    {day: "D", selected: false},
                ],
                warn: 'low',
            }
        },
        mounted() {

            this.sizeScreen = $(window).innerHeight();
            this.y = this.sizeScreen;
            
            const classBottomMenuNameJquery = this.className != "" && this.className != null ? `.bottom-menu.${Object.keys(this.className).join(".")}` : ".bottom-menu";
            $(classBottomMenuNameJquery).css("top", `${this.y}px`);
            //this.subContHeigth = parseInt($(".sub-cont").css("height").replace("px", ""));
            const classSubContNameJquery = this.className != "" && this.className != null ? `.sub-cont.${Object.keys(this.className).join(".")}` : ".sub-cont";
            this.subContHeigth = $(classSubContNameJquery).outerHeight(true);

            console.log("1:sub-cont-size by css px:", parseInt($(classSubContNameJquery).css("height").replace("px", "")));
            console.log("2:sub-cont-size outerHeight:", this.subContHeigth);
            if( this.$refs.subCont ){
                console.log("3:sub-cont-size refs.clientHeight:", this.$refs.subCont.clientHeight);
            }

            console.log("class-bot:", classBottomMenuNameJquery, classSubContNameJquery)
            //this.subContHeigth = this.$refs.subCont.clientHeight;
            console.log("screen", this.sizeScreen, this.subContHeigth);
            if( this.mode=="select-day-hour-domicile" || this.mode=="select-price" || this.mode=="notification" ){
                this.open();
            }
            
            $("div.sub-label-color").addClass("warn-good-to-low")
        },
        methods: {
            onDrag(pos) {
                this.move = true;
                this.active = false;

                const classBottomMenuNameJquery = this.className != "" && this.className != null ? `.bottom-menu.${Object.keys(this.className).join(".")}` : ".bottom-menu";
                $(classBottomMenuNameJquery).css("top", `${pos.y}px`);
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
                    
                    const classBottomMenuNameJquery = this.className != "" && this.className != null ? `.bottom-menu.${Object.keys(this.className).join(".")}` : ".bottom-menu";
                    
                    $(classBottomMenuNameJquery).animate({"top": `${this.y}px`}, "fast");
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
                const classSubContNameJquery = this.className != "" && this.className != null ? `.sub-cont.${Object.keys(this.className).join(".")}` : ".sub-cont";
                console.log("classSubContNameJquery", classSubContNameJquery, Object.keys(this.className).join("."))
                this.subContHeigth = this.$refs.subCont.clientHeight;
                console.log("open-subContHeiht", this.subContHeigth, $(classSubContNameJquery), $(classSubContNameJquery).clientHeight)
                if ( ! this.open_b ) {
                    if ( this.y >= this.sizeScreen - this.marge_bar ) {

                        // open
                        this.disabledY = false;
                        this.y = this.sizeScreen - ( this.subContHeigth + 50 );
                        const _this = this;
                        const classBottomMenuNameJquery = this.className != "" && this.className != null ? `.bottom-menu.${Object.keys(this.className).join(".")}` : ".bottom-menu";
                        $(classBottomMenuNameJquery).animate({"top": `${_this.y}px`}, "fast", function(){
                            $(this).animate({"top": "auto"}, 1000);
                            _this.y = parseInt($(this).css("top").replace("px", ""));
                            console.log("open == y", _this.y, _this.sizeScreen, _this.subContHeigth, ( _this.subContHeigth + 50 ));
                        });

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
                        const classBottomMenuNameJquery = this.className != "" && this.className != null ? `.bottom-menu.${Object.keys(this.className).join(".")}` : ".bottom-menu";
                        $(classBottomMenuNameJquery).animate({"top": `${this.y}px`}, "fast");
                        this.open_b = true;
                    }
                }

                return this.open_b;
            },
            close(){
                // console.log("close")
                this.y = this.sizeScreen; //-this.marge_bar;
                this.open_b = false;
                const classBottomMenuNameJquery = this.className != "" && this.className != null ? `.bottom-menu.${Object.keys(this.className).join(".")}` : ".bottom-menu";
                $(classBottomMenuNameJquery).animate({"top": `${this.y}px`}, "fast");
                this.$emit('close');
            },
            selectDay(index) {
                this.daysSelected[index]["selected"] = !this.daysSelected[index]["selected"];
            },
            selectNumber(){
                if( this.$refs.SelectNumberRef ){
                    if( this.mode == "select-price" ){
                        if( this.$refs.SelectNumberRef.number < this.priceRecomended.min ){
                            $("div.sub-label-color").removeClass("warn-bad-to-good");
                            $("div.sub-label-color").removeClass("warn-low-to-good");
                            $("div.sub-label-color").removeClass("warn-good-to-bad");

                            $("div.sub-label-color").addClass("warn-good-to-low")
                            this.warn = 'low';
                        }
                        else if ( this.$refs.SelectNumberRef.number > this.priceRecomended.max ) {
                            
                            $("div.sub-label-color").removeClass("warn-low-to-good");
                            $("div.sub-label-color").removeClass("warn-bad-to-good");
                            $("div.sub-label-color").removeClass("warn-good-to-low");

                            $("div.sub-label-color").addClass("warn-good-to-bad");
                            this.warn = 'bad';
                        }
                        else{
                            if( ! $("div.sub-label-color").hasClass("warn-low-to-good") && ! $("div.sub-label-color").hasClass("warn-bad-to-good") ){
                                if( this.warn == 'low' ){
                                    $("div.sub-label-color").removeClass("warn-good-to-low")
                                    $("div.sub-label-color").addClass("warn-low-to-good");
                                }
                                else if( this.warn == 'bad' ){
                                    $("div.sub-label-color").removeClass("warn-good-to-bad");
                                    $("div.sub-label-color").addClass("warn-bad-to-good");
                                }
                            }
                            this.warn = 'good';
                        }
                    }
                }
            },
            recharger(){
                // TODO : get value
                this.$emit("recharger")
            },
            emit(value){
                this.$emit(value)
            },
        },
        watch:{
            y(){
                const classBottomMenuNameJquery = this.className != "" && this.className != null ? `.bottom-menu.${Object.keys(this.className).join(".")}` : ".bottom-menu";
                $(classBottomMenuNameJquery).css("top", `${this.y}px`);
            },
        }
   });
</script>
