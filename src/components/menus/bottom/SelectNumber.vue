
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

                .number-value {
                    width: 100%;
                    height: 100%;
                    display: grid;
                    align-content: center;
                    text-align: center;
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
            <div class="minus">
                <v-btn
                    elevation="0"
                    :active="false" 
                    :ripple="false"
                    :class="{active: numbers.length && number > numbers[0]}"
                    :disabled="!numbers.length || number <= numbers[0]"
                    aria-label="Diminuer la valeur"
                    @click="moin()"
                ><v-icon>mdi-minus-circle</v-icon>
                </v-btn>
            </div>

            <div
                class="select-number" 
            >
                <v-icon class="icon-coin">{{ icon }}</v-icon>

                <div class="number-value mx-auto" aria-live="polite" aria-atomic="true">{{ number }}</div>
            </div>
            <!-- (-) -->
            <div class="plus">
                    <v-btn 
                        elevation="0"
                        :active="false" 
                        :ripple="false"
                        :class="{active: numbers.length && number < numbers[numbers.length - 1]}"
                        :disabled="!numbers.length || number >= numbers[numbers.length - 1]"
                        aria-label="Augmenter la valeur"
                        @click="plus()"
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

                let target = typeof value === 'number' && Number.isFinite(value) ? value : this.numbers[0];
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
            },
            plus(){
                if(this.number < this.numbers[this.numbers.length - 1]) this.number += 1;
            },
            moin(){
                if(this.number > this.numbers[0]) this.number -= 1;
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
