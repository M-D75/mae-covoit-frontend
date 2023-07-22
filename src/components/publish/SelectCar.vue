
<style lang="scss" model>
    .scrollable-container {
        cursor: pointer;
        overflow-x: auto;
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
    .v-container.select-car-view{
        height: 100vh;
        .title {
            font-size: var(--font-size-h1);
            font-weight: bold;
            width: 90%;
            margin: 30px auto;
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
    }
</style>
   
<!--  -->
<template>

    <v-container 
        class="select-car-view"
    >
        <div
            class="title text-center"
        >Quelle voiture comptez-vous prendre ?</div>

        <div 
            class="card-contain"
            @click="selectCar(index, info)"
        >
            <v-card
                v-for="(info, index) in infos.slice(0, 6)"
                :key="index"
                class="car mx-auto"
                @click="selectCar(index, info)"
            >
                <v-list>
                    <div v-if="info.color=='white'" class="icon-container" style="text-shadow: 1px 1px 2px #555;"><v-icon :style="'color: ' + info.color">{{ info.icon }}</v-icon></div>
                    <div v-else class="icon-container" ><v-icon :style="`color: ${info.color}; text-shadow: 1px 1px 2px black;`">{{ info.icon }}</v-icon></div>
                    <div class="model scrollable-container" ><div class="text">{{ info.model }}</div></div>
                    <div class="color" :style="'background-color: ' + info.color"></div>
                </v-list>
            </v-card>
        </div>
    </v-container>

</template>



<!--  -->
<script>
    import $ from 'jquery'
    import { defineComponent } from 'vue';

    // Components

    export default defineComponent({
        name: 'select-car-view',

        components: {
        },
        data() {
            return {
                color: "red",
                infos: [
                    {model: "Ferrari - F8 Tributo", color: "silver", icon:"mdi-car"},
                    {model: "Tesla - Model 3", color: "white", icon:"mdi-car"},
                    {model: "Lamborghini - Aventador", color: "red", icon:"mdi-car-pickup"},
                    {model: "Ford - Mustang GT", color: "navy", icon:"mdi-car"},
                    {model: "Mercedes-Benz - Classe A", color: "gray", icon:"mdi-car-estate"},
                    {model: "Toyota - Camry", color: "cornflowerblue", icon:"mdi-car"},
                    {model: "Porsche - 911 Carrera", color: "lime", icon:"mdi-car-estate"},
                    {model: "Audi - Q5", color: "teal", icon:"mdi-car-estate"},
                    {model: "Renault - Clio", color: "fuchsia", icon:"mdi-car-estate"},
                    {model: "Nissan - Juke", color: "maroon", icon:"mdi-car-estate"},
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
            selectCar(index, info){
                console.log("selected", index, info);
                this.car = index;
                this.$emit("car-selected");
            },
        },
        watch: {
        },
    });
</script>
