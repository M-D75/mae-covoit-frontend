
<style lang="scss" model>
    .credit-card.card-contain {

        .bloc-saisi {
            background-color: var(--white-bg-color);
            border-radius: 10px;
            height: 56px;
            margin: 30px auto;
            box-shadow: var(--box-shadow-card);
            .v-text-field {
                .v-input__control {
                    .v-field {
                        .v-field__field{
                            background-color: var(--white-bg-color);
                            border-radius: 10px;
                            .v-field__input{
                                color: var(--font-color-label);
                            }
                        }
                    }
                }
            }
        }

        .num-credit-card {
            > div {
                .v-text-field {
                    .v-input__control {
                        .v-field {
                            .v-field__field{
                                .v-field__input{
                                    letter-spacing: 3px;
                                }
                            }
                        }
                    }
                }
            }
        }

        .date-cvc {
            > div {
                &.date {
                    .month, .year {
                        .v-text-field {
                            .v-input__control {
                                .v-field {
                                    .v-field__field{
                                        .v-field__input{
                                            letter-spacing: 3px;
                                        }
                                    }
                                }
                            }
                        }
                    }
                    .slash {
                        margin: auto 0;
                    }
                }
                &.cvc {
                    .v-text-field {
                        .v-input__control {
                            .v-field {
                                .v-field__field{
                                    .v-field__input{
                                        text-align: center;
                                        letter-spacing: 5px;
                                    }
                                }
                            }
                        }
                    }
                }
            }   
        }

        
    }

    .password {
        .contain-input{
            .v-text-field {
                .v-input__control {
                    box-shadow: var(--box-shadow-card);
                    .v-field.v-field--variant-solo{
                        border-radius: 20px !important;
                        overflow: hidden;
                    }
                    .v-field__field {
                        background-color: white;
                        .v-field__input {
                            text-align: center;
                        }
                    }
                }
            }
        }
    }


 


