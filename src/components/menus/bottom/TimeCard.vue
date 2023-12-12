
<style lang="scss" model>
    @import url('https://fonts.cdnfonts.com/css/modern-lcd-7');
    @import url('https://fonts.cdnfonts.com/css/digital-dismay');
    @import url('https://fonts.cdnfonts.com/css/ww-digital');
    @import url('https://fonts.cdnfonts.com/css/7segments');
    @import url('https://fonts.googleapis.com/css2?family=Roboto+Mono');
    
    .ligth-mode * {
        --bg-mask: rgba(255, 255, 255, 0.77);
    }

    .dark-mode * {
        --bg-mask: rgba(53, 53, 53, 0.77);
    }

    div.hour-list {  
        div {
            span {
                display: none;
            }
        }
    }

</style>

<!-- scss -->
<style lang="scss" scoped>
    .v-card {
        background-color: var(--white-bg-color);
        color: var(--font-color-label);
        border-radius: 10px !important;
        margin-top: 20px;
        width: 70%;
        box-shadow: var(--box-shadow-card);
        > div.time {
            position: relative;
            display: flex;
            overflow: hidden;
            height: 300px;
            font-size: 4.5em;
            font-weight: 700;
            user-select: none;
            div.hour-list {
                width: 100%;
                overflow-y: scroll;
                font-weight: 305;
                height: 300px;
                margin: 0 auto;
                .sub-hour{
                    height: 2400px;
                    overflow: hidden;
                    div {
                        margin: 0 auto;
                        font-family: 'Roboto Mono', 'WW Digital', 'Digital Dismay', 'Helvetica', sans-serif;
                        height: 100px;
                        max-height: 100px;
                        min-height: 100px;
                        position: relative;
                        text-align: right;
                        display: block;
                        // border: 1px dotted black;
                        span {
                            display: none;
                            display: inline-block;
                            opacity: 0.5;
                            //transform: perspective(100px) translateZ(-30px);
                            font-family: 'Roboto Mono', 'WW Digital', 'Digital Dismay', 'Helvetica', sans-serif;
                            max-height: 100px;
                            will-change: transform;
                            // border: 2px solid black;
                        }
                    }
                }
            }

            div.sep-time {
                text-align: center;
                line-height: 1.37;
                width: 25%;
                z-index: 51;
                .sub {
                    position: relative;
                    top: 50%;
                    transform: translateY(-50%);
                    height: 90%;
                    margin: auto;
                    .v-divider {
                        position: absolute;
                        height: 100%;
                    }
                }
            }

            div.minute-list {
                overflow-y: scroll;
                width: 100%;
                font-weight: 305;
                height: 300px;
                margin: 0 auto;
                .sub-minute{
                    overflow: hidden;
                    div {
                        font-family: 'Roboto Mono', 'WW Digital', 'Digital Dismay', 'Helvetica', sans-serif;
                        height: 100px;
                        max-height: 100px;
                        min-height: 100px;
                        // position: relative;
                        text-align: center;
                        span {
                            display: inline-block;
                            opacity: 0.5;
                            //transform: perspective(100px) translateZ(-30px);
                            font-family: 'Roboto Mono', 'WW Digital', 'Digital Dismay', 'Helvetica', sans-serif;
                            max-height: 100px;
                            will-change: transform;
                        }
                    }
                }
            }
        }
    }

</style>
   
<!--  -->
<template>
    <v-card
        class="mx-auto rounded"
        max-width="500"
    >
        <div
            class="time"
            :class="className.join(' ')"
        >
            <div class="hour-list mx-auto scrollable-container" :class="className.join(' ')">
                <div class="sub-hour">
                    <div 
                        v-for="heure in hourValue" 
                        :key="heure"
                        :class="'h-'+heure+' hour'"
                    ><span>{{ heure.replaceAll("0", "O") }}</span></div>
                </div>
            </div>

            <div class="sep-time mx-auto">
                <div class="sub">
                    <v-divider :thickness="2" color="black" vertical></v-divider>
                </div>
            </div>

            <div class="minute-list mx-auto scrollable-container" :class="className.join(' ')" @scroll="handleScroll">
                <div class="sub-minute" :style="`height: ${(minuteLength)*100}px`" >
                    <div 
                        v-for="minute in minutesValue" 
                        :key="minute"
                        :class="'m-'+minute+' minutes'"
                    ><span>{{ minute.replaceAll("0", "O") }}</span></div>
                </div>
            </div>
        </div>
    </v-card>
