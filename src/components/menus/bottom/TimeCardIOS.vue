
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
                    .repeat-block {
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
                    .repeat-block {
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
    }

</style>
   
<!--  -->
<template>
    <v-card
        class="mx-auto rounded"
        max-width="500"
    >
        <div
            class="time-ios"
            :class="className.join(' ')"
        >
            <div class="hour-list mx-auto scrollable-container" :class="className.join(' ')">
                <div class="sub-hour" :style="`height: ${(hourLength)*100}px`">
                    <div v-for="time in repeatTime"
                        :key="time"
                        class="repeat-block"
                    >
                        <div 
                            v-for="heure in hourValue" 
                            :key="heure"
                            :class="'h-'+heure+' hour'"
                        ><span>{{ heure.replaceAll("0", "O") }}</span></div>
                    </div>
                </div>
            </div>

            <div class="sep-time mx-auto">
                <div class="sub">
                    <v-divider :thickness="2" color="black" vertical></v-divider>
                </div>
            </div>

            <div class="minute-list mx-auto scrollable-container" :class="className.join(' ')">
                <div class="sub-minute" :style="`height: ${(minuteLength)*100}px`" >
                    <div v-for="time in repeatTime"
                        :key="time"
                        class="repeat-block"
                    >
                        <div 
                            v-for="minute in minutesValue" 
                            :key="minute"
                            :class="'m-'+minute+' minutes'"
                        ><span>{{ minute.replaceAll("0", "O") }}</span></div>
                    </div>
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
        name: 'time-card-ios-comp',
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
                minuteLength: 0,
                hourLength: 0,
                minAnime: false,
                scrollPosition: 0,
                repeatTime: 25,
            }
        },
        mounted(){
            this.$nextTick(function(){
                this.minuteLength = this.minutes.length * this.repeatTime;
                var vue = this;
                console.log("Minutes Init is :", this.minuteInit);
                const prefixClassMinute = `.scrollable-container.minute-list${vue.className.length != 0 ? "." + vue.className.join(".") : ""}`;

                let initScroll;
                if(this.minuteInit > 0){
                    initScroll = (((this.minuteInit)/this.nbPasMinutes)-1)*100;
                }
                else{
                    initScroll = (((this.minuteInit)/this.nbPasMinutes)+1)*100;
                }
                
                const currentIndexMinutes = (Math.ceil(Math.abs(initScroll-50)/100));
                const val = (vue.minutes.length * 100) * (Math.ceil(this.repeatTime/2)-1) + ( (currentIndexMinutes-1) * 100 );
                console.log("Init minute Index", currentIndexMinutes,  val);
                
                $(prefixClassMinute).animate({scrollTop: val}, 180, function(){
                    console.log("MinuteInitied:", vue.minutes[currentIndexMinutes+1]);
                });
   
                //console.log("prefixClassMinute", prefixClassMinute);
                $(`${prefixClassMinute} .m-${this.minuteInit.toString().padStart(2, '0')} span`).css("opacity", 1);
                $(`${prefixClassMinute} .m-${this.minuteInit.toString().padStart(2, '0')} span`).css("transform", `perspective(100px) translateZ(0px)`);
                    
                var lastOffset = $(prefixClassMinute).scrollTop().toFixed(0);
                var lastDate = new Date().getTime();

                var predIndexMinutes = currentIndexMinutes;
                
                var slow = true;
                this.minAnime = false;
                $(prefixClassMinute).on("scroll", function(e){
                    const _this = $(this);

                    const currentScrollTop = e.target.scrollTop;
                    var delayInMs = e.timeStamp - lastDate;
                    var offset = currentScrollTop - lastOffset;
                    var speedInpxPerMs = offset / delayInMs;

                    lastDate = e.timeStamp;
                    lastOffset = currentScrollTop;

                    var currentIndexMinutes = (Math.ceil(Math.abs(currentScrollTop-50)/100));

                    // const minuteBB = vue.minutes[(currentIndexMinutes-1)%vue.minutes.length];
                    const minuteB = vue.minutes[(currentIndexMinutes+0)%vue.minutes.length];
                    const minuteC = vue.minutes[(currentIndexMinutes+1)%vue.minutes.length];
                    const minuteA = vue.minutes[(currentIndexMinutes+2)%vue.minutes.length];
                    // const minuteAA = vue.minutes[(currentIndexMinutes+3)%vue.minutes.length];

                    const ecart = ((currentIndexMinutes%vue.minutes.length)*100) - (currentScrollTop%(vue.minutes.length*100));

                    // console.log("miniiii-----", minuteB, minuteC, minuteA, ecart, ecart/100, (100-ecart)/100, offset, delayInMs, minuteB.toString().padStart(2, '0'), minuteA.toString().padStart(2, '0'));
                    
                    // const ecartDegree = Math.abs(ecart) <= 30 ? Math.abs(ecart) : 30;
                    
                    if(vue.minuteCanTaked){
                        if( predIndexMinutes != currentIndexMinutes ){
                            predIndexMinutes = currentIndexMinutes;
                            vue.$emit("time-changed");
                            vue.vibratePhone();
                            
                        }

                        // if(ecart >= 0){
                        //     $(`${prefixClassMinute} .m-${minuteBB.toString().padStart(2, '0')} span`).css("transform", `perspective(100px) translateZ(-30px))`);
                        //     $(`${prefixClassMinute} .m-${minuteB.toString().padStart(2, '0') } span`).css("transform", `perspective(100px) translateZ(-${Math.abs(30-ecartDegree)}px)`);
                        // }

                        // $(`${prefixClassMinute} .m-${minuteC.toString().padStart(2, '0') } span`).css("transform", `perspective(100px) translateZ(0px)`);

                        // if(ecart < 0){
                        //     $(`${prefixClassMinute} .m-${minuteA.toString().padStart(2, '0') } span`).css("transform", `perspective(100px) translateZ(-${Math.abs(30-ecartDegree)}px)`);
                        //     $(`${prefixClassMinute} .m-${minuteAA.toString().padStart(2, '0')} span`).css("transform", `perspective(100px) translateZ(-30px))`);
                        // }
                        // $(`.m-${minuteAA.toString().padStart(2, '0')}`).css("transform", `rotateX(33deg)`);

                        $(`${prefixClassMinute} .m-${minuteB.toString().padStart(2, '0')} span`).css("opacity", 0.3);
                        $(`${prefixClassMinute} .m-${minuteC.toString().padStart(2, '0')} span`).css("opacity", 1-Math.abs(ecart/100));
                        $(`${prefixClassMinute} .m-${minuteA.toString().padStart(2, '0')} span`).css("opacity", 0.3);
                        
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
                            const val = (currentIndexMinutes*100);
                            
                            if( ! vue.minAnime  ){
                                vue.minAnime = true;
                                _this.animate({scrollTop: val}, 180, function(){
                                    
                                    console.log("currentIndexMinutes", predIndexMinutes, currentIndexMinutes)
                                    if( predIndexMinutes != currentIndexMinutes ){
                                        predIndexMinutes = currentIndexMinutes;
                                    }
                                    $(`${prefixClassMinute} .m-${minuteC.toString().padStart(2, '0')} span`).css("opacity", 1);
                                    console.log("Mminute:", vue.minutes[((currentIndexMinutes + 1 ) % vue.minutes.length)]);
                                    vue.minuteCanTaked = true;
                                    vue.minAnime = false;
                                });
                            }
                            else{
                                vue.minuteCanTaked = true;
                            }
                        }, 190));
                    }
                });

                
                //--------------------------------------------------------------------
                //Hour
                this.hourLength = this.heures.length * this.repeatTime;

                console.log("Hour Init is :", this.hourInit);
                initScroll;
                if(this.hourInit > 0){
                    initScroll = (this.hourInit)*100;
                }
                else{
                    initScroll = (this.hourInit+1)*100;
                }

                const prefixClassHour = `.scrollable-container.hour-list${vue.className.length != 0 ? "." + vue.className.join(".") : ""}`;

                const currentIndexHours = (Math.ceil(Math.abs(initScroll-50)/100));
                const valHour = (vue.heures.length * 100) * (Math.ceil(this.repeatTime/2)-1) + ( (currentIndexHours-1) * 100 );
                console.log("Init hour Index", currentIndexHours,  valHour);
                
                $(prefixClassHour).animate({scrollTop: valHour}, 180, function(){
                    console.log("HourInitied:", vue.heures[currentIndexHours+1]);
                });

                // Init opacity currrent hour
                $(`${prefixClassHour} .h-${this.hourInit.toString().padStart(2, '0')} span`).css("opacity", 1);
                // $(`${prefixClassHour} .h-${this.hourInit.toString().padStart(2, '0')} span`).css("transform", `perspective(100px) translateZ(0px)`);

                var predIndexHour = currentIndexHours;
                
                $(prefixClassHour).on("scroll", function(e){
                    const _this = $(this);

                    const currentScrollTop = e.target.scrollTop;
                    var currentIndexHours = (Math.ceil(Math.abs(currentScrollTop-50)/100));
                    
                    // const hourBB = vue.heures[middleIndexHours-1];
                    const hourB = vue.heures[(currentIndexHours+0)%vue.heures.length];
                    const hourC = vue.heures[(currentIndexHours+1)%vue.heures.length];
                    const hourA = vue.heures[(currentIndexHours+2)%vue.heures.length];
                    // const hourAA = vue.heures[middleIndexHours+3];

                    const ecart = ((currentIndexHours%vue.heures.length)*100) - (currentScrollTop%(vue.heures.length*100));

                    if(vue.hourCanTaked){
                        if( predIndexHour != currentIndexHours ){
                            predIndexHour = currentIndexHours;
                            vue.$emit("time-changed");
                            vue.vibratePhone();
                        }
                        
                        $(`${prefixClassHour} .h-${hourB.toString().padStart(2, '0')} span`).css("opacity", 0.3);
                        $(`${prefixClassHour} .h-${hourC.toString().padStart(2, '0')} span`).css("opacity", 1-Math.abs(ecart/100));
                        $(`${prefixClassHour} .h-${hourA.toString().padStart(2, '0')} span`).css("opacity", 0.3);
                    
                        // Animation replace
                        clearTimeout($.data(this, 'scrollTimer'));
                        $.data(this, 'scrollTimer', setTimeout(function() {
                            vue.hourCanTaked = false;
                            const val = (currentIndexHours*100);
                            
                            _this.animate({scrollTop: val}, 180, function(){
                                if( predIndexHour != currentIndexHours ){
                                    predIndexHour = currentIndexHours;
                                }
                                $(`${prefixClassHour} .h-${hourC.toString().padStart(2, '0')} span`).css("opacity", 1);
                                console.log("Hhour:", vue.heures[((currentIndexHours + 1 ) % vue.heures.length)]);
                                vue.hourCanTaked = true;
                            });
                        }, 190));
                    }
                });
            });
        },
        methods: {
            getTime(){
                // minute
                const prefixClassMinute = `.scrollable-container.minute-list${this.className.length != 0 ? "." + this.className.join(".") : ""}`;
                const currentScrollTop = $(prefixClassMinute).scrollTop();

                var currentIndexMinutes = (Math.ceil(Math.abs(currentScrollTop-50)/100));

                // hour
                const prefixClassHour = `.scrollable-container.hour-list${this.className.length != 0 ? "." + this.className.join(".") : ""}`;
                const currentScrollTopH = $(prefixClassHour).scrollTop();

                var currentIndexHours = (Math.ceil(Math.abs(currentScrollTopH-50)/100));
                
                return `${( this.heures[((currentIndexHours + 1 ) % this.heures.length)])}:${( this.minutes[((currentIndexMinutes + 1 ) % this.minutes.length)])}`;
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
                    console.log("L'API Vibration Android, IOS n'est pas prise en charge sur cet appareil.");
                }
            },
        },
        watch: {
        }
    });
</script>
