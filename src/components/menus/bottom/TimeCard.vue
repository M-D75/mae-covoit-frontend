
<style lang="scss" model>
//    .rolling {
//         animation-name: roll-up;
//         animation-duration: 1s;
//         animation-timing-function: ease-in-out;
//     }

//     @keyframes roll-up {
//         0% {
//             transform: translateY(0);
//         }
//         100% {
//             transform: translateY(-100%);
//         }
//     }

    .scrollable-container {
        cursor: pointer;
        overflow-y: scroll;
        scrollbar-width: thin;
        scrollbar-color: transparent transparent;
    }

    /* Pour Chrome, Edge et Safari */
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
        border-radius: 5px;
        margin-top: 20px;
        width: 70%;
        box-shadow: var(--box-shadow-card);
        div.time {
            position: relative;
            display: flex;
            overflow: hidden;
            height: 100px;
            font-size: 4.5em;
            font-weight: 700;
            user-select: none;

            div.hour-list {
                width: 100%;
                overflow-y: scroll;
                div {
                    height: 100%;
                    position: relative;
                    text-align: right;
                }
            }

            div.sep-time {
                text-align: center;
                line-height: 1.37;
                width: 30%;
            }

            div.minute-list {
                overflow-y: scroll;
                width: 100%;
                div {
                    height: 100%;
                    position: relative;
                    text-align: left;
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
        >

            <div class="hour-list mx-auto scrollable-container">
                <div 
                    v-for="heure in heures" 
                    :key="heure"
                    :id="'h-'+heure"
                    :class="'h-'+heure"
                >{{ heure }}</div>
            </div>

            <div class="sep-time mx-auto">:</div>

            <div class="minute-list mx-auto scrollable-container">
                <div 
                    v-for="minute in minutes" 
                    :key="minute"
                    :id="'m-'+minute"
                    :class="{ 'rolling': rollingMinutes.includes(minute) }"
                >{{ minute }}</div>
            </div>
            
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
        computed: {
        },
        props: {
        },
        data() {
            return {
                heures: Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}`),
                minutes: Array.from({ length: 60/5 }, (_, i) => `${(i*5).toString().padStart(2, '0')}`),
                rollingMinutes: [],
                active: false,
            }
        },
        mounted(){
            
            const middleIndexMinutes = this.minutes.length/2;
            this.minutes = this.shiftRightMulti(this.minutes, middleIndexMinutes);
            setTimeout(function(){
                $(".scrollable-container.minute-list").scrollTop(100*middleIndexMinutes);
            }, 50);

            var lastOffset = $(".scrollable-container").scrollTop();
            var lastDate = new Date().getTime();

            var vue = this;
            console.log("lastOffset:", lastOffset)

            var slow = true;
            $(".scrollable-container.minute-list").on("scroll", function(e){
                const _this = $(this);

                var delayInMs = e.timeStamp - lastDate;
                var offset = e.target.scrollTop - lastOffset;
                var speedInpxPerMs = offset / delayInMs;

                lastDate = e.timeStamp;
                lastOffset = e.target.scrollTop;

                const currentIndexMinutes = (Math.ceil(Math.abs(_this.scrollTop())/100));

                if( middleIndexMinutes > currentIndexMinutes ){
                    vue.minutes = vue.shiftRightMulti(vue.minutes, Math.abs(middleIndexMinutes-currentIndexMinutes));
                }
                else{
                    vue.minutes = vue.shiftLeftMulti(vue.minutes, Math.abs(middleIndexMinutes-currentIndexMinutes));
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
                        //console.log("currentIndexMinutes", middleIndexMinutes, currentIndexMinutes)
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
            const middleIndexHours = this.heures.length/2;
            this.heures = this.shiftRightMulti(this.heures, middleIndexHours);
            setTimeout(function(){
                $(".scrollable-container.hour-list").scrollTop(100*middleIndexHours);
            }, 50);
            
            var lastOffsetH = $(".scrollable-container").scrollTop();
            var lastDateH = new Date().getTime();

            $(".scrollable-container.hour-list").on("scroll", function(e){
                const _this = $(this);

                var delayInMs = e.timeStamp - lastDateH;
                var offset = e.target.scrollTop - lastOffsetH;
                var speedInpxPerMs = offset / delayInMs;

                lastDateH = e.timeStamp;
                lastOffsetH = e.target.scrollTop;

                const currentIndexHours = (Math.ceil(Math.abs(_this.scrollTop())/100));
                const val = (currentIndexHours*100);
                
                console.log("FAST", val, currentIndexHours);
                if( middleIndexHours > currentIndexHours ){
                    //console.log("rigth", middleIndexHours-currentIndexHours)
                    vue.heures = vue.shiftRightMulti(vue.heures, Math.abs(middleIndexHours-currentIndexHours));
                }
                else{
                    //console.log("left", middleIndexHours-currentIndexHours)
                    vue.heures = vue.shiftLeftMulti(vue.heures, Math.abs(middleIndexHours-currentIndexHours));
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
                        //console.log("hour:", vue.heures[middleIndexHours]);
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
        },
        watch: {
        }
    });
</script>
