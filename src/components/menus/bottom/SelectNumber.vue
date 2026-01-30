
<style lang="scss" model>
   
</style>

<!-- scss -->
<style lang="scss" scoped>
    .v-card.select-number {
        background-color: var(--white-bg-color);
        color: var(--font-color-label);
        border-radius: 10px;
        margin-top: 20px;
        width: 85%;        
        height: 142px;
        overflow: visible;
        .card-contain {
            display: flex;
            height: 100%;
            div.minus, div.plus {
                height: 100%;
                margin: auto;
                .v-btn {
                    height: 100%;
                    background-color: var(--white-bg-color);
                    box-shadow: none;
                    .v-icon {
                        font-size: 1.8em;
                        color: var(--gray-icon-color);
                    }
                    &.active {
                        .v-icon {
                            color: var(--blue-color);
                        }
                    }
                }
            }

            div.select-number {
                overflow: hidden;
                border-radius: 20px;
                background-color: var(--white-bg-color);
                position: relative;
                display: flex;
                font-size: 4.5em;
                font-weight: 700;
                user-select: none;
                width: 100%;
                height: 100%;
                max-width: 142px;
                box-shadow: var(--box-shadow-card);
                z-index: 10;
                .v-icon {
                    position: absolute;
                    top: 5px;
                    right: 5px;
                    font-size: 25px;
                    &.mdi-account-multiple-plus {
                        -moz-transform: scale(-1, 1);
                        -webkit-transform: scale(-1, 1);
                        -o-transform: scale(-1, 1);
                        -ms-transform: scale(-1, 1);
                        transform: scale(-1, 1);
                    }
                }

                .number-list {
                    position: absolute;
                    width: 100%;
                    height: 100%;
                    div {
                        text-align: center;
                        height: 100%;
                        display: grid;
                        align-content: center;
                    }
                }
            }
        }
    }

</style>
   
<!--  -->
<template>
    <v-card
        class="mx-auto rounded select-number"
        max-width="500"
        elevation="0"
    >
        <div class="card-contain">
            <!-- (+) -->
            <div class="minus" @click="moin()">
                <v-btn
                    elevation="0"
                    :active="false" 
                    :ripple="false"
                    class=""
                ><v-icon>mdi-minus-circle</v-icon>
                </v-btn>
            </div>

            <div
                class="select-number" 
            >
                <v-icon class="icon-coin">{{ icon }}</v-icon>

                <div class="number-list mx-auto">
                    <div 
                        v-for="num in numbers" 
                        :key="num"
                        :id="'n-'+num"
                        :class="'num n-'+num"
                    >{{ num }}</div>
                </div>
            </div>
            <!-- (-) -->
            <div class="plus" @click="plus()">
                    <v-btn 
                        elevation="0"
                        :active="false" 
                        :ripple="false"
                        class="active"
                    >
                    <v-icon>mdi-plus-circle</v-icon>
                </v-btn>
            </div>
        </div>
    </v-card>
</template>



<!--  -->
<script>
    import { defineComponent } from 'vue';
    import $ from 'jquery';
    import { arrondirSpecial } from '@/utils/utils.js';

    // Components
    //...

    export default defineComponent({
        name: 'select-number-comp',
        emits: ["number-changed"],
        computed: {
        },
        props: {
            min: {
                type: Number,
                default: 1,
            },
            max: {
                type: Number,
                default: 8,
            },
            icon: {
                type: String,
                default: "mdi-account-multiple-plus",
            },
            initNumber: {
                type: Number,
                default: 1,
            },
            // numbers: {
            //     type: Array,
            //     default: () => Array.from({ length: 8 }, (_, i) => (parseInt(i+1))),
            // },
        },
        data() {
            return {
                number: 0,
                numbers: [],
            }
        },
        mounted(){
            this.buildNumbers();
            this.setNumber(this.initNumber);
        },
        methods: {
            buildNumbers(){
                const minVal = parseInt(this.min);
                const maxVal = parseInt(this.max);
                const total = Math.max(0, maxVal - minVal + 1);
                this.numbers = total > 0
                    ? Array.from({ length: total }, (_, i) => (minVal + i))
                    : [];
            },
            setNumber(value){
                if( !this.numbers.length ){
                    this.buildNumbers();
                }
                if( !this.numbers.length ){
                    this.number = 0;
                    return;
                }

                let target = typeof value === 'number' ? value : this.numbers[0];
                target = arrondirSpecial(target);
                const minVal = this.numbers[0];
                const maxVal = this.numbers[this.numbers.length - 1];
                if( target < minVal ){
                    target = minVal;
                }
                if( target > maxVal ){
                    target = maxVal;
                }
                this.number = target;
                this.$nextTick(() => this.initPos());
            },
            initPos(){
                const height = parseInt($(".v-card.select-number").css("height").replace("px", ""));
                const goalTop = (this.number-1)*height;
                // console.log("goalTop:", goalTop);
                $(".number-list").animate({
                    top: `-${goalTop}px`,
                }, 'fast', function() {
                    // console.log("=");
                });

                if( this.number >= this.numbers[this.numbers.length-1] ){
                    $(".plus .v-btn").removeClass("active");
                }

                if( this.number > this.numbers[0] && ! $(".minus .v-btn").hasClass("active")){
                    $(".minus .v-btn").addClass("active")
                }
            },
            plus(){
                if( this.number < this.numbers[this.numbers.length-1] ){
                    this.number += 1;
                    const height = parseInt($(".v-card.select-number").css("height").replace("px", ""));
                    // console.log("heigth:", height, $(".select-number").css("height"));
                    $(".number-list").animate({
                        top: `-=${height}`,
                    }, 'fast', function() {
                        console.log("+", this.number);
                    });
                }

                if( this.number >= this.numbers[this.numbers.length-1] ){
                    $(".plus .v-btn").removeClass("active");
                }

                // console.log($(".minus .v-btn").hasClass("active"))
                if( this.number > this.numbers[0] && ! $(".minus .v-btn").hasClass("active")){
                    $(".minus .v-btn").addClass("active")
                }
            },
            moin(){
                // console.log(this.numbers[0], this.number)
                if( this.number > this.numbers[0] ){
                    this.number -= 1;
                    const height = parseInt($(".v-card.select-number").css("height").replace("px", ""));
                    $(".number-list").animate({
                        top: `+=${height}`,
                    }, 'fast', function() {
                        console.log("-", this.number);
                    });
                }

                if( this.number <= this.numbers[0] ){
                    $(".minus .v-btn").removeClass("active");
                }
                
                if( this.number < this.numbers[this.numbers.length-1] && ! $(".plus .v-btn").hasClass("active")){
                    $(".plus .v-btn").addClass("active")
                }

            },
        },
        watch: {
            number(){
                this.$emit("number-changed");
            },
            initNumber(){
                this.setNumber(this.initNumber);
            },
            min(){
                this.buildNumbers();
                this.setNumber(this.number);
            },
            max(){
                this.buildNumbers();
                this.setNumber(this.number);
            }
        }
    });
</script>