</style>

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

    .closed {
        visibility: collapse;
        z-index: 0;
        pointer-events: none;
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
        position: fixed;
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

            .select-day-hour-domicile, .select-day{
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


            //car
            div.card-contain{
                margin: auto;
                height: 85%;
                display: flex;
                flex-direction: column;
                justify-content: center;
                //margin-top: 20px;
                .v-card.car {
                    margin: 10px auto;
                    padding: 5px 20px;
                    width: 90%;
                    border-radius: 16px;
                    background-color: var(--white-bg-color);
                    box-shadow: var(--box-shadow-card);
                    .v-list {
                        overflow: visible;
                        height: 56px;
                        display: flex;
                        justify-content: space-between;
                        .icon-container {
                            margin: auto 0;
                            .v-icon {
                                display: grid;
                                margin: auto;
                                font-size: 2em;
                            }
                        }
                        .model {
                            max-width: 170px;
                            margin: auto 15px !important;
                            width: 65%;
                            overflow-x: auto;
                            .text{
                                width: fit-content;
                                text-transform: uppercase;
                                font-weight: bold;
                                font-size: 16px;
                                white-space: nowrap;
                                color: var(--font-color-label);
                            }
                        }
                        .v-btn {
                            margin: auto 0;
                            box-shadow: none;
                            font-size: 1.2em;
                            color: var(--gray-icon-color);
                            &.active {
                                color: var(--blue-color);
                            }
                        }
                    }
                }
            }

            //credit-card
            .credit-card.card-contain {
                width: 90%;
                .bloc-saisi {
                    &.name{
                        width: 100%;
                        margin-top: 0;
                    }
                }
                .num-credit-card {
                    width: 100%;
                    margin: auto;
                    margin-top: 30px;
                    display: flex;
                    justify-content: space-between;
                    > div {
                        width: 26%;
                    }
                }

                .date-cvc {
                    width: 100%;
                    margin: auto;
                    display: flex;
                    justify-content: space-between;
                    > div {
                        width: 40%;
                        margin: 30px 0;
                        &.date {
                            display: flex;
                            justify-content: center;
                            .month, .year {
                                width: 49%;
                            }
                            .slash {
                                margin: auto 0;
                                color: gray;
                            }
                        }
                    }
                    
                }
            }

            //password
            .password {
                padding: 0 40px;
                .label {
                    margin: 30px auto;
                    font-weight: bold;
                }
                .contain-input{
                    margin: 5px;
                    .label {
                        margin: 3px auto;
                        color: gray;
                        text-align: left;
                        font-size: 14px;
                    }
                    .v-text-field {
                        .v-input__control {
                            .v-field__field {
                                background-color: white;
                            }
                        }
                    }
                }
            }

            // map
            .map {
                width: 90%;
                margin: 10px auto;
                margin-bottom: 5px;
                .infos-route {
                    font-size: 25px;
                    font-weight: bold;
                    span.time {
                        color: rgb(0, 204, 0);
                    }
                    span.distance {
                        color: gray;
                        font-size: 17px;
                        font-weight: normal;
                    }
                }
                .infos-sup {
                    font-size: 13px;
                    color: gray;
                }
            }
        }

        .sub-cont-sup {
            //map
            .map {
                width: 90%;
                margin: 10px auto;
                margin-bottom: 5px;
                .v-card {
                    border-radius: 20px;
                    box-shadow: var(--box-shadow-card);
                    &.v-card--variant-elevated, .v-card--variant-flat{
                        background: inherit;
                    }
                    .v-list{
                        .v-list-subheader {
                            color: var(--font-color-label) !important;
                        }

                        .v-list-item {
                            .v-list-item-title {
                                color: var(--font-color-label) !important;
                            }
                            .v-icon {
                                color: var(--font-color-label);
                            }
                        }
                    }
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
        :class="className.join(' ')"
    >
        <div class="sub-cont" :class="className.join(' ')" ref="subCont">

            <div class="bar-up"></div>

            <!-- Map -->
            
            <div 
                v-if="mode=='map'"
                class="map"
            >
                <div class="infos-route">
                    <span class="time">{{ mapInfos.time }}</span> <span class="distance"> ({{ mapInfos.distance }})</span>
                </div>
                <div class="infos-sup" v-if="mapInfos.infosSup != ''">Le plus rapide selon l'etat actuel de la circulation</div>
            </div>

            <!-- End Map -->
        </div>

        <!-- sub-cont-sup -->
        <div class="sub-cont-sup">
            <!-- Map -->
            <div
                v-if="mode=='map'"
                class="map"
            >
                <v-card
                    class="mx-auto"
                >
                    <v-list density="compact">
                        <v-list-subheader>ITINERAIRE</v-list-subheader>
                        <!-- <v-divider></v-divider> -->

                        <!-- dep -->
                        <v-list-item
                            color="primary"
                        >
                            <template v-slot:prepend>
                                <v-icon icon="mdi-google-maps"></v-icon>
                            </template>

                            <v-list-item-title v-text="mapInfos.depart"></v-list-item-title>
                        </v-list-item>

                        <v-divider></v-divider>

                        <!-- destination -->
                        <v-list-item
                            color="primary"
                        >
                            <template v-slot:prepend>
                                <v-icon icon="mdi-crosshairs-gps"></v-icon>
                            </template>

                            <v-list-item-title v-text="mapInfos.destination"></v-list-item-title>
                        </v-list-item>
                    </v-list>
                </v-card>
            </div>
        </div>
    </v-container>

    <!-- message error -->
    <v-snackbar
        v-model="showSnackbarError"
        :timeout="4000"
        color="error"
        style="z-index: 99999;"
    >
        <v-icon icon="mdi-alert-circle"></v-icon> <span>{{ messageSnackbarError }}</span>
    </v-snackbar>


    <!-- message succes -->
    <v-snackbar
        v-model="showSnackbarSuccess"
        :timeout="4000"
        color="success"
        style="z-index: 99999;"
    >
        <v-icon icon="mdi-alert-circle"></v-icon> <span>{{ messageSnackbarSuccess }}</span>
    </v-snackbar>


</template>


<!--  -->
<script>
    import { defineComponent } from 'vue';
    import $ from 'jquery';
    //import supabase from '@/utils/supabaseClient';

    // Components
    import Vue3DraggableResizable from 'vue3-draggable-resizable';
    

    export default defineComponent({
        name: 'bottom-menu',
        emits: ["opened", "close"], // <--- add this line
        components: {
            Vue3DraggableResizable,
        },
        computed: {
            numericRule() {
                return (value) => /^\d*$/.test(value) || 'Veuillez entrer uniquement des chiffres';
            },
            numericMask() {
                return { regex: /^[0-9]*$/ };
            },
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
            className: {
                type: Array,
                default: () => ([]),
            },
            timeInit: {
                type: Object,
                default() {
                    return {
                            hourInit: 1,
                            minuteInit: 8,
                        };
                },
            },
            mapInfos: {
                type: Object,
                default() {
                    return {
                        time: "",
                        distance: "",
                        infosSup: "Le plus rapide selon l'etat actuel de la circulation",
                        depart: "Tsingoni",
                        destination: "Mamoudzou"
                    };
                },
            },
            about: {
                type: String,
                default: "discution",
            },
        },
        data() {
            return {
                numericValues: ['', '', '', '', '', '', ''],
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
                showSnackbarError: false,
                messageSnackbarError: "",
                showSnackbarSuccess: false,
                messageSnackbarSuccess: "",
            }
        },
        mounted() {

            this.sizeScreen = $(window).innerHeight();
            this.y = this.sizeScreen;
            
            const classBottomMenuNameJquery = this.className != "" && this.className != null ? `.bottom-menu.${this.className.join(".")}` : ".bottom-menu";
            $(classBottomMenuNameJquery).css("top", `${this.y}px`);
            const classSubContNameJquery = this.className != "" && this.className != null ? `.sub-cont.${this.className.join(".")}` : ".sub-cont";
            this.subContHeigth = $(classSubContNameJquery).outerHeight(true);

            console.log("classe-name", this.className, "screen-height", this.sizeScreen, "subContHeigth", this.subContHeigth, "object", $(classSubContNameJquery));
            if( this.mode=="select-day-hour-domicile" || this.mode=="notification" ){
                this.open();
            }
            else {
                $(classBottomMenuNameJquery).addClass("closed");
            }
            
            $("div.sub-label-color").addClass("warn-good-to-low");
            // if(this.mode=="password"){
            //     this.open();
            //     this.messageSnackbarError = "test";
            //     this.showSnackbarError = true;
            // }
        },
        methods: {
            onDrag(pos) {
                this.move = true;
                this.active = false;

                const classBottomMenuNameJquery = this.className != "" && this.className != null ? `.bottom-menu.${Object.keys(this.className).join(".")}` : ".bottom-menu";
                $(classBottomMenuNameJquery).css("top", `${pos.y}px`);
                if (pos.y >= this.sizeScreen - this.marge_bar) {
                    this.close();
                }
            },
            onDragStop(pos) {


                if ( ! this.move ) {
                    const classBottomMenuNameJquery = this.className != "" && this.className != null ? `.bottom-menu.${this.className.join(".")}` : ".bottom-menu";

                    if ( pos.y >= this.sizeScreen-this.marge_bar && !$(classBottomMenuNameJquery).hasClass("closed") ) {
                        this.open();
                    }
                    else if( ! $(classBottomMenuNameJquery).hasClass("closed") ){
                        console.log("onDragStop")
                        this.close();
                    }
                    
                    $(classBottomMenuNameJquery).animate({"top": `${this.y}px`}, "fast");
                }
                else if ( this.move ) {
                    if ( pos.y >= this.sizeScreen - this.marge_bar ) {
                        this.disabledY = false;
                        this.y = this.sizeScreen - this.marge_bar;
                    }
                }

                this.move = false;
            },
            open(){
                
                this.subContHeigth = this.$refs.subCont.clientHeight;
                
                console.log("open_b", this.open_b);
                if ( ! this.open_b ) {
                    if ( this.y >= this.sizeScreen - this.marge_bar ) {
                        if( ! this.move ){
                            console.log("will-open")
                            const classBottomMenuNameJquery = this.className != "" && this.className != null ? `.bottom-menu.${this.className.join(".")}` : ".bottom-menu";
                            $(classBottomMenuNameJquery).removeClass("closed");

                            // open
                            this.move = true;
                            this.disabledY = false;
                            this.y = this.sizeScreen - ( this.subContHeigth + 50 );
                            const _this = this;
                            
                           
                            $(classBottomMenuNameJquery).animate({"top": `${_this.y}px`}, "fast", function(){
                                // $(this).animate({"top": "auto"}, 1000);
                                _this.y = parseInt($(this).css("top").replace("px", ""));
                                _this.move = false;
                                _this.$emit('opened');
                            });

                            this.open_b = true;
                        }
                        else{
                            this.open_b = false;
                        }
                    }
                }

                return this.open_b;
            },
            openMiddle(){
                if ( ! this.open_b ) {
                    if ( this.y >= this.sizeScreen - this.marge_bar ) {
                        if( ! this.move ){
                            this.move = true;
                            // open
                            const _this = this;
                            this.disabledY = false;
                            this.y = this.sizeScreen/2;
                            const classBottomMenuNameJquery =  this.className != null && this.className.length != 0 ? `.bottom-menu.${this.className.join(".")}` : ".bottom-menu";
                            
                            $(classBottomMenuNameJquery).animate({"top": `${this.y}px`}, "fast", function(){
                                _this.open_b = true;
                                _this.move = false;
                                _this.$emit("opened");
                            });
                        }
                    }
                }

                return this.open_b;
            },
            close(){
                
                if( ! this.move && this.open_b ){
                    this.move = true;

                    this.y = this.sizeScreen;
                    
                    const _this = this;
                    const classBottomMenuNameJquery = this.className != "" && this.className != null ? `.bottom-menu.${this.className.join(".")}` : ".bottom-menu";
                    
                    $(classBottomMenuNameJquery).animate({"top": `${this.y}px`}, "fast", function(){
                        $(this).addClass("closed");
                        _this.move = false;

                        //reload if trajet reserved and closed
                        if( _this.mode == "reserve" && _this.notif ){
                            _this.$router.replace("/")
                        }
                        _this.$emit('close');
                    });

                    this.open_b = false;
                }

                return this.open_b;
            },
            emit(value){
                if( value == "time-valided" ){
                    if(this.$refs.TimeCardRef){
                        this.time = this.$refs.TimeCardRef.getTime();
                    }
                }
                else if( value == "time-changed" ){
                    this.time = this.$refs.TimeCardRef.getTime();
                    console.log("emit-time-changed", this.time)
                }
                else if( value == "select-price" ){
                    this.numberSelected = this.$refs.SelectNumberRef.number;
                }
                this.$emit(value)
            },
        },
        watch:{
            y(){
                const classBottomMenuNameJquery = this.className != "" && this.className != null ? `.bottom-menu.${this.className.join(".")}` : ".bottom-menu";
                $(classBottomMenuNameJquery).css("top", `${this.y}px`);
            },
        }
   });
</script>
