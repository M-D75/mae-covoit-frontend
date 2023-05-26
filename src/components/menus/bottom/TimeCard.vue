
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

        border-radius: 5px;
        margin-top: 20px;
        width: 70%;
        div.time {
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
                minutes: Array.from({ length: 60 }, (_, i) => `${i.toString().padStart(2, '0')}`),
                rollingMinutes: [],
                active: false,
            }
        },
        mounted(){
            // setInterval(() => {
            //     // Incrémentation des minutes
            //     const currentMinutes = parseInt(this.minutes[0], 10);
            //     const nextMinutes = (currentMinutes + 1) % 60;
            //     this.minutes = Array.from({ length: 60 }, (_, i) =>
            //         `${((nextMinutes + i) % 60).toString().padStart(2, '0')}`
            //     );
            // }, 1000); // Mettre à jour toutes les 1000 ms (1 seconde)

            // setInterval(() => {
            //     // const currentMinutes = parseInt(this.minutes[0], 10);
            //     // const nextMinutes = (currentMinutes + 1) % 60;
            //     this.rollingMinutes = [this.minutes[0], this.minutes[1]];
            //     // this.minutes = Array.from({ length: 60 }, (_, i) =>
            //     //     `${((nextMinutes + i) % 60).toString().padStart(2, '0')}`
            //     // );
            // }, 1000);
            var lastOffset = $(".scrollable-container").scrollTop();
            var lastDate = new Date().getTime();

            var vue = this;
            console.log("lastOffset:", lastOffset)

            var slow = true;
            $(".scrollable-container").on("scroll", function(e){
                var delayInMs = e.timeStamp - lastDate;
                var offset = e.target.scrollTop - lastOffset;
                var speedInpxPerMs = offset / delayInMs;
                console.log("speed", Math.abs(speedInpxPerMs));

                lastDate = e.timeStamp;
                lastOffset = e.target.scrollTop;
                
                if ( slow && Math.abs(speedInpxPerMs) >= 0.50 ) {
                    slow = false;
                }

                if( ! slow && 0.10 <= Math.abs(speedInpxPerMs) && Math.abs(speedInpxPerMs) <= 0.12 && vue.minutes.length > 1 ){
                    //const val = (Math.floor(e.target.scrollTop/108)*108);
                    const num = (Math.ceil(Math.abs($(this).scrollTop())/108));
                    console.log("slow", num, e.target.scrollTop, $(this).scrollTop());
                    vue.minutes = [`${num.toString().padStart(2, '0')}`];
                    //e.target.scrollTop = -100;
                    //lastOffset = val;
                    slow = true;
                }

                console.log(e.y, $(this).scrollTop(), e.timeStamp)
            });
        },
        methods: {
        },
        watch: {
        }
    });
</script>
