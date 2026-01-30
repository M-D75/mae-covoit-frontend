
<style lang="scss" model>
</style>

<style lang="scss" scoped>
    @use '@/styles/mixins.scss' as mixins;
    .stats-trajet-profil {
        background-color: var(--white-bg-color);
        margin-top: 20px;
        height: 242px;
        width: 82.7%;
        padding: 25px;
        padding-bottom: 50px;
        border-radius: 24px;
        box-shadow: var(--box-shadow-card);
        @include mixins.respond-to('small') {
            width: 90%;
        }
        .row-item {
            position: relative;
            width: 100%;
            height: 50%;
            display: flex;
            
            &.infos {
                .col-item{
                    height: 37%;
                    width: 50%;
                    .label {
                        text-transform: uppercase;
                        font-size: 12px;
                        font-weight: 450;
                        color: var(--font-color-label);;

                    }
                    .trajet {
                        font-size: 20px;
                        font-weight: 500;
                        color: var(--font-color-label);
                    }
                    &.mode{
                        display: flex;
                        justify-content: space-around;
                        div{
                            cursor: pointer;
                            width: 28px;
                            height: 28px;
                            // border: 1px solid black;
                            border-radius: 50px;
                            text-align: center;
                            background-color: #B1B1B1;
                            font-family: unset;
                            color: white;
                            font-size: 1em;
                            font-weight: bold;
                            line-height: 1.7;
                            &.active{
                                background-color: #2E8DFF;
                            }
                        }
                    }
                }
            }
            &.bar {
                .col-item {
                    width: 100%;
                
                    .bloc {
                        display: flex;
                        justify-content: space-between;
                        .blc-back-bar {
                            .back-bar {
                                margin: auto;
                                .in-bar {
                                    -webkit-transition: max-height 1s; 
                                    -moz-transition: max-height 1s; 
                                    -ms-transition: max-height 1s; 
                                    -o-transition: max-height 1s; 
                                    transition: max-height 1s;
                                    max-height: 0%;
                                    height: 100%;
                                }
                            }
                            .sub-label{
                                color: var(--font-color-label);
                                margin-top: 5px;
                                text-align: left;
                                text-transform: capitalize;
                                font-size: 12px;
                                font-weight: 450;
                            }
                        }
                    }
                }
            }
        }
    }
</style>

<template>
    <v-card
      class="stats-trajet-profil mx-auto"
    >
        <div class="row-item infos">
            <div class="col-item">
                <div class="label"> {{ typeStats[categorie] }} </div>
                <div class="trajet">{{ numberTrajet }} {{numberTrajet > 1 ? 'trajets' : 'trajet'}}</div>
            </div>
            <div class="col-item mode">
                <div :class="{active: categorie=='week'}" @click="categorie='week'">S</div>
                <div :class="{active: categorie=='month'}" @click="categorie='month'">M</div>
                <div :class="{active: categorie=='year'}" @click="categorie='year'">A</div>
            </div>
        </div>

        <div class="row-item bar">
            <div class="col-item">
                <div
                    class="bar bloc"
                >
                    <div 
                        v-for="(stat, index) in stats"
                        :key="index"
                        class="blc-back-bar"
                    >
                        <div class="back-bar"
                            style="width: 16px; height: 94px; background-color: #f5f5f5; border-radius: 10px; position: relative;"
                        >
                            <div class="in-bar"
                                :style="`width: 16px; max-height: ${stat.val}%; background-color: #2e8dff; border-radius: 10px; position: absolute; bottom: 0;`"
                            ></div>
                        </div>
                        <div
                            class="sub-label"
                        >
                            {{ stat.month }}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    </v-card>
</template>


