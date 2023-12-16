
<style lang="scss" model>
    .select-model-vehicul-comp {
        .model.scrollable-container {
            cursor: pointer;
            overflow-x: auto;
            scrollbar-width: thin;
            scrollbar-color: transparent transparent;
            //display: inline-table;
            .text{
                margin-top: 5px;
            }
        }

        /* Pour Chrome, Edge et Safari */
        .scrollable-container::-webkit-scrollbar {
            width: 1px;
        }

        .scrollable-container::-webkit-scrollbar-track {
            background: transparent;
        }

        .scrollable-container::-webkit-scrollbar-thumb {
            background-color: transparent;
        }

        .select-number {
            .v-text-field {
                .v-input__control {
                    .v-field--variant-solo-inverted {
                        box-shadow: none;
                    }
                    .v-field {
                        background: var(--bg-app-color);
                        .v-field__overlay, .v-field__loader {
                            display: none;
                        }
                    }

                    label {
                        display: none;
                    }

                    input {
                        height: 52px !important;
                        padding: 10px 10px;
                        font-size: 25px;
                        text-transform: uppercase;
                        text-align: center;
                        color: var(--font-color-label);
                        border: none;
                    }
                }
            }
            .select-nb-seat{
                margin: 20px auto;
            }
        }
    }
</style>

<!-- scss -->
<style lang="scss" scoped>
    .v-container.select-model-vehicul-comp{
        .title {
            font-size: 16px;
            font-weight: bold;
            width: 90%;
            margin: 5px auto;
            color: var(--font-color-label);
        }

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
                            color: var(--font-color-label);
                        }
                    }
                    .model {
                        //max-width: 170px;
                        margin: auto 15px !important;
                        width: 75%;
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
                    .color {
                        margin: auto 0;
                        border: 6px solid #eeecec ;
                        border-radius: 200px;
                        height: 32px;
                        width: 32px;
                    }
                }
            }
        }

        .select-number {
            .label{
                margin: 0 auto 10px auto;
            }
            .v-text-field {
                .v-input__control {
                    .v-field--variant-solo-inverted {
                        box-shadow: none;
                    }
                    .v-field {
                        .v-field__overlay, .v-field__loader {
                            display: none;
                        }
                    }

                    label {
                        display: none;
                    }

                    input {
                        height: 52px !important;
                        padding: 10px 10px;
                        font-size: 25px;
                        text-transform: uppercase;
                        text-align: center;
                        color: var(--font-color-label);
                        border: none;
                    }
                }
            }
            .select-nb-seat{
                margin: 20px auto;
            }
        }
    }
</style>
   
<!--  -->
<template>
    <v-container 
        class="select-model-vehicul-comp"
    >
        <div v-if="mode=='select-model'">
            <div
                class="title text-center"
            >Selectionnez un type de véhicul !</div>

            <div 
                
                class="card-contain"
            >
                <v-card
                    v-for="(info, index) in infos.slice(0, 6)"
                    :key="index"
                    class="car mx-auto"
                    @click="mode='identity-car'"
                >
                    <v-list>
                        <div class="icon-container"><v-icon>{{ info.icon }}</v-icon></div>
                        <div class="model scrollable-container" ><div class="text">{{ info.model }}</div></div>
                        <!-- <div class="color" :style="'background-color: ' + info.color"></div> -->
                    </v-list>
                </v-card>
            </div>
        </div>

        <div
            v-else
            class="select-number mx-auto"
        >
            <div class="label text-center">Saisissez votre plaque d'immatriculation, ainsi que le nombre de place que vous pouvez prendre</div>
            <v-text-field label="Label" maxLength="9" variant="solo-inverted" ref="input" @input="checkPlaque($event)"></v-text-field>
            <SelectNumber class="select-nb-seat" :min="1" :max="8" ref="SelectNumberRef" v-on:number-changed="console.log('ok')" />
            <v-btn 
                class="text-none"
                rounded="xl" 
                size="x-large"
                variant="outlined"
                block
                @click="valided()"
            >Valider</v-btn>
        </div>

    </v-container>
</template>



<!--  -->
<script>
    import $ from 'jquery'
    import { defineComponent } from 'vue';

    // Components
    import SelectNumber from '@/components/menus/bottom/SelectNumber.vue';

    export default defineComponent({
        name: 'select-model-vehicul-comp',
        emits: ["place-valided", "switch-identity-car"],
        components: {
            SelectNumber,
        },
        props: {
            // mode: {
            //     type: String,
            //     default: "select-model",
            // },
        },
        data() {
            return {
                mode: "select-model",
                color: "red",
                infos: [
                    {model: "Moto", color: "silver", icon:"mdi-motorbike"},
                    {model: "Compact", color: "white", icon:"mdi-car-hatchback"},
                    {model: "Berline", color: "red", icon:"mdi-car-sports"},
                    {model: "SUV", color: "navy", icon:"mdi-car-estate"},
                    {model: "Monospace", color: "gray", icon:"mdi-car-estate"},
                ],
                car: 0,
            };
        },
        mounted() {
            //$(".model").animate();
            
            // console.log(scrollWidth, $('.model .text')[3])
            $(".model").each(function(){
                const _this = $(this);
                
                //first step
                const debordement = 50;
                const scrollWidth = _this.find(".text").width()-_this.width()+debordement;
                //console.log(_this.width(), scrollWidth, scrollWidth-debordement, _this.find(".text").width())
                if(_this.width() < _this.find(".text").width()){
                    console.log("defilement-debordement")
                    _this.animate({scrollLeft: scrollWidth}, 4000, 'linear', function(){
                        //_this.scrollLeft(0);
                        _this.animate({scrollLeft: 0}, 500);
                    });

                    //after first
                    setInterval(function(){
                        const scrollWidth = _this.find(".text").width()-_this.width()+debordement;
                        _this.animate({scrollLeft: scrollWidth}, 4000, 'linear', function(){
                            //_this.scrollLeft(0);
                            _this.animate({scrollLeft: 0}, 500);
                        });
                    }, 6000);
                }
            });
        },
        methods: {
            // selectCar(index, info){
            //     console.log("selected", index, info);
            //     this.car = index;
            //     this.$emit("car-selected");
            // },
            checkPlaque(e){
                e.target.value = e.target.value.replace(/[^a-zA-Z0-9-]/g, '');
                const text = e.target.value;
                if( text.length == 3 && text.replaceAll("-", "").length == 3 ){
                    e.target.value = text.slice(0, 2) + "-" + text.slice(2);
                }
                else if(text.length == 3 && text.replaceAll("-", "").length == 2){
                    e.target.value = text.replace("-", "")
                }
                else if( text.length == 7 && text.replaceAll("-", "").length == 6 ){
                    e.target.value = text.slice(0, 6) + "-" + text.slice(6);
                }
                else if( text.length == 7 && text.replaceAll("-", "").length == 5 ){
                    e.target.value = text.slice(0, 6);
                }
            },
            valided(){
                this.$emit('place-valided');
            }
        },
        watch: {
            mode(){
                if( this.mode == 'identity-car' ){
                    this.$emit("switch-identity-car");
                }
            }
        },
    });
</script>
