
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
            .v-container {
                .v-color-picker {
                    &.v-sheet{
                        height: 130px;
                    }
                    .v-color-picker__controls {
                        .v-color-picker-preview {
                            .v-color-picker-preview__eye-dropper {
                                display: none;
                            }
                            .v-color-picker-preview__sliders {
                                .v-color-picker-preview__alpha {
                                    display: none;
                                }
                            }
                        }
                    }
                    // background-color: var(--bg-app-color);
                }
            }

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
            // min-height: 280px;
            display: block;
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
            >Quel est le type de carrosserie de votre véhicule ?</div>

            <div 
                class="card-contain"
            >
                <v-card
                    v-for="(info, index) in infos.slice(0, 6)"
                    :key="index"
                    class="car mx-auto"
                    @click="modelV=info.model; max=info.maxSeats; mode='identity-car'"
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
            <div class="label text-center">{{ labelSaisie }}</div>
            <v-text-field v-model="matricul" placeholder="XX-000-XX" maxLength="9" variant="solo-inverted" ref="input" @input="checkPlaque($event)"></v-text-field>
            <v-container>
                <v-color-picker 
                    v-model="color"
                    @update:model-value="getColor($event)"
                    style="max-width: none; width: inherit;" 
                    hide-canvas 
                    hide-inputs 
                    show-swatches
                ></v-color-picker>
            </v-container>
            <SelectNumber v-if="max>1" class="select-nb-seat" :initNumber="max" :min="1" :max="max" ref="SelectNumberRef" v-on:number-changed="console.log('ok')" />
            <v-btn 
                class="text-none"
                rounded="xl" 
                size="x-large"
                variant="outlined"
                block
                :disabled="matricul.length<9"
                @click="valided()"
            >Valider</v-btn>
        </div>

        <!-- message succes -->
        <v-snackbar
            v-model="showSnackbarSuccess"
            :timeout="4000"
            color="success"
            style="z-index: 99999;"
        >
            <div class="contain-ico">
                <v-icon icon="mdi-alert-circle"></v-icon> 
            </div>
            <div>
                <span>{{ messageSnackbarSuccess }}</span>
            </div>
        </v-snackbar>

        <!-- message error -->
        <v-snackbar
            v-model="showSnackbarError"
            :timeout="4000"
            color="error"
            style="z-index: 99999;"
        >
            <div class="contain-ico">
                <v-icon icon="mdi-alert-circle"></v-icon> 
            </div>
            <div>
                <span>{{ messageSnackbarError }}</span>
            </div>
        </v-snackbar>

    </v-container>
</template>



<!--  -->
<script>
    import { defineComponent } from 'vue';
    import { mapActions } from 'vuex';

    // Components
    import SelectNumber from '@/components/menus/bottom/SelectNumber.vue';

    export default defineComponent({
        name: 'select-model-vehicul-comp',
        emits: ["car-valided", "switch-identity-car"],
        components: {
            SelectNumber,
        },
        props: {
        },
        data() {
            return {
                mode: "select-model",
                color: "#F44336",
                infos: [
                    {model: "Moto", color: "silver", icon:"mdi-motorbike", maxSeats:1},
                    {model: "Compact", color: "white", icon:"mdi-car-hatchback", maxSeats:4},
                    {model: "Berline", color: "red", icon:"mdi-car-sports", maxSeats:4},
                    {model: "SUV", color: "navy", icon:"mdi-car-estate", maxSeats:8},
                    {model: "Monospace", color: "gray", icon:"mdi-car-estate", maxSeats:8},
                ],
                labelSaisie: "Prêt à présenter votre bolide ? Partagez avec nous sa plaque d'immatriculation, sa couleur éclatante, et combien de passagers peuvent profiter de l'aventure à bord ! 🚗✨",
                max: 3,
                matricul: "",
                modelV: "",
                car: 0,
                messageSnackbarError: "",
                showSnackbarError: false,
                messageSnackbarSuccess: "",
                showSnackbarSuccess: false,
            };
        },
        mounted() {
            
        },
        methods: {
            ...mapActions("profil", ["addCar"]),
            getColor(color){
                this.color = color;
            },
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
                this.matricul = e.target.value;
            },
            async valided(){
                this.matricul = this.matricul.toUpperCase();
                const infos = { 
                        model: this.modelV,
                        licence_plate: this.matricul,
                        brand: "UNKNOWN",
                        color: this.color,
                        seats: this.$refs.SelectNumberRef.number
                    };
                // console.log("infos-to-add-car", infos);
                const result = await this.addCar(infos);
                if(result.status == 0){
                    this.messageSnackbarSuccess = result.message;
                    this.showSnackbarSuccess = true;
                    this.$emit('car-valided');
                    
                    setTimeout(function(){
                        this.mode = "select-model";
                    }.bind(this), 1000);
                }
                else{
                    this.messageSnackbarError = result.message;
                    this.showSnackbarError = true;
                }
            }
        },
        watch: {
            mode(){
                if( this.mode == 'identity-car' ){
                    this.$emit("switch-identity-car");
                }
            },
            max(){
                if(this.max == 1){
                    this.labelSaisie = "Merci de renseigner la plaque d'immatriculation et la couleur de votre véhicule."
                }
            }
        },
    });
</script>