</template>



<!--  -->
<script>
    import { defineComponent } from 'vue';
    import $ from 'jquery';

    import { Plugins } from '@capacitor/core';

    const { Vibration } = Plugins;

    // Components
    //...

    export default defineComponent({
        name: 'time-card-comp',
        emits: ["time-changed"],
        computed: {
            hourValue(){
                return this.heures;
            },
            minutesValue(){
                return this.minutes;
            },
        },
        props: {
            hourInit: {
                type: Number,
                default: 0,
            },
            minuteInit: {
                type: Number,
                default: 0,
            },
            nbPasMinutes:{
                type: Number,
                default: 5,
            },
            className: {
                type: Array,
                default: () => ([]),
            },
        },
        data() {
            return {
                heures: Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}`),
                minutes: Array.from({ length: 60/this.nbPasMinutes }, (_, i) => `${(i*this.nbPasMinutes).toString().padStart(2, '0')}`),
                rollingMinutes: [],
                active: false,
                hourCanTaked: true,
                minuteCanTaked: true,
                in_minutes_ev: false,
                in_hour_ev: false,
                minuteLength: 0,
                minAnime: false,
                scrollPosition: 0,
            }
        },
        mounted(){
            this.$nextTick(function(){
                this.minuteLength = this.minutes.length;

                var vue = this;

                console.log("Minutes Init is :", this.minuteInit);
                const middleIndexMinutes = (this.minutes.length/2);

                // const currentIndexMinutes = (Math.ceil(Math.abs($(".scrollable-container.minute-list").scrollTop())/100));
                // const currentIndexHours = (Math.ceil(Math.abs($(".scrollable-container.hour-list").scrollTop())/100));
                //30,00,12,5,12

                const prefixClassMinute = `.scrollable-container.minute-list${vue.className.length != 0 ? "." + vue.className.join(".") : ""}`;

                // if(this.minuteInit > 0){
                //     this.minutes = this.shiftLeftMulti(this.minutes, ((this.minuteInit)/this.nbPasMinutes)-1);
                // }
                // else{
                //     this.minutes = this.shiftRightMulti(this.minutes, ((this.minuteInit)/this.nbPasMinutes)+1);
                // }

                const initScroll = 600;
                setTimeout(function() {
                    vue.minuteCanTaked = false;
                    console.log("can-init", false, initScroll);
                    const currentIndexMinutes = (Math.ceil(Math.abs(initScroll-50)/100));
                    const val = (currentIndexMinutes*100);
                    
                    //console.log("Haven't scrolled in 250ms!", val, currentIndexMinutes);
                    $(prefixClassMinute).animate({scrollTop: val}, 180, function(){
                        
                        console.log("currentIndexMinutes", middleIndexMinutes, currentIndexMinutes)
                        if( middleIndexMinutes > currentIndexMinutes ){
                            console.log("rigth", middleIndexMinutes-currentIndexMinutes)
                            vue.minutes = vue.shiftRightMulti(vue.minutes, Math.abs(middleIndexMinutes-currentIndexMinutes));
                            // vue.minutes = vue.shiftRightMulti(vue.minutes, 1);
                        }
                        else if(middleIndexMinutes < currentIndexMinutes){
                            console.log("left", middleIndexMinutes-currentIndexMinutes)
                            vue.minutes = vue.shiftLeftMulti(vue.minutes, Math.abs(middleIndexMinutes-currentIndexMinutes));
                        }
                        // $(`${prefixClassMinute} .m-${minuteC.toString().padStart(2, '0')} span`).css("opacity", 1);
                        console.log("Mminute:", vue.minutes[middleIndexMinutes+1]);
                        vue.minuteCanTaked = true;
                        console.log("can-takkkkk", true);
                        vue.minAnime = false;
                    });
   
                }, 190);

                //console.log("prefixClassMinute", prefixClassMinute);
                $(`${prefixClassMinute} .m-${this.minuteInit.toString().padStart(2, '0')} span`).css("opacity", 1);
                $(`${prefixClassMinute} .m-${this.minuteInit.toString().padStart(2, '0')} span`).css("transform", `perspective(100px) translateZ(0px)`);
                    
                var lastOffset = $(prefixClassMinute).scrollTop().toFixed(0);
                var lastDate = new Date().getTime();

                
                console.log("lastOffset:", lastOffset)
                
                this.in_minutes_ev = false;
                var slow = true;
                this.minAnime = false;
                console.log("El", $(prefixClassMinute));
                $(prefixClassMinute).on("scroll", function(e){
                    vue.in_minutes_ev = true;
                    const _this = $(this);
                    // console.log("change----")

                    const currentScrollTop = e.target.scrollTop;
                    var delayInMs = e.timeStamp - lastDate;
                    var offset = currentScrollTop - lastOffset;
                    var speedInpxPerMs = offset / delayInMs;

                    //console.log("scroll", currentScrollTop, lastOffset, offset);

                    lastDate = e.timeStamp;
                    lastOffset = currentScrollTop;

                    var currentIndexMinutes = (Math.ceil(Math.abs(currentScrollTop-50)/100));

                    // const minuteBB = vue.minutes[middleIndexMinutes-1];
                    const minuteB = vue.minutes[middleIndexMinutes+0];
                    const minuteC = vue.minutes[middleIndexMinutes+1];
                    const minuteA = vue.minutes[middleIndexMinutes+2];
                    // const minuteAA = vue.minutes[middleIndexMinutes+3];

                    const ecart = ((vue.minutes.length/2)*100) - currentScrollTop;

                    // console.log("miniiii-----", minuteB, minuteC, minuteA, ecart, ecart/100, (100-ecart)/100, offset, delayInMs, minuteB.toString().padStart(2, '0'), minuteA.toString().padStart(2, '0'));
                    
                    // const ecartDegree = Math.abs(ecart) <= 30 ? Math.abs(ecart) : 30;

                    
                    if(vue.minuteCanTaked){
                        if( middleIndexMinutes > currentIndexMinutes ){
                            vue.minutes = vue.shiftRightMulti(vue.minutes, Math.abs(middleIndexMinutes-currentIndexMinutes));
                            vue.$emit("time-changed");
                            vue.vibratePhone();
                        }
                        else if( middleIndexMinutes < currentIndexMinutes ){
                            vue.minutes = vue.shiftLeftMulti(vue.minutes, Math.abs(middleIndexMinutes-currentIndexMinutes));
                            vue.$emit("time-changed");
                            vue.vibratePhone();
                        }
                        else{
                            // if(ecart >= 0){
                            //     // $(`.scrollable-container.minute-list${vue.className.length != 0 ? "." + vue.className.join(".") : ""} .h-${hourBB.toString().padStart(2, '0')} span`).css("transform", `perspective(100px) translateZ(-30px)`);
                            //     $(`${prefixClassMinute} .m-${minuteB.toString().padStart(2, '0') } span`).css("transform", `perspective(100px) translateZ(-${Math.abs(30-ecartDegree)}px)`);
                            // }

                            // $(`${prefixClassMinute} .m-${minuteC.toString().padStart(2, '0') } span`).css("transform", `perspective(100px) translateZ(0px)`);

                            // if(ecart < 0){
                            //     $(`${prefixClassMinute} .m-${minuteA.toString().padStart(2, '0') } span`).css("transform", `perspective(100px) translateZ(-${Math.abs(30-ecartDegree)}px)`);
                            //     $(`${prefixClassMinute} .m-${minuteAA.toString().padStart(2, '0')} span`).css("transform", `perspective(100px) translateZ(-30px))`);
                            // }
                            // $(`.m-${minuteAA.toString().padStart(2, '0')}`).css("transform", `rotateX(33deg)`);


                            // opacity
                            $(`${prefixClassMinute} .m-${minuteB.toString().padStart(2, '0')} span`).css("opacity", 0.3);
                            $(`${prefixClassMinute} .m-${minuteC.toString().padStart(2, '0')} span`).css("opacity", 1-Math.abs(ecart/100));
                            $(`${prefixClassMinute} .m-${minuteA.toString().padStart(2, '0')} span`).css("opacity", 0.3);
                        }
                        
                        if ( slow && Math.abs(speedInpxPerMs) >= 0.50 ) {
                            slow = false;
                        }
                        
                        if( ! slow && 0.01 <= Math.abs(speedInpxPerMs) && Math.abs(speedInpxPerMs) <= 0.05 && vue.minutes.length > 1 ){
                            slow = true;
                        }

                        // Animation replace
                        clearTimeout($.data(this, `scrollTimer${prefixClassMinute}`));
                        $.data(this, `scrollTimer${prefixClassMinute}`, setTimeout(function() {
                            vue.minuteCanTaked = false;
                            console.log("can-taked", false, currentScrollTop);
                            // const currentIndexMinutes = (Math.ceil(Math.abs(currentScrollTop-50)/100));
                            const val = (currentIndexMinutes*100);
                            
                            //console.log("Haven't scrolled in 250ms!", val, currentIndexMinutes);
                            if( ! vue.minAnime  ){
                                vue.minAnime = true;
                                _this.animate({scrollTop: val}, 180, function(){
                                    
                                    console.log("currentIndexMinutes", middleIndexMinutes, currentIndexMinutes)
                                    if( middleIndexMinutes > currentIndexMinutes ){
                                        console.log("rigth", middleIndexMinutes-currentIndexMinutes)
                                        vue.minutes = vue.shiftRightMulti(vue.minutes, Math.abs(middleIndexMinutes-currentIndexMinutes));
                                        // vue.minutes = vue.shiftRightMulti(vue.minutes, 5);
                                    }
                                    else if(middleIndexMinutes <= currentIndexMinutes){
                                        console.log("left", middleIndexMinutes-currentIndexMinutes)
                                        vue.minutes = vue.shiftLeftMulti(vue.minutes, Math.abs(middleIndexMinutes-currentIndexMinutes));
                                    }
                                    $(`${prefixClassMinute} .m-${minuteC.toString().padStart(2, '0')} span`).css("opacity", 1);
                                    console.log("Mminute:", vue.minutes[middleIndexMinutes+1]);
                                    vue.minuteCanTaked = true;
                                    console.log("can-takkkkk", true);
                                    vue.minAnime = false;
                                });
                            }
                            else{
                                vue.minuteCanTaked = true;
                            }
                        }, 190));
                    }
                    else {
                        // if(ecart >= 0){
                        //     // $(`.scrollable-container.minute-list${vue.className.length != 0 ? "." + vue.className.join(".") : ""} .h-${hourBB.toString().padStart(2, '0')} span`).css("transform", `perspective(100px) translateZ(-30px)`);
                        //     $(`${prefixClassMinute} .m-${minuteB.toString().padStart(2, '0') } span`).css("transform", `perspective(100px) translateZ(-${Math.abs(30-ecartDegree)}px)`);
                        // }

                        // $(`${prefixClassMinute} .m-${minuteC.toString().padStart(2, '0') } span`).css("transform", `perspective(100px) translateZ(0px)`);

                        // if(ecart < 0){
                        //     $(`${prefixClassMinute} .m-${minuteA.toString().padStart(2, '0') } span`).css("transform", `perspective(100px) translateZ(-${Math.abs(30-ecartDegree)}px)`);
                        //     $(`${prefixClassMinute} .m-${minuteAA.toString().padStart(2, '0')} span`).css("transform", `perspective(100px) translateZ(-30px))`);
                        // }
                    }
                    //console.log(e.y, $(this).scrollTop(), e.timeStamp)
                });

                
                //--------------------------------------------------------------------
                //Hour
                console.log("Hour Init is :", this.hourInit);
                const middleIndexHours = (this.heures.length/2);
                if(this.hourInit > 0){
                    this.heures = this.shiftLeftMulti(this.heures, this.hourInit-1);
                }
                else{
                    this.heures = this.shiftRightMulti(this.heures, this.hourInit+1);
                }

                const prefixClassHour = `.scrollable-container.hour-list${vue.className.length != 0 ? "." + vue.className.join(".") : ""}`;

                // Init opacity currrent hour
                $(`${prefixClassHour} .h-${this.hourInit.toString().padStart(2, '0')} span`).css("opacity", 1);
                // $(`${prefixClassHour} .h-${this.hourInit.toString().padStart(2, '0')} span`).css("transform", `perspective(100px) translateZ(0px)`);

                var lastOffsetH = $(`.scrollable-container${this.className.length != 0 ? "." + this.className.join(".") : ""}`).scrollTop();
                var lastDateH = new Date().getTime();
                var scrollmax = 0;
                
                $(prefixClassHour).on("scroll", function(e){
                    vue.in_hour_ev = true;
                    const _this = $(this);
                    
                    var delayInMs = e.timeStamp - lastDateH;
                    var offset = e.target.scrollTop - lastOffsetH;
                    var speedInpxPerMs = offset / delayInMs;

                    lastDateH = e.timeStamp;
                    lastOffsetH = e.target.scrollTop;

                    if(e.target.scrollTopMax != scrollmax){
                        console.log("scrollMax:", e.target.scrollTopMax);
                        scrollmax = e.target.scrollTopMax;
                    }

                    const currentIndexHours = (Math.ceil(Math.abs(_this.scrollTop()-50)/100));
                    // const val = (currentIndexHours*100);
                    // console.log("moving-info: ", 
                    //     "val:", val, 
                    //     "_this.scrollTop():", _this.scrollTop(), 
                    //     "currentIndexHours:", currentIndexHours, 
                    //     "Math.abs(middleIndexHours-currentIndexHours):", Math.abs(middleIndexHours-currentIndexHours), 
                    //     "_this:", _this);
                    
                    // const hourBB = vue.heures[middleIndexHours-1];
                    const hourB = vue.heures[middleIndexHours+0];
                    const hourC = vue.heures[middleIndexHours+1];
                    const hourA = vue.heures[middleIndexHours+2];
                    // const hourAA = vue.heures[middleIndexHours+3];

                    const ecart = ((vue.heures.length/2)*100) - (_this.scrollTop());

                    // console.log("infos", 
                    //     "hourBB:", hourBB, 
                    //     "hourB:", hourB, 
                    //     "hourC:", hourC, 
                    //     "hourA:", hourA, 
                    //     "hourAA:", hourAA, 
                    //     "ecart:", ecart, ecart/100, (100-ecart)/100, 
                    //     "offset:", offset, 
                    //     "delayInMs:", delayInMs, hourB.toString().padStart(2, '0'), hourA.toString().padStart(2, '0'));

                    // const ecartDegree = Math.abs(ecart) <= 30 ? Math.abs(ecart) : 30;
                    // console.log("ecart", ecart, ecartDegree);

                    if(vue.hourCanTaked){
                        //console.log("FAST", val, currentIndexHours);
                        if( middleIndexHours > currentIndexHours ){
                            console.log("rigth===+++", middleIndexHours-currentIndexHours);
                            vue.heures = vue.shiftRightMulti(vue.heures.slice(), Math.abs(middleIndexHours-currentIndexHours));
                            vue.$emit("time-changed");
                            vue.vibratePhone();
                        }
                        else if( middleIndexHours < currentIndexHours ){
                            console.log("left===---", middleIndexHours-currentIndexHours)
                            vue.heures = vue.shiftLeftMulti(vue.heures.slice(), Math.abs(middleIndexHours-currentIndexHours));
                            vue.$emit("time-changed");
                            vue.vibratePhone();
                        }
                        else{
                            // rotate
                            
                            // if(ecart >= 0){
                            //     // $(`${prefixClassHour} .h-${hourBB.toString().padStart(2, '0')} span`).css("transform", `perspective(100px) translateZ(-30px)`);
                            //     $(`${prefixClassHour} .h-${hourB.toString().padStart(2, '0') } span`).css("transform", `perspective(100px) translateZ(-${Math.abs(30-ecartDegree)}px)`);
                            // }

                            // $(`${prefixClassHour} .h-${hourC.toString().padStart(2, '0') } span`).css("transform", `perspective(100px) translateZ(0px)`);

                            // if(ecart < 0){
                            //     $(`${prefixClassHour} .h-${hourA.toString().padStart(2, '0') } span`).css("transform", `perspective(100px) translateZ(-${Math.abs(30-ecartDegree)}px)`);
                            //     $(`${prefixClassHour} .h-${hourAA.toString().padStart(2, '0')} span`).css("transform", `perspective(100px) translateZ(-30px))`);
                            // }
                            
                            // opacity
                            $(`${prefixClassHour} .h-${hourB.toString().padStart(2, '0')} span`).css("opacity", 0.3);
                            $(`${prefixClassHour} .h-${hourC.toString().padStart(2, '0')} span`).css("opacity", 1-Math.abs(ecart/100));
                            $(`${prefixClassHour} .h-${hourA.toString().padStart(2, '0')} span`).css("opacity", 0.3);
                        }
                        
                        if ( slow && Math.abs(speedInpxPerMs) >= 0.50 ) {
                            slow = false;
                        }
                        
                        if( ! slow && 0.01 <= Math.abs(speedInpxPerMs) && Math.abs(speedInpxPerMs) <= 0.05 && vue.heures.length > 1 ){
                            slow = true;
                        }


                        // Animation replace
                        clearTimeout($.data(this, 'scrollTimer'));
                        $.data(this, 'scrollTimer', setTimeout(function() {
                            
                            vue.hourCanTaked = false;
                            const currentIndexHours = (Math.ceil(Math.abs(_this.scrollTop()-50)/100));
                            const val = (currentIndexHours*100);
                            
                            _this.animate({scrollTop: val}, 180, function(){
                                //console.log("currentIndexHours", middleIndexHours, currentIndexHours)
                                if( middleIndexHours > currentIndexHours ){
                                    //console.log("rigth", middleIndexHours-currentIndexHours)
                                    vue.heures = vue.shiftRightMulti(vue.heures, Math.abs(middleIndexHours-currentIndexHours));
                                }
                                else{
                                    //console.log("left", middleIndexHours-currentIndexHours)
                                    vue.heures = vue.shiftLeftMulti(vue.heures, Math.abs(middleIndexHours-currentIndexHours));
                                }
                                $(`${prefixClassHour} .h-${hourC.toString().padStart(2, '0')} span`).css("opacity", 1);
                                console.log("Hhour:", vue.heures[middleIndexHours+1]);
                                vue.hourCanTaked = true;
                            });
                        }, 190));
                    }
                    else {
                        // if(ecart >= 0){
                        //     // $(`${prefixClassHour} .h-${hourBB.toString().padStart(2, '0')} span`).css("transform", `perspective(100px) translateZ(-30px)`);
                        //     $(`${prefixClassHour} .h-${hourB.toString().padStart(2, '0') } span`).css("transform", `perspective(100px) translateZ(-${Math.abs(30-ecartDegree)}px)`);
                        // }

                        // $(`${prefixClassHour} .h-${hourC.toString().padStart(2, '0') } span`).css("transform", `perspective(100px) translateZ(0px)`);

                        // if(ecart < 0){
                        //     $(`${prefixClassHour} .h-${hourA.toString().padStart(2, '0') } span`).css("transform", `perspective(100px) translateZ(-${Math.abs(30-ecartDegree)}px)`);
                        //     $(`${prefixClassHour} .h-${hourAA.toString().padStart(2, '0')} span`).css("transform", `perspective(100px) translateZ(-30px))`);
                        // }
                    }
                });
            });
        },
        methods: {
            handleScroll(event) {
                // Vous pouvez accéder aux propriétés de défilement de l'événement
                this.scrollPosition = event.target.scrollTop.toFixed(3);
                // console.log("Scrooooollll:", this.scrollPosition, event.target.scrollTop);
            },
            shiftRight(arr) {
                
                if (arr.length === 0) {
                    return arr;
                }
                
                let copy_arr = arr.slice();
                console.log("r:", this.minutes, copy_arr);
                let lastElement = copy_arr.pop();
                copy_arr.unshift(lastElement);
                return copy_arr;
            },
            shiftLeft(arr) {
                if (arr.length === 0) {
                    return arr;
                }

                let copy_arr = arr.slice();
                console.log("l:", this.minutes, copy_arr);
                let firstElement = copy_arr.shift();
                copy_arr.push(firstElement);
                return copy_arr;
            },
            shiftRightMulti(arr, nb){
                console.log("shiftRightMulti rigth", nb, arr.length);
                let copy_arr = arr.slice();
                for (let index = 0; index < nb; index++) {
                    copy_arr = this.shiftRight(copy_arr);
                }
                return copy_arr;
            },
            shiftLeftMulti(arr, nb){
                console.log("shiftLeftMulti Left", nb, arr.length);
                let copy_arr = arr.slice();
                for (let index = 0; index < nb; index++) {
                    copy_arr = this.shiftLeft(copy_arr);
                }
                return copy_arr;
            },
            getTime(){
                const middleIndexHours = (this.heures.length/2)+1;
                const middleIndexMinutes = (this.minutes.length/2)+1;
                return `${(this.in_hour_ev ? this.heures[middleIndexHours] : this.heures[1])}:${(this.in_minutes_ev ?  this.minutes[middleIndexMinutes] : this.minutes[1])}`;
            },
            vibratePhone() {
                if (navigator.vibrate) {
                    navigator.vibrate(1);
                } 
                else {
                    console.log("L'API Vibration PWA n'est pas prise en charge sur cet appareil.");
                }

                if(Vibration){
                    Vibration.vibrate({duration: 1});
                }
                else {
                    console.log("L'API Vibration Android n'est pas prise en charge sur cet appareil.");
                }
            },
        },
        watch: {
        }
    });
</script>
