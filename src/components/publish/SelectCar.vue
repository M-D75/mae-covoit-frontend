
<style lang="scss" model>
    .select-car-view {
        .model.scrollable-container {
            cursor: pointer;
            overflow-x: auto;
            scrollbar-width: thin;
            scrollbar-color: transparent transparent;
            //display: inline-table;
            // .text{
            //     margin-top: 5px;
            // }
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
    }
</style>

<!-- scss -->
<style lang="scss" scoped>
    .v-container.select-car-view{
        // height: 100vh;
        .title {
            font-size: var(--font-size-h1);
            font-weight: bold;
            width: 90%;
            margin: 30px auto;
            color: var(--font-color-label);
        }

        div.card-contain{
            margin: auto;
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
                        position: relative;
                        //max-width: 170px;
                        margin: auto 15px !important;
                        width: 65%;
                        overflow-x: auto;
                        .text{
                            position: relative;
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
                        // border: 4px solid #eeecec ;
                        opacity: 0.2;
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
    <v-main>
        <v-container 
            class="select-car-view"
        >
            <div
                class="title text-center"
            >Quelle voiture comptez-vous prendre ?</div>

            <div 
                class="card-contain"
            >
                <v-card
                    v-for="(info, index) in infos.slice(0, 6)"
                    :key="index"
                    class="car mx-auto"
                    @click="selectCar(index, info)"
                >
                    <v-list>
                        <div class="icon-container"><v-icon >{{ info.icon }}</v-icon></div>
                        <div class="model scrollable-container" ><div class="text">{{ info.model }}</div></div>
                        <div class="color" :style="'background-color: ' + info.color"></div>
                    </v-list>
                </v-card>
            </div>
        </v-container>
    </v-main>
</template>



<!--  -->
<script>
    import $ from 'jquery'
    import { defineComponent } from 'vue';
    import { mapState, mapActions } from 'vuex';

    // Components

    export default defineComponent({
        name: 'select-car-view',
        computed: {
            ...mapState("profil", ["cars"]),
        },
        components: {
        },
        data() {
            return {
                color: "red",
                infos: [
                    {model: "Ferrari - F8 Tributo", color: "silver", icon:"mdi-car-sports"},
                    {model: "Tesla - Model 3", color: "white", icon:"mdi-car"},
                    {model: "Lamborghini - Aventador", color: "red", icon:"mdi-car-sports"},
                    {model: "Ford - Mustang GT", color: "navy", icon:"mdi-car-sports"},
                    {model: "Mercedes-Benz - Classe A", color: "gray", icon:"mdi-car-sports"},
                    {model: "Toyota - Camry", color: "cornflowerblue", icon:"mdi-car"},
                    {model: "Porsche - 911 Carrera", color: "lime", icon:"mdi-car-sports"},
                    {model: "Audi - Q5", color: "teal", icon:"mdi-car-estate"},
                    {model: "Renault - Clio", color: "fuchsia", icon:"mdi-car-estate"},
                    {model: "Nissan - Juke", color: "maroon", icon:"mdi-car-estate"},
                ],
                car: 0,
                seats: 7,
                infosModelVehicul: [
                    {model: "Moto", color: "silver", icon:"mdi-motorbike", maxSeats:1},
                    {model: "Compact", color: "white", icon:"mdi-car-hatchback", maxSeats:4},
                    {model: "Berline", color: "red", icon:"mdi-car-sports", maxSeats:4},
                    {model: "SUV", color: "navy", icon:"mdi-car-estate", maxSeats:8},
                    {model: "Monospace", color: "gray", icon:"mdi-car-estate", maxSeats:8},
                ],
            };
        },
        async mounted() {
            this.infos = [];

            // const result = await this.getCars();
            // if(result.status == 0 && this.cars.length > 0){
            //     for (let index = 0; index < this.cars.length; index++) {
            //         const car = this.cars[index];
            //         this.infos.push({
            //             model: car.license_plate, 
            //             color: car.color, 
            //             icon: this.infosModelVehicul.find((vehicul) => vehicul.model == car.model).icon,
            //             id: car.id,
            //             seats: car.seats,
            //         });
            //     }
            // }

            this.infos = [
                {
                    "model": "AA-898-AA",
                    "color": "#AB47BC",
                    "icon": "mdi-car-estate",
                    "id": 3,
                    "seats": 8
                },
                {
                    "model": "XXXXXXX-XXXXXXXXXXXXXAA",
                    "color": "blue",
                    "icon": "mdi-car-estate",
                    "id": 1,
                    "seats": 5
                }
            ];
            
            this.$nextTick(function(){
                // Animation pour text trop long
                $(".model").each(function(){
                    const _this = $(this);
                    const debordement = 10;
                    const scrollWidth = _this.find(".text").width()-_this.width()+debordement;
                    if(_this.width() < _this.find(".text").width()){
                        // console.log("defilement-debordement", _this.scrollLeft(), scrollWidth)
                        _this.find(".text").animate({left: -scrollWidth}, 3000, 'linear', function(){
                            setTimeout(function(){//pause
                                _this.find(".text").animate({left: 0}, 500); 
                            }, 500)                  
                        });

                        // after first
                        setInterval(function(){
                            _this.find(".text").animate({left: -scrollWidth}, 3000, 'linear', function(){
                                setTimeout(function(){//pause
                                    _this.find(".text").animate({left: 0}, 500); 
                                }, 500)
                            });
                        }, 5000);
                    }
                });
            })
            
        },
        methods: {
            ...mapActions("profil", ["updateAutoValidation", "getCars"]),
            selectCar(index, info){
                // console.log("selected", index, info);
                this.car = info.id != undefined ? info.id : index;
                this.seats = info.seats;
                this.$emit("car-selected");
            },
        },
        watch: {
        },
    });
</script>
