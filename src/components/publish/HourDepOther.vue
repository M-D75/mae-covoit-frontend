
<style lang="scss" model>
    .hour-dep-other {
        .v-btn {
            margin: 20px auto;
            color: var(--font-color-label) !important;
        }

        .v-switch {
            .v-selection-control {
                min-height: inherit !important;
            }
        }
    }
</style>

<!-- scss -->
<style lang="scss" scoped>
    .hour-dep-other {
        overflow: scroll;
        padding-bottom: 110px;
        height: 100vh;
        .title {
            font-size: var(--font-size-h1);
            color: var(--font-color-label);
            font-weight: bold;
            width: 100%;
            padding: 0 39px 0px 39px;
            margin: 30px auto;
        }

        .cont {
            background-color: var(--bg-app-color);
            width: 90%;
            margin: auto;
            .sub-cont {
                .day {
                    font-size: medium;
                    font-weight: bold;
                    text-transform: capitalize;
                    color: var(--font-color-label);
                }
                .choice {
                    margin: 10px 0;
                    border-radius: 15px;
                    box-shadow: var(--box-shadow-card);
                    background-color: var(--white-bg-color);
                    position: relative;
                    
                    .dom, .work {
                        display: flex;
                        justify-content: space-between;
                        height: 51px;
                        div {
                            width: 100%;
                            margin: auto;
                            color: var(--font-color-label);
                            &.type {
                                text-align: left;
                                padding-left: 15px;
                                
                            }
                            &.hour {
                                text-align: center;
                            }
                            &.btn {
                                .v-switch {
                                    width: fit-content;
                                    position: relative;
                                    right: 0px;
                                    .v-selection-control {
                                        min-height: inherit !important;
                                    }
                                }
                            }
                        }
                    }

                    .dom {
                        border-bottom: 2px solid #d8d8d8;
                    }

                    .work {
                        border-top: 2px solid #d8d8d8;
                    }
                }
            }
        }
    }
</style>
   
<!--  -->
<template>
    <div class="hour-dep-other">
        <div
            class="title text-center"
        >Indiquez vos horaires</div>

        <div class="cont">

            <div 
                v-for="(day, index) in daysHourShow"
                :key="index"
                class="sub-cont"
            >
                <div
                    class="day"
                >
                    {{ day.day }}
                </div>

                <div
                    class="choice"
                >
                    <div class="dom">
                        <div class="type">Domicile</div>
                        <div @click="editHour('home', index)" class="hour">{{ day.hour.home }}</div>
                        <div class="btn">
                            <v-switch
                                hide-details
                                dark
                                color="blue"
                                v-model="day.values.home"
                                @change="updateDayHour(index)"
                            ></v-switch>
                        </div>
                    </div>

                    <div class="work">
                        <div class="type">Travail</div>
                        <div @click="editHour('work', index)" class="hour">{{ day.hour.work }}</div>
                        <div class="btn">
                            <v-switch
                                hide-details
                                dark
                                color="blue"
                                v-model="day.values.work"
                                @change="updateDayHour(index)"
                            ></v-switch>
                        </div>
                    </div>
                </div>

            </div>
        </div>
        
        <div class="cont">
            <v-btn
                class="text-none"
                rounded="xl" 
                size="x-large"
                variant="outlined"
                block
                @click="$emit('hour-dep-other-valided')"
            >Continuer</v-btn>
        </div>
    </div>

    <BottomMenu
        :ref="`BottomMenuRefHourDepOther`"
        :class-name="[`select_day_hour_domicile_hour_dep_other`]"
        mode="select-day-hour-domicile"
        labelSelectorN1="Repeter quel jour ?"
        :labelSelectorN2="`Heure de départ du ${labelMode}`"
        :time-init="timeInit"
        v-on:close="overlay = false"
        v-on:time-valided="getSelected()"
    /> 

    <!-- overlay -->
    <v-overlay 
        v-model="overlay" 
        contained
        persistent
        style="z-index: 99;"
        @click="close()"
    ></v-overlay>

