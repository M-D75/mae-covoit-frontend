
<style lang="scss" model>
    @import url('https://fonts.cdnfonts.com/css/modern-lcd-7');
    @import url('https://fonts.cdnfonts.com/css/digital-dismay');
    @import url('https://fonts.cdnfonts.com/css/ww-digital');
    @import url('https://fonts.cdnfonts.com/css/7segments');
    @import url('https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@400&display=swap');
    
    .ligth-mode * {
        --bg-mask: rgba(255, 255, 255, 0.77);
    }

    .dark-mode * {
        --bg-mask: rgba(53, 53, 53, 0.77);
    }

    .scrollable-container {
        cursor: pointer;
        overflow-y: scroll;
        scrollbar-width: thin;
        scrollbar-color: transparent transparent;
    }

    .scrollable-container::-webkit-scrollbar {
        width: 6px;
    }

    .scrollable-container::-webkit-scrollbar-track {
        background: transparent;
    }

    .scrollable-container::-webkit-scrollbar-thumb {
        background-color: transparent;
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

            .mask-top, .mask-bottom {
                height: 100px;
                width: 100%;
                background-color: var(--bg-mask);
                z-index: 50;
                pointer-events: none;
            }

            .mask-top {
                position: absolute;
                top: 0;
                left: 0;
            }

            div.hour-list {
                width: 100%;
                overflow-y: scroll;
                div {
                    font-family: 'Roboto Mono', 'WW Digital', 'Digital Dismay', 'Helvetica', sans-serif;
                    height: 100px;
                    position: relative;
                    text-align: right;
                }
            }

            div.sep-time {
                text-align: center;
                line-height: 1.37;
                width: 30%;
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
                div {
                    font-family: 'Roboto Mono', 'WW Digital', 'Digital Dismay', 'Helvetica', sans-serif;
                    height: 100px;
                    position: relative;
                    text-align: left;
                }
            }

            .mask-bottom {
                position: absolute;
                bottom: 0;
                left: 0;
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
            <div class="mask-top"></div>
            <div class="hour-list mx-auto scrollable-container" :class="className.join(' ')">
                <div 
                    v-for="heure in heures" 
                    :key="heure"
                    :id="'h-'+heure"
                    :class="'h-'+heure+' hour'"
                >{{ heure.replaceAll("0", "O") }}</div>
            </div>

            <div class="sep-time mx-auto">
                <div class="sub">
                    <v-divider :thickness="2" color="black" vertical></v-divider>
                </div>
            </div>

            <div class="minute-list mx-auto scrollable-container" :class="className.join(' ')">
                <div 
                    v-for="minute in minutes" 
                    :key="minute"
                    :id="'m-'+minute"
                    :class="'minutes'"
                >{{ minute.replaceAll("0", "O") }}</div>
            </div>
            <div class="mask-bottom"></div>
        </div>
    </v-card>
</template>



<!--  -->
<script>
    import { defineComponent } from 'vue';
    import $ from 'jquery';

    // Components
    //...

    export default defineComponent({
        name: 'time-card-comp',
        emits: ["time-changed"],
        computed: {
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
            }
        },
        mounted(){
            
            const middleIndexMinutes = (this.minutes.length/2);

            if(this.minuteInit < 0){
                this.minites = this.shiftLeftMulti(this.minites, ((60-this.minuteInit)/this.nbPasMinutes)-1);
            }
            else{
                this.minutes = this.shiftRightMulti(this.minutes, ((60-this.minuteInit)/this.nbPasMinutes)+1);
            }
                
            var lastOffset = $(`.scrollable-container${this.className.length != 0 ? "." + this.className.join(".") : ""}`).scrollTop();
            var lastDate = new Date().getTime();

            var vue = this;
            console.log("lastOffset:", lastOffset)

            var slow = true;
            $(`.scrollable-container.minute-list${this.className.length != 0 ? "." + this.className.join(".") : ""}`).on("scroll", function(e){
                const _this = $(this);
                console.log("change----")

                var delayInMs = e.timeStamp - lastDate;
                var offset = e.target.scrollTop - lastOffset;
                var speedInpxPerMs = offset / delayInMs;

                lastDate = e.timeStamp;
                lastOffset = e.target.scrollTop;

                const currentIndexMinutes = (Math.ceil(Math.abs(_this.scrollTop())/100));

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
                
                if ( slow && Math.abs(speedInpxPerMs) >= 0.50 ) {
                    slow = false;
                }
                
                if( ! slow && 0.01 <= Math.abs(speedInpxPerMs) && Math.abs(speedInpxPerMs) <= 0.05 && vue.minutes.length > 1 ){
                    slow = true;
                }

                clearTimeout($.data(this, 'scrollTimer'));
                $.data(this, 'scrollTimer', setTimeout(function() {
                    
                    const currentIndexMinutes = (Math.ceil(Math.abs(_this.scrollTop())/100));
                    const val = (currentIndexMinutes*100);
                    
                    //console.log("Haven't scrolled in 250ms!", val, currentIndexMinutes);
                    _this.animate({scrollTop: val}, 180, function(){
                        // console.log("currentIndexMinutes", middleIndexMinutes, currentIndexMinutes)
                        if( middleIndexMinutes > currentIndexMinutes ){
                            //console.log("rigth", middleIndexMinutes-currentIndexMinutes)
                            vue.minutes = vue.shiftRightMulti(vue.minutes, Math.abs(middleIndexMinutes-currentIndexMinutes));
                        }
                        else{
                            //console.log("left", middleIndexMinutes-currentIndexMinutes)
                            vue.minutes = vue.shiftLeftMulti(vue.minutes, Math.abs(middleIndexMinutes-currentIndexMinutes));
                        }
                        console.log("minute:", vue.minutes[middleIndexMinutes]);
                    });
                }, 190));

                //console.log(e.y, $(this).scrollTop(), e.timeStamp)
            });


            //Hour
            const middleIndexHours = (this.heures.length/2);
            if(this.hourInit > 0){
                this.heures = this.shiftLeftMulti(this.heures, this.hourInit-1);
            }
            else{
                this.heures = this.shiftRightMulti(this.heures, this.hourInit+1);
            }
            // setTimeout(function(){
            //     $(".scrollable-container.hour-list").scrollTop(100*(middleIndexHours-1));
            // }, 50);
            
            var lastOffsetH = $(`.scrollable-container${this.className.length != 0 ? "." + this.className.join(".") : ""}`).scrollTop();
            var lastDateH = new Date().getTime();

            $(`.scrollable-container.hour-list${this.className.length != 0 ? "." + this.className.join(".") : ""}`).on("scroll", function(e){
                const _this = $(this);
                
                

                var delayInMs = e.timeStamp - lastDateH;
                var offset = e.target.scrollTop - lastOffsetH;
                var speedInpxPerMs = offset / delayInMs;

                lastDateH = e.timeStamp;
                lastOffsetH = e.target.scrollTop;

                const currentIndexHours = (Math.ceil(Math.abs(_this.scrollTop())/100));
                // let val = (currentIndexHours*100);

                // console.log("h07: ", val, _this.scrollTop(), currentIndexHours, Math.abs(middleIndexHours-currentIndexHours));
                //const val = (currentIndexHours*100);
                
                //console.log("FAST", val, currentIndexHours);
                if( middleIndexHours > currentIndexHours ){
                    //console.log("rigth", middleIndexHours-currentIndexHours)
                    vue.heures = vue.shiftRightMulti(vue.heures, Math.abs(middleIndexHours-currentIndexHours));
                    vue.$emit("time-changed");
                    vue.vibratePhone();
                }
                else if( middleIndexHours < currentIndexHours ){
                    //console.log("left", middleIndexHours-currentIndexHours)
                    vue.heures = vue.shiftLeftMulti(vue.heures, Math.abs(middleIndexHours-currentIndexHours));
                    vue.$emit("time-changed");
                    vue.vibratePhone();
                }
                
                if ( slow && Math.abs(speedInpxPerMs) >= 0.50 ) {
                    slow = false;
                }
                
                if( ! slow && 0.01 <= Math.abs(speedInpxPerMs) && Math.abs(speedInpxPerMs) <= 0.05 && vue.heures.length > 1 ){
                    //console.log("slow");                   
                    slow = true;
                }

                clearTimeout($.data(this, 'scrollTimer'));
                $.data(this, 'scrollTimer', setTimeout(function() {
                    
                    const currentIndexHours = (Math.ceil(Math.abs(_this.scrollTop())/100));
                    const val = (currentIndexHours*100);
                    
                    //console.log("Haven't scrolled in 250ms!", val, currentIndexHours);
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
                        console.log("hour:", vue.heures[middleIndexHours+1]);
                    });
                }, 190));
            });
        },
        methods: {
            shiftRight(arr) {
                if (arr.length === 0) {
                    return arr;
                }
                let lastElement = arr.pop();
                arr.unshift(lastElement);
                return arr;
            },
            shiftLeft(arr) {
                if (arr.length === 0) {
                    return arr;
                }
                let firstElement = arr.shift();
                arr.push(firstElement);
                return arr;
            },
            shiftRightMulti(arr, nb){
                for (let index = 0; index < nb; index++) {
                    arr = this.shiftRight(arr);
                }
                return arr;
            },
            shiftLeftMulti(arr, nb){
                for (let index = 0; index < nb; index++) {
                    arr = this.shiftLeft(arr);
                }
                return arr;
            },
            getTime(){
                const middleIndexHours = (this.heures.length/2)+1;
                const middleIndexMinutes = (this.minutes.length/2)+1;
                // const currentIndexMinutes = (Math.ceil(Math.abs($(".scrollable-container.minute-list").scrollTop())/100));
                // const currentIndexHours = (Math.ceil(Math.abs($(".scrollable-container.hour-list").scrollTop())/100));
                return this.heures[middleIndexHours] + ":" + this.minutes[middleIndexMinutes];
            },
            vibratePhone() {
                // Vérifiez si l'API de vibration est prise en charge
                if (navigator.vibrate) {
                    // Faites vibrer le téléphone pendant 200 ms
                    navigator.vibrate(50);
                    
                    // Ou, pour un motif de vibration plus complexe :
                    // navigator.vibrate([200, 100, 200, 100, 200]); 
                    // (vibrer 200ms, pause 100ms, vibrer 200ms, etc.)
                } else {
                    console.log("L'API Vibration n'est pas prise en charge sur cet appareil.");
                }
            },
        },
        watch: {
        }
    });
</script>
