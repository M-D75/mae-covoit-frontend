
<style lang="scss" model>
    .credit-card.card-contain {

        .bloc-saisi {
            background-color: var(--white-bg-color);
            border-radius: 10px;
            height: 56px;
            margin: 30px auto;
            box-shadow: var(--box-shadow-card);
            .v-text-field {
                .v-input__control {
                    .v-field {
                        .v-field__field{
                            background-color: var(--white-bg-color);
                            border-radius: 10px;
                            .v-field__input{
                                color: var(--font-color-label);
                            }
                        }
                    }
                }
            }
        }

        .num-credit-card {
            > div {
                .v-text-field {
                    .v-input__control {
                        .v-field {
                            .v-field__field{
                                .v-field__input{
                                    letter-spacing: 3px;
                                }
                            }
                        }
                    }
                }
            }
        }

        .date-cvc {
            > div {
                &.date {
                    .month, .year {
                        .v-text-field {
                            .v-input__control {
                                .v-field {
                                    .v-field__field{
                                        .v-field__input{
                                            letter-spacing: 3px;
                                        }
                                    }
                                }
                            }
                        }
                    }
                    .slash {
                        margin: auto 0;
                    }
                }
                &.cvc {
                    .v-text-field {
                        .v-input__control {
                            .v-field {
                                .v-field__field{
                                    .v-field__input{
                                        text-align: center;
                                        letter-spacing: 5px;
                                    }
                                }
                            }
                        }
                    }
                }
            }   
        }

        
    }

    .password {
        .contain-input{
            .v-text-field {
                .v-input__control {
                    box-shadow: var(--box-shadow-card);
                    .v-field.v-field--variant-solo{
                        border-radius: 20px !important;
                        overflow: hidden;
                    }
                    .v-field__field {
                        background-color: white;
                        .v-field__input {
                            text-align: center;
                        }
                    }
                }
            }
        }
    }


</style>

