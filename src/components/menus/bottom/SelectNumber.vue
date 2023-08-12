
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
            this.numbers = Array.from({ length: parseInt(this.max) }, (_, i) => (parseInt(i+parseInt(this.min)) )),
            this.number = this.numbers[0];
        },
        methods: {
            plus(){
                if( this.number < this.numbers[this.numbers.length-1] ){
                    this.number += 1;
                    const height = parseInt($(".v-card.select-number").css("height").replace("px", ""));
                    console.log("heigth:", height, $(".select-number").css("height"));
                    $(".number-list").animate({
                        top: `-=${height}`,
                    }, 'fast', function() {
                        console.log("+");
                    });
                }

                if( this.number >= this.numbers[this.numbers.length-1] ){
                    $(".plus .v-btn").removeClass("active");
                }

                console.log($(".minus .v-btn").hasClass("active"))
                if( this.number > this.numbers[0] && ! $(".minus .v-btn").hasClass("active")){
                    $(".minus .v-btn").addClass("active")
                }
            },
            moin(){
                console.log(this.numbers[0], this.number)
                if( this.number > this.numbers[0] ){
                    this.number -= 1;
                    const height = parseInt($(".v-card.select-number").css("height").replace("px", ""));
                    $(".number-list").animate({
                        top: `+=${height}`,
                    }, 'fast', function() {
                        console.log("-");
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
        }
    });
</script>