<script>
    //import $ from 'jquery'

    // Components
    export default {
        name: 'stats-trajet-comp',
        props: {
            
        },
        data() {
            return {
                numberBarStats: 7,
                typeStats: {month: "mensuel", year:"annuel", week: "hebdomadaire"},
                categorie: "month",
                stats: [
                    {
                        val: Math.floor(Math.random() * 101),
                        month: "Jan",
                    },
                    {
                        val: Math.floor(Math.random() * 101),
                        month: "Fév",
                    },
                    {
                        val: Math.floor(Math.random() * 101),
                        month: "Mar",
                    },
                    {
                        val: Math.floor(Math.random() * 101),
                        month: "Avr",
                    },
                    {
                        val: Math.floor(Math.random() * 101),
                        month: "Mai",
                    },
                    {
                        val: Math.floor(Math.random() * 101),
                        month: "Jui",
                    },
                    {
                        val: Math.floor(Math.random() * 101),
                        month: "Juil",
                    },
                    {
                        val: Math.floor(Math.random() * 101),
                        month: "Aoû",
                    },
                    {
                        val: Math.floor(Math.random() * 101),
                        month: "Sep",
                    },
                    {
                        val: Math.floor(Math.random() * 101),
                        month: "Oct",
                    },
                    {
                        val: Math.floor(Math.random() * 101),
                        month: "Nov",
                    },
                    {
                        val: Math.floor(Math.random() * 101),
                        month: "Déc",
                    },
                ].slice(0, 7),

                numberTrajet: 40,
            }
        },
        mounted() {
            const vue = this;
            setInterval(function () {
                vue.stats.map(d => d.val = Math.floor(Math.random() * 101) )
                // vue.stats[0].val = Math.floor(Math.random() * 101);
                vue.numberTrajet = Math.floor(Math.random() * 401)+1;
            }, 3000);

            if(window.innerWidth < 340){
                this.numberBarStats = 5;
                this.categorie = "year";
            }

        },
        methods: {
        },
        watch: {
            categorie(){
                switch (this.categorie) {
                    case 'week':
                    this.stats = [
                            {
                                val: Math.floor(Math.random() * 101),
                                month: "S1",
                            },
                            {
                                val: Math.floor(Math.random() * 101),
                                month: "S2",
                            },
                            {
                                val: Math.floor(Math.random() * 101),
                                month: "S3",
                            },
                            {
                                val: Math.floor(Math.random() * 101),
                                month: "S4",
                            },
                            {
                                val: Math.floor(Math.random() * 101),
                                month: "S5",
                            },
                            {
                                val: Math.floor(Math.random() * 101),
                                month: "S6",
                            },
                            {
                                val: Math.floor(Math.random() * 101),
                                month: "S7",
                            },
                            {
                                val: Math.floor(Math.random() * 101),
                                month: "S8",
                            },
                        ].slice(0, this.numberBarStats);
                        
                        break;
                    case 'month':
                        this.stats = [
                            {
                                val: Math.floor(Math.random() * 101),
                                month: "Jan",
                            },
                            {
                                val: Math.floor(Math.random() * 101),
                                month: "Fév",
                            },
                            {
                                val: Math.floor(Math.random() * 101),
                                month: "Mar",
                            },
                            {
                                val: Math.floor(Math.random() * 101),
                                month: "Avr",
                            },
                            {
                                val: Math.floor(Math.random() * 101),
                                month: "Mai",
                            },
                            {
                                val: Math.floor(Math.random() * 101),
                                month: "Jui",
                            },
                            {
                                val: Math.floor(Math.random() * 101),
                                month: "Juil",
                            },
                            {
                                val: Math.floor(Math.random() * 101),
                                month: "Aoû",
                            },
                            {
                                val: Math.floor(Math.random() * 101),
                                month: "Sep",
                            },
                            {
                                val: Math.floor(Math.random() * 101),
                                month: "Oct",
                            },
                            {
                                val: Math.floor(Math.random() * 101),
                                month: "Nov",
                            },
                            {
                                val: Math.floor(Math.random() * 101),
                                month: "Déc",
                            },
                        ].slice(0, this.numberBarStats);
                        break;

                    case 'year':
                        this.stats = [
                            {
                                val: Math.floor(Math.random() * 101),
                                month: "2015",
                            },
                            {
                                val: Math.floor(Math.random() * 101),
                                month: "2016",
                            },
                            {
                                val: Math.floor(Math.random() * 101),
                                month: "2017",
                            },
                            {
                                val: Math.floor(Math.random() * 101),
                                month: "2018",
                            },
                            {
                                val: Math.floor(Math.random() * 101),
                                month: "2019",
                            },
                            {
                                val: Math.floor(Math.random() * 101),
                                month: "2020",
                            },
                            {
                                val: Math.floor(Math.random() * 101),
                                month: "2021",
                            },
                            {
                                val: Math.floor(Math.random() * 101),
                                month: "2022",
                            },
                        ].slice(0, this.numberBarStats);
                        break;
                
                    default:
                        break;
     
                }
                
                this.stats.map(d => d.val = Math.floor(Math.random() * 101) )
                // vue.stats[0].val = Math.floor(Math.random() * 101);
                this.numberTrajet = Math.floor(Math.random() * 401)+1;
            },
        },
    };
</script>
