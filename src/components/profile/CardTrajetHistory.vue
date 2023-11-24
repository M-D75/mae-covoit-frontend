
<style lang="scss" model>
</style>

<style lang="scss" scoped>

    .card-trajet-history {
        border-radius: 24px;
        margin-right: 20px;
        margin-left: 0px !important;
        margin: auto;
        margin-top: 20px;
        width: 280px;
        overflow: visible;
        color: var(--font-color-label);
        .v-card {
            width: 280px;
            padding: 10px 25px;
            border-radius: 24px;
            overflow: visible;
            box-shadow: var(--box-shadow-card);
            background-color: var(--white-bg-color);
            color: var(--font-color-label);
            .header {
                width: 60%;
                padding: 5px;
                position: absolute;
                top: -20px;
                z-index: 50;
                background-color: var(--white-bg-color);
                display: flex;
                border-radius: 50px;
                box-shadow: var(--box-shadow-card-v2);
                .v-avatar {
                    margin-right: 10px;
                }
                .name {
                    color: var(--font-color-label);
                    margin: auto;
                    text-align: center;
                }
            }
            .v-list {
                background-color: var(--white-bg-color);
                color: var(--font-color-label);
                > div {
                    margin-top: 10px;
                    margin-bottom: 10px;
                    display: flex;
                    justify-content: space-between;
                    &.trajet {
                        margin-top: 30px;
                    }
                    &.infos {
                        div{
                            .v-icon {
                                color: var(--gray-bg-icon-color);
                            }
                            div.hour {
                                margin-left: 10px;
                            }
                        }
                        .v-chip {
                            font-weight: 700;
                        }
                    }
                }
            }
        }
    }

</style>

<template>

    <div class="card-trajet-history">

        <v-card
            class="mx-auto"
            max-width="500"
            @click="selectTrip()"
        >
            <div class="header">
                <v-avatar>
                    <v-img
                        alt="Avatar"
                        src="https://avatars0.githubusercontent.com/u/9064066?v=4&s=460"
                    ></v-img>
                </v-avatar>
                <span class="name">{{ infos.name }}</span>
            </div>
            
            <v-list>
                <div class="trajet">
                    <div>{{ infos.depart }}</div>
                    <v-icon>mdi-swap-horizontal</v-icon>
                    <div>{{ infos.destination }}</div>
                </div>
                <div class="infos">
                    <div style="display: flex; justify-content: space-between;">
                        <v-icon>mdi-clock</v-icon>
                        <div class="hour">{{ infos.hour_start }}</div>
                    </div>
                    <v-chip
                        class=""
                        color="blue"
                        label
                    >
                        {{ infos.price }}€
                    </v-chip>
                </div>

            </v-list>
        </v-card>
    </div>

</template>


<script>
    import { mapState, mapMutations, mapActions } from 'vuex';

   // Components
    export default {
        name: 'card-trajet-history-comp',
        emits: ["card-touched"],
        computed: {
            ...mapState("trip", ['driver', 'chat']),
        },
        props: {
            mode: {
                type: String,
                default: "",
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
        },
        methods: {
            ...mapMutations("trip", ["SET_TRIP_SELECTED"]),
            ...mapActions("trip", ["getContacts"]),
            async selectTrip(){
                this.SET_TRIP_SELECTED(this.infos);
                if( this.mode == 'trajets' ){
                    this.$router.push('/trip')
                }
                else{
                    await this.getContacts();
                    console.log("contacts:", this.chat.contacts);
                    if(this.chat.contacts.length > 0)
                        this.$router.push('/message');
                }
            },
        }
    };
</script>