<style lang="scss" scoped>
    //Animations
    /* The animation code */
    @keyframes warn-bad-to-good {
        from {background-color: #FF4949;}
        to {background-color: var(--blue-color);}
    }

    @keyframes warn-good-to-bad {
        from {background-color: var(--blue-color);}
        to {background-color: #FF4949;}
    }

    @keyframes warn-good-to-low {
        from {background-color: var(--blue-color);}
        to {background-color: #fa9801;}
    }

    @keyframes warn-low-to-good {
        from {background-color: #fa9801;}
        to {background-color: var(--blue-color);}
    }

    // global
    .label {
        font-size: 16px;
    }

    .sub-label-color {
        border-radius: 20px;
        background-color: var(--blue-color);
        color: white;
        text-transform: uppercase;
        text-align: center;
        font-weight: bold;
        width: 80%;
        margin: auto;
        &.warn-good-to-bad {
            background-color: #FF4949;
            animation-name: warn-good-to-bad;
            animation-duration: 1s;
        }
        &.warn-good-to-low {
            background-color: #fa9801;
            animation-name: warn-good-to-low;
            animation-duration: 1s;
        }
        &.warn-low-to-good {
            background-color: var(--blue-color);
            animation-name: warn-low-to-good;
            animation-duration: 1s;
        }
        &.warn-bad-to-good {
            background-color: var(--blue-color);
            animation-name: warn-bad-to-good;
            animation-duration: 1s;
        }
    }

    // struct
    .draggable{
        position: absolute;
        width: 100%;
        height: 50px;
        z-index: 99999;
        cursor: pointer;
        &.dragging, &.active {
            border: none;
        }
    }

    .v-container.bottom-menu {
        position: fixed;
        padding: 16px 0;
        bottom: 0;
        border-radius: 30px 30px 0 0;
        background-color: var(--white-bg-color);
        color: var(--font-color-label);
        width: 100%;
        max-width: 100%;
        .sub-cont {
            height: max-content;
            .bar-up {
                cursor: pointer;
                margin: auto;
                margin-top: 5px;
                width: 14.6%;
                border: 2px solid gray;
                border-radius: 10px;
                z-index: 999;
            }

            .select-time, .select-number {
                width: 85%;
                .label {
                    margin: 15px;
                    margin-top: 50px;
                }

                .v-btn {
                    margin: 30px auto;
                }
            }

            .select-day-hour-domicile, .select-day{
                width: 85%;
                .label {
                    margin: 35px;
                }

                .day-contain {
                    margin: auto;
                    display: flex;
                    width: 100%;
                    justify-content: space-around;
                    .day{
                        cursor: pointer;
                        display: grid;
                        align-content: center;
                        text-align: center;
                        width: 41px;
                        height: 41px;
                        background-color: gray;
                        border-radius: 100px;
                        text-transform: uppercase;
                        color: white;
                        font-weight: bold;
                        font-size: 16px;
                        &.selected {
                            background-color: var(--blue-color);
                        }
                    }
                }

                .v-btn {
                    margin: 30px auto;
                    font-weight: bold;
                }
            }


            //car
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
                        .v-btn {
                            margin: auto 0;
                            box-shadow: none;
                            font-size: 1.2em;
                            color: var(--gray-icon-color);
                            &.active {
                                color: var(--blue-color);
                            }
                        }
                    }
                }
            }

            //credit-card
            .credit-card.card-contain {
                width: 90%;
                .bloc-saisi {
                    &.name{
                        width: 100%;
                        margin-top: 0;
                    }
                }
                .num-credit-card {
                    width: 100%;
                    margin: auto;
                    margin-top: 30px;
                    display: flex;
                    justify-content: space-between;
                    > div {
                        width: 26%;
                    }
                }

                .date-cvc {
                    width: 100%;
                    margin: auto;
                    display: flex;
                    justify-content: space-between;
                    > div {
                        width: 40%;
                        margin: 30px 0;
                        &.date {
                            display: flex;
                            justify-content: center;
                            .month, .year {
                                width: 49%;
                            }
                            .slash {
                                margin: auto 0;
                                color: gray;
                            }
                        }
                    }
                    
                }
            }

            //password
            .password {
                padding: 0 40px;
                .label {
                    margin: 30px auto;
                    font-weight: bold;
                }
                .contain-input{
                    margin: 5px;
                    .label {
                        margin: 3px auto;
                        color: gray;
                        text-align: left;
                        font-size: 14px;
                    }
                    .v-text-field {
                        .v-input__control {
                            .v-field__field {
                                background-color: white;
                            }
                        }
                    }
                }
            }

            // map
            .map {
                width: 90%;
                margin: 10px auto;
                margin-bottom: 5px;
                .infos-route {
                    font-size: 25px;
                    font-weight: bold;
                    span.time {
                        color: rgb(0, 204, 0);
                    }
                }
                .infos-sup {
                    font-size: 13px;
                    color: gray;
                }
            }
        }
    }
</style>

<template>

    <vue3-draggable-resizable
        class-name="draggable"
        :class="className"
        v-model:x="x"
        v-model:y="y"
        :axis="'y'"
        v-model:active="active"
        :draggable="true"
        :resizable="false"
        :disabledX="true"
        :disabledY="disabledY"
        :disabledW="true"
        :disabledH="true"
        @dragging="onDrag"
        @drag-end="onDragStop"
    >
    </vue3-draggable-resizable>

    <!--  -->
    <v-container
        class="bottom-menu"
        :class="className.join(' ')"
    >
        <div class="sub-cont" :class="className.join(' ')" ref="subCont">

            <div class="bar-up"></div>

            <!-- ** Results **
                **************
            -->
            <TrajetMember v-if="!notif && mode=='reserve'" :infos="infos"/>
            <ReservePlace v-if="!notif && mode=='reserve'" v-on:test-notif-success="notif = !notif"/>

            <Notification v-if="notif && mode=='reserve'" :message="'Votre commande a été comfirmé par le chauffeur !'" />
            <!-- End Results -->

            <!-- ** Publish **
                **************
            -->
            <!-- time -->
            <div
                v-if="mode=='time'"
                class="select-time mx-auto"
            >
                <div class="label text-center">{{ labelSelectorN1 }}</div>
                <TimeCard ref="TimeCardRef" :class-name="className" :hour-init="timeInit.hourInit" :minute-init="timeInit.minuteInit" v-on:time-changed="emit('time-changed')"/>
                <v-btn 
                    class="text-none"
                    rounded="xl" 
                    size="x-large"
                    variant="outlined"
                    block
                    @click="emit('time-valided')"
                >Valider</v-btn>
            </div>

            <!-- select nb passenger -->
            <div
                v-if="mode=='nb-passenger'"
                class="select-number mx-auto"
            >
                <div class="label text-center">{{ labelSelectorN1 }}</div>
                <SelectNumber :min="paramsNumber.min" :max="paramsNumber.max" ref="SelectNumberRef" v-on:number-changed="selectNumber()" />
                <v-btn 
                    class="text-none"
                    rounded="xl" 
                    size="x-large"
                    variant="outlined"
                    block
                    @click="emit('time-valided')"
                >Valider</v-btn>
            </div>

            <!-- select day and hour -->
            <div
                v-if="mode=='select-day-hour-domicile'"
                class="select-day-hour-domicile mx-auto"
            >
                <div class="label text-center" >{{ labelSelectorN1 }}</div>
                <div class="day-contain">
                    <div
                        v-for="(day, index) in daysSelected"
                        :key="index"
                        class="day"
                        :class="{selected: day.selected}"
                        @click="selectDay(index)"
                    >{{ day.day }}</div>
                </div>
                <div class="label text-center">{{ labelSelectorN2 }}</div>
               <TimeCard ref="TimeCardRef"/>
                
                <v-btn 
                    class="text-none"
                    rounded="xl" 
                    size="x-large"
                    variant="outlined"
                    block
                    @click="emit('time-valided')"
                >Valider</v-btn>
            </div>

            <!-- select day -->
            <div
                v-if="mode=='select-day'"
                class="select-day mx-auto"
            >
                <div class="label text-center" >{{ labelSelectorN1 }}</div>
                <div class="day-contain">
                    <div
                        v-for="(day, index) in daysSelected"
                        :key="index"
                        class="day"
                        :class="{selected: day.selected}"
                        @click="selectDay(index)"
                    >{{ day.day }}</div>
                </div>
                
                <v-btn 
                    class="text-none"
                    rounded="xl" 
                    size="x-large"
                    variant="outlined"
                    block
                    @click="emit('day-valided')"
                >Valider</v-btn>
            </div>


            <!-- price -->
            <div
                v-if="mode=='select-price'"
                class="select-number mx-auto"
            >
                <div class="label text-center">{{ labelSelectorN1 }}</div>
                <!-- <div class="sub-label-color" :class="{warning_yellow: warn=='low', warning_red: warn=='bad'}">prix recommandé : 2 à 3 €</div> -->
                <div class="sub-label-color">prix recommandé : 2 à 3 €</div>
                <SelectNumber ref="SelectNumberRef" icon="mdi-currency-eur" :min="1" :max="8" v-on:number-changed="selectNumber()" />
                <v-btn 
                    class="text-none"
                    rounded="xl" 
                    size="x-large"
                    variant="outlined"
                    block
                    @click="emit('time-valided')"
                >Valider</v-btn>
            </div>

            
            <Notification v-if="mode=='notification'" :message="'Votre trajet a bien été publé !'"  />
            <!-- End Publish -->

            <!-- ** Pofile ***
                **************
            -->
            <GroupListCardsHistory v-if="!notif && mode=='history'"/>

            <!-- Drop Money -->
            <Notification 
                v-if="mode=='drop-money'"
                :mode="mode"
                label-head="Souhaitez-vous déposer l'argent dans votre compte ?" 
                label-btn="Confirmer"
                icon="mdi-shield-alert"
                color="#ff9c00"
                v-on:drop-money="emit('drop-money')"
                />

            <Notification 
                v-if="mode=='confirme-drop-money'"
                :mode="mode"
                message="Votre dépôt a été effectué sur votre compte. Il sera disponible dans les 48 à 72 heures." 
                />
            
            <!-- Up Money -->
            <div
                v-if="mode=='up-money'"
                class="select-number mx-auto"
            >
                <div class="label text-center">{{ labelSelectorN1 }}</div>
                <SelectNumber :min="1" :max="200" icon="mdi-currency-eur" />
                <v-btn 
                    class="text-none"
                    rounded="xl" 
                    size="x-large"
                    variant="outlined"
                    block
                    @click="recharger()"
                >Recharger</v-btn>
            </div>
            <Notification 
                v-if="mode=='confirme-up-money'"
                :mode="mode"
                message="Nous avons effectué la recharge sur votre compte. Elle sera disponible dans quelques instants." 
                />

            <!-- Select model car -->
            <div
                v-if="mode=='select-model-car'" 
                class="car card-contain"
            >
                <v-card
                    v-for="(info, index) in infosModelCar.slice(0, 6)"
                    :key="index"
                    class="car mx-auto"
                >
                    <v-list>
                        <div v-if="info.color=='white'" class="icon-container" style="text-shadow: 1px 1px 2px #555;"><v-icon :style="'color: ' + info.color">{{ info.icon }}</v-icon></div>
                        <div v-else class="icon-container" ><v-icon :style="`color: ${info.color}; text-shadow: 1px 1px 2px black;`">{{ info.icon }}</v-icon></div>
                        <div class="model scrollable-container" ><div class="text">{{ info.model }}</div></div>
                        <v-btn density="compact" icon="mdi-chevron-right-circle"></v-btn>
                    </v-list>
                </v-card>
            </div>

            <!-- Add Card -->
            <div
                v-if="mode=='register-credit-card'" 
                class="credit-card card-contain"
            >
                
                
                <!-- num card -->
                <div class="bloc-saisi num-credit-card">
                    <div>
                        <v-text-field
                            v-model="numericValues[0]"
                            placeholder="1234"
                            maxLength="4"
                            @input="checkNumericalValue($event, 'input2')"
                            single-line
                            variant="solo"
                            ></v-text-field>
                    </div>
                    <div>
                        <v-text-field
                            v-model="numericValues[1]"
                            placeholder="1234"
                            maxLength="4"
                            @input="checkNumericalValue($event, 'input3')"
                            ref="input2"
                            single-line
                            variant="solo"
                            ></v-text-field>
                    </div>
                    <div>
                        <v-text-field
                            v-model="numericValues[2]"
                            placeholder="1234"
                            maxLength="4"
                            @input="checkNumericalValue($event, 'input4')"
                            ref="input3"
                            single-line
                            variant="solo"
                            ></v-text-field>
                    </div>
                    <div>
                        <v-text-field
                            v-model="numericValues[3]"
                            placeholder="1234"
                            maxLength="4"
                            @input="checkNumericalValue($event, 'input5')"
                            ref="input4"
                            single-line
                            variant="solo"
                            ></v-text-field>
                    </div>
                </div>
                
                <!-- date/cvc -->
                <div class="date-cvc">
                    <!-- date -->
                    <div class="bloc-saisi date">
                        <div class="month">
                            <v-text-field
                                v-model="numericValues[4]"
                                @input="checkNumericalValue($event, 'input6')" 
                                ref="input5" 
                                placeholder="MM" 
                                maxLength="2" 
                                variant="solo"
                            ></v-text-field>
                        </div>
                        <div class="slash">/</div>
                        <div class="year">
                            <v-text-field
                                v-model="numericValues[5]"
                                @input="checkNumericalValue($event, 'input7')" 
                                ref="input6" 
                                placeholder="YY" 
                                maxLength="2" 
                                variant="solo"
                            ></v-text-field>
                        </div>
                    </div>
                    
                    <!-- cvc -->
                    <div class="bloc-saisi cvc">
                        <v-text-field
                            v-model="numericValues[6]"
                            @input="checkNumericalValue($event, 'input8')"
                            ref="input7"
                            placeholder="123" 
                            variant="solo"
                            maxLength="3"
                        ></v-text-field>
                    </div>
                </div>

                <!-- name card -->
                <div class="bloc-saisi name">
                    <v-text-field ref="input8" placeholder="Eddine Omar" variant="solo"></v-text-field>
                </div>

                <v-btn 
                    class="text-none"
                    rounded="xl" 
                    size="x-large"
                    variant="outlined"
                    block
                    @click="recharger()"
                >Enregistrer</v-btn>
            </div>

            <!-- Password -->
            <div 
                v-if="mode=='password'"
                class="password"
            >
                <div class="label text-center">Réinitialiser votre mots de passe.</div>

                <div class="contain-input">
                    <div class="label">Nouveau mot de passe.</div>
                    <v-text-field
                        v-model="passwordChange.password"
                        placeholder=""
                        single-line
                        :rules="[rules.required, rules.min]"
                        type="password"
                        variant="solo"
                        hint="Au moins 8 characters"
                        counter
                    ></v-text-field>
                </div>

                <div class="contain-input">
                    <div class="label">Confirmation du mot passe</div>
                    <v-text-field
                        v-model="passwordChange.passwordComfirmed"
                        placeholder=""
                        :rules="[rules.required, rules.min]"
                        type="password"
                        single-line
                        variant="solo"
                        hint="Au moins 8 characters"
                        counter
                    ></v-text-field>
                </div>

                <v-btn 
                    class="text-none"
                    rounded="xl" 
                    size="x-large"
                    variant="outlined"
                    block
                    @click="recharger()"
                >Continuer</v-btn>
            </div>

            <!-- End Pofile -->


            <!-- Map -->
            
            <div 
                v-if="mode=='map'"
                class="map"
            >
                <div class="infos-route">
                    <span class="time">{{ mapInfos.time }}</span> <span class="distance"> ({{ mapInfos.distance }})</span>
                </div>
                <div class="infos-sup">Le plus rapide selon l'etat actuel de la circulation</div>
            </div>

            <!-- End Map -->
        </div>

    </v-container>
</template>


<!--  -->
<script>
    import { defineComponent } from 'vue';
    import $ from 'jquery';

    // Components
    import Vue3DraggableResizable from 'vue3-draggable-resizable';
    import TrajetMember from '@/components/search/TrajetMember.vue';
    import ReservePlace from '@/components/menus/bottom/ReservePlace.vue';
    import Notification from '@/components/menus/bottom/Notification.vue';
    import GroupListCardsHistory from '@/components/menus/bottom/GroupListCardsHistory.vue';
    import TimeCard from './bottom/TimeCard.vue';
    import SelectNumber from './bottom/SelectNumber.vue';
   

    export default defineComponent({
        name: 'bottom-menu',
        emits: ["close", "time-valided", "time-changed", "day-valided", "opened", "close", "select-price", "drop-money", "up-money"], // <--- add this line
        components: {
            Vue3DraggableResizable,
            TrajetMember,
            ReservePlace,
            Notification,
            GroupListCardsHistory,
            TimeCard,
            SelectNumber,
        },
        computed: {
            numericRule() {
                return (value) => /^\d*$/.test(value) || 'Veuillez entrer uniquement des chiffres';
            },
            numericMask() {
                return { regex: /^[0-9]*$/ };
            },
        },
        props: {
            mode: {
                type: String,
                default: "history",
            },
            labelSelectorN1: {
                type: String,
                default: "LABEL-SELECTOR",
            },
            labelSelectorN2: {
                type: String,
                default: "LABEL-SELECTOR-2",
            },
            infos: {
                type: Object,
                default() {
                    return {
                            "depart": "Tsingoni",
                            "destination": "Mamoudzou",
                            "hour_start": "4:50",
                            "hour_end": "6:55",
                            "price": 4,
                            "name": "Ledou",
                            "passenger_number": 2
                        };
                },
            },
            paramsNumber: {
                type: Object,
                default() {
                    return {
                            min: 1,
                            max: 8,
                        };
                },
            },
            className: {
                type: Array,
                default: () => ([]),
            },
            timeInit: {
                type: Object,
                default() {
                    return {
                            hourInit: 1,
                            minuteInit: 8,
                        };
                },
            },
            mapInfos: {
                type: Object,
                default() {
                    return {
                        time: "",
                        distance: "",
                    };
                },
            },
        },
        data() {
            return {
                numericValues: ['', '', '', '', '', '', ''],
                x: 0,
                y: 0,
                notif: false,
                active: true,
                disabledY: false,
                sizeScreen: 0,
                move: false,
                marge_bar: 30,
                subContHeigth: 0,
                open_b: false,
                priceRecomended: {
                    min: 2,
                    max: 3,
                },
                daysSelected: [
                    {day: "L", selected: true},
                    {day: "M", selected: true},
                    {day: "M", selected: true},
                    {day: "J", selected: true},
                    {day: "V", selected: true},
                    {day: "S", selected: false},
                    {day: "D", selected: false},
                ],
                warn: 'low',
                numberSelected: 0,
                time: "",
                infosModelCar: [
                    {model: "MOTO", color: "silver", icon:"mdi-car"},
                    {model: "COMPACT", color: "white", icon:"mdi-car"},
                    {model: "BERLINE", color: "gray", icon:"mdi-car-estate"},
                    {model: "SUV", color: "red", icon:"mdi-car-pickup"},
                    {model: "MONO SPACE", color: "navy", icon:"mdi-car"},
                ],
                rules: {
                    required: value => !!value || 'Requis.',
                    min: v => v.length >= 8 || '8 characters minimum',
                    emailMatch: () => (`The email and password you entered don't match`),
                },
                passwordChange: {
                    password: "",
                    passwordComfirmed: "",
                },
            }
        },
        mounted() {

            this.sizeScreen = $(window).innerHeight();
            this.y = this.sizeScreen;
            
            const classBottomMenuNameJquery = this.className != "" && this.className != null ? `.bottom-menu.${this.className.join(".")}` : ".bottom-menu";
            $(classBottomMenuNameJquery).css("top", `${this.y}px`);
            const classSubContNameJquery = this.className != "" && this.className != null ? `.sub-cont.${this.className.join(".")}` : ".sub-cont";
            this.subContHeigth = $(classSubContNameJquery).outerHeight(true);

            console.log("classe-name", this.className, "screen-height", this.sizeScreen, "subContHeigth", this.subContHeigth, "object", $(classSubContNameJquery));
            if( this.mode=="select-day-hour-domicile" || this.mode=="notification" ){
                this.open();
            }
            
            $("div.sub-label-color").addClass("warn-good-to-low")
        },
        methods: {
            checkNumericalValue(event, nextInputRef){
                this.numericValues = this.numericValues.map(nums => nums.replace(/\D/g, ''));
                event.target.value = event.target.value.replace(/\D/g, '')
                if ( event.target.value.length == event.target.maxLength && nextInputRef != "") {
                    this.$refs[nextInputRef].focus();
                }
            },
            onDrag(pos) {
                this.move = true;
                this.active = false;

                const classBottomMenuNameJquery = this.className != "" && this.className != null ? `.bottom-menu.${Object.keys(this.className).join(".")}` : ".bottom-menu";
                $(classBottomMenuNameJquery).css("top", `${pos.y}px`);
                if (pos.y >= this.sizeScreen - this.marge_bar) {
                    this.close();
                }
            },
            onDragStop(pos) {
                if ( ! this.move ) {
                    if ( pos.y >= this.sizeScreen-this.marge_bar ) {
                        this.open();
                    }
                    else{
                        console.log("onDragStop")
                        this.close();
                    }
                    
                    const classBottomMenuNameJquery = this.className != "" && this.className != null ? `.bottom-menu.${this.className.join(".")}` : ".bottom-menu";
                    
                    $(classBottomMenuNameJquery).animate({"top": `${this.y}px`}, "fast");
                }
                else if ( this.move ) {
                    if ( pos.y >= this.sizeScreen - this.marge_bar ) {
                        this.disabledY = false;
                        this.y = this.sizeScreen - this.marge_bar;
                    }
                }

                this.move = false;
            },
            open(){
                this.subContHeigth = this.$refs.subCont.clientHeight;
                
                if ( ! this.open_b ) {
                    if ( this.y >= this.sizeScreen - this.marge_bar ) {
                        if( ! this.move ){
                            console.log("will-open")
                            // open
                            this.move = true;
                            this.disabledY = false;
                            this.y = this.sizeScreen - ( this.subContHeigth + 50 );
                            const _this = this;
                            const classBottomMenuNameJquery = this.className != "" && this.className != null ? `.bottom-menu.${this.className.join(".")}` : ".bottom-menu";
                           
                            $(classBottomMenuNameJquery).animate({"top": `${_this.y}px`}, "fast", function(){
                                $(this).animate({"top": "auto"}, 1000);
                                _this.y = parseInt($(this).css("top").replace("px", ""));
                                _this.move = false;
                            });

                            this.open_b = true;
                        }
                        else{
                            this.open_b = false;
                        }
                    }
                }

                return this.open_b;
            },
            openMiddle(){
                if ( ! this.open_b ) {
                    if ( this.y >= this.sizeScreen - this.marge_bar ) {
                        if( ! this.move ){
                            this.move = true;
                            // open
                            const _this = this;
                            this.disabledY = false;
                            this.y = this.sizeScreen/2;
                            const classBottomMenuNameJquery =  this.className != null && this.className.length != 0 ? `.bottom-menu.${this.className.join(".")}` : ".bottom-menu";
                            
                            $(classBottomMenuNameJquery).animate({"top": `${this.y}px`}, "fast", function(){
                                _this.open_b = true;
                                _this.move = false;
                                _this.$emit("opened");
                            });
                        }
                    }
                }

                return this.open_b;
            },
            close(){
                
                if( ! this.move && this.open_b ){
                    this.move = true;

                    this.y = this.sizeScreen;
                    
                    const _this = this;
                    const classBottomMenuNameJquery = this.className != "" && this.className != null ? `.bottom-menu.${this.className.join(".")}` : ".bottom-menu";
                    
                    $(classBottomMenuNameJquery).animate({"top": `${this.y}px`}, "fast", function(){
                        _this.move = false;
                        _this.$emit('close');
                    });

                    this.open_b = false;
                }
                else{
                    this.open_b = true;
                }

                return this.open_b;
            },
            selectDay(index) {
                this.daysSelected[index]["selected"] = !this.daysSelected[index]["selected"];
            },
            selectNumber(){
                if( this.$refs.SelectNumberRef ){
                    this.numberSelected = this.$refs.SelectNumberRef.number;
                    if( this.mode == "select-price" ){
                        if( this.$refs.SelectNumberRef.number < this.priceRecomended.min ){
                            $("div.sub-label-color").removeClass("warn-bad-to-good");
                            $("div.sub-label-color").removeClass("warn-low-to-good");
                            $("div.sub-label-color").removeClass("warn-good-to-bad");

                            $("div.sub-label-color").addClass("warn-good-to-low")
                            this.warn = 'low';
                        }
                        else if ( this.$refs.SelectNumberRef.number > this.priceRecomended.max ) {
                            
                            $("div.sub-label-color").removeClass("warn-low-to-good");
                            $("div.sub-label-color").removeClass("warn-bad-to-good");
                            $("div.sub-label-color").removeClass("warn-good-to-low");

                            $("div.sub-label-color").addClass("warn-good-to-bad");
                            this.warn = 'bad';
                        }
                        else{
                            if( ! $("div.sub-label-color").hasClass("warn-low-to-good") && ! $("div.sub-label-color").hasClass("warn-bad-to-good") ){
                                if( this.warn == 'low' ){
                                    $("div.sub-label-color").removeClass("warn-good-to-low")
                                    $("div.sub-label-color").addClass("warn-low-to-good");
                                }
                                else if( this.warn == 'bad' ){
                                    $("div.sub-label-color").removeClass("warn-good-to-bad");
                                    $("div.sub-label-color").addClass("warn-bad-to-good");
                                }
                            }
                            this.warn = 'good';
                        }
                    }
                }
            },
            recharger(){
                // TODO : get value
                this.$emit("up-money");
            },
            emit(value){
                if( value == "time-valided" ){
                    if(this.$refs.TimeCardRef){
                        this.time = this.$refs.TimeCardRef.getTime();
                    }
                }
                else if( value == "time-changed" ){
                    this.time = this.$refs.TimeCardRef.getTime();
                    console.log("emit-time-changed", this.time)
                }
                else if( value == "select-price" ){
                    this.numberSelected = this.$refs.SelectNumberRef.number;
                }
                this.$emit(value)
            },
        },
        watch:{
            y(){
                const classBottomMenuNameJquery = this.className != "" && this.className != null ? `.bottom-menu.${this.className.join(".")}` : ".bottom-menu";
                $(classBottomMenuNameJquery).css("top", `${this.y}px`);
            },
        }
   });
</script>