</template>



<!--  -->
<script>
    //import $ from 'jquery';
    import { defineComponent } from 'vue';
    import { mapState } from 'vuex';


    // Components
    import BottomMenu from '@/components/menus/BottomMenu.vue';

    export default defineComponent({
        name: 'hour-dep-other-view',
        emits: ['hour-dep-other-valided'],
        computed: {
            ...mapState(["trajets"]),
        },
        components: {
            BottomMenu,
        },
        props: {
            hour: {
                type: Object,
                default: () => (
                    {
                        home: "08:00",
                        work: "17:00",
                    }
                ),
            },
        },
        data() {
            return {
                overlay: false,
                labelMode: 'domicile',
                timeInit: {
                    hourInit: 7,
                    minuteInit: 0,
                    nbPasMinutes: 5,
                },
                daysHourShow: [
                    {
                        day: "lundi - vendredi",
                        hour: {
                            home: "08:00",
                            work: "17:00",
                        },
                        values: {
                            home: true,
                            work: true,
                        }
                    }, 
                    {
                        day: "samedi - dimanche",
                        hour: {
                            home: "08:00",
                            work: "17:00",
                        },
                        values: {
                            home: false,
                            work: false,
                        }
                    }, 
                ],
                daysHour: [
                    {
                        day: "lundi",
                        hour: {
                            home: "08:00",
                            work: "17:00",
                        },
                        values: {
                            home: true,
                            work: true,
                        }
                    }, 
                    {
                        day: "mardi",
                        hour: {
                            home: "08:00",
                            work: "17:00",
                        },
                        values: {
                            home: true,
                            work: true,
                        }
                    },
                    {
                        day: "mercredi",
                        hour: {
                            home: "08:00",
                            work: "17:00",
                        },
                        values: {
                            home: true,
                            work: true,
                        }
                    },
                    {
                        day: "jeudi",
                        hour: {
                            home: "08:00",
                            work: "17:00",
                        },
                        values: {
                            home: true,
                            work: true,
                        }
                    },
                    {
                        day: "vendredi",
                        hour: {
                            home: "08:00",
                            work: "17:00",
                        },
                        values: {
                            home: true,
                            work: true,
                        }
                    },
                    {
                        day: "samedi",
                        hour: {
                            home: "08:00",
                            work: "17:00",
                        },
                        values: {
                            home: false,
                            work: false,
                        }
                    },
                    {
                        day: "dimanche",
                        hour: {
                            home: "08:00",
                            work: "17:00",
                        },
                        values: {
                            home: false,
                            work: false,
                        }
                    },
                ],
                daysSelected: {
                    home: [],
                    work: [],
                },
            }
        },
        mounted(){
            console.log("mounted===hourdepOther", this.hour);
            for (let index = 0; index < this.daysHour.length; index++) {
                this.daysHour[index].hour.home = this.hour.home;
                this.daysHour[index].hour.work = this.hour.work;
            }

            if( this.$refs.BottomMenuRefHourDepOther ){
                this.daysSelected.home = this.$refs.BottomMenuRefHourDepOther.daysSelected;
                this.daysSelected.work = this.$refs.BottomMenuRefHourDepOther.daysSelected;
            }

            this.updateHourShow();
        },
        methods: {
            editHour(val, index){
                this.labelMode = val == 'home' ? 'domicile' : 'travail';
                if( val == 'home' ){
                    this.timeInit = this.convertTimeToObj(this.daysHourShow[index].hour.home);
                }
                else{
                    this.timeInit = this.convertTimeToObj(this.daysHourShow[index].hour.work);
                }

                if( this.$refs["BottomMenuRefHourDepOther"] ){
                    this.overlay = this.$refs["BottomMenuRefHourDepOther"].open();
                }
            },
            getSelected(){
                if( this.$refs.BottomMenuRefHourDepOther ){
                    if( this.labelMode == 'domicile' ){
                        this.daysSelected.home = this.$refs.BottomMenuRefHourDepOther.daysSelected;
                        
                        for (let index = 0; index < this.daysSelected.home.length; index++) {
                            if( this.daysSelected.home[index].selected ){
                                this.daysHour[index].values.home = true;
                                this.daysHour[index].hour.home = this.$refs.BottomMenuRefHourDepOther.time;
                            }
                        }
                    }
                    else{
                        this.daysSelected.work = this.$refs.BottomMenuRefHourDepOther.daysSelected;

                        for (let index = 0; index < this.daysSelected.work.length; index++) {
                            if( this.daysSelected.work[index].selected ){
                                this.daysHour[index].values.work = true;
                                this.daysHour[index].hour.work = this.$refs.BottomMenuRefHourDepOther.time;
                            }
                        }
                    }

                    this.$refs.BottomMenuRefHourDepOther.close();
                }

                this.updateHourShow();
            },
            updateHourShow(){
                let group = [];
                let min = 0;
                let max = 0;
                let obj = JSON.parse(JSON.stringify(this.daysHour[0]));
                delete obj.day;
                for (let index = 0; index < this.daysHour.length-1; index++) {
                    if( this.equalDayHour(this.daysHour[index], this.daysHour[index+1]) ){
                        max+=1;
                    }
                    else{
                        group.push({min: min, max: max, obj:obj});
                        min=index+1;
                        max=index+1;
                        obj = JSON.parse(JSON.stringify(this.daysHour[index+1]));
                        delete obj.day;
                    }
                }

                group.push({min: min, max: max, obj: obj});

                // console.log(group);

                this.daysHourShow = [];
                for (let index = 0; index < group.length; index++) {
                    const min = group[index].min;
                    const max = group[index].max;
                    const obj = group[index].obj;
                    if( group[index].min != group[index].max ){
                        this.daysHourShow.push({ ...{day: `${this.daysHour[min].day} - ${this.daysHour[max].day}`
                                ,min: min
                                ,max: max
                            }
                            , ...obj });
                    }
                    else {
                        this.daysHourShow.push({ ...{day: `${this.daysHour[min].day}`
                                ,min: min
                                ,max: max
                            }
                            , ...obj });
                    }
                }
            },
            updateDayHour(indexDHS){
                const min = this.daysHourShow[indexDHS].min;
                const max = this.daysHourShow[indexDHS].max;
                
                for (let indexDH = min; indexDH <= max; indexDH++) {
                    this.daysHour[indexDH].values.home = this.daysHourShow[indexDHS].values.home;
                    this.daysHour[indexDH].values.work = this.daysHourShow[indexDHS].values.work;
                }

                console.log(this.daysHour, this.daysHourShow);
            },
            equalDayHour(dayHour1, dayHour2){
                return dayHour1.hour.home == dayHour2.hour.home
                    && dayHour1.hour.work == dayHour2.hour.work
                    && dayHour1.values.home == dayHour2.values.home
                    && dayHour1.values.work == dayHour2.values.work;
            },
            convertTimeToObj(timeStr) {
                // console.log("timeStr", timeStr);
                const parts = timeStr.split(":");

                const hours = parseInt(parts[0], 10);
                const minutes = parseInt(parts[1], 10);

                return {
                    hourInit: hours,
                    minuteInit: minutes,
                    nbPasMinutes: 5,
                };
            },
            close(){
                if( this.overlay ){
                    this.overlay = false;
                    if(this.$refs.BottomMenuRefHourDepOther){
                        this.$refs.BottomMenuRefHourDepOther.close();
                    }
                }
            }
        },
        watch: {
            hour(){
                console.log("hour-changed:", this.hour);
                for (let index = 0; index < this.daysHour.length; index++) {
                    this.daysHour[index].hour.home = this.hour.home;
                    this.daysHour[index].hour.work = this.hour.work;
                }

                this.updateHourShow();
            },
        },
    });
</script>
