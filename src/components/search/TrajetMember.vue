
<style lang="scss" model>
    @import "@/styles/mixins.scss";

    .card-trajet-member {
        color: var(--font-color-label) !important;
        .hour {
            
            &.v-list-item {
                overflow: visible;
                .v-list-item__content {
                    overflow: visible !important;
                    .v-list-item-title {
                        overflow: visible;
                        color: var(--font-color-label) !important;
                    }
                }
            }
        }

        .v-list-item {
            .v-list-item__prepend{
                display: block !important;
            }
        }

        .mdi-navigation.mdi.v-icon.notranslate.v-theme--light.v-icon--size-default{
            color: gray;
            opacity: inherit !important;
            z-index: 99;
            transform: rotate(180deg);
            margin-left: 0;
            margin-right: 10px;
        }
        .part-list {
            padding: 0 0 10px 16px;
            .comune {
                .v-list-item {
                    padding: auto;
                    @include respond-to('small') {
                        padding: 7px;
                    }
                }
            }
        }
        .card-trajet-member i.v-icon {
            font-size: 1.2em;
            margin-right: 10px !important;
        }
        .line {
            // background-color: gray;
            border: dotted 2px gray;
            width: 2px;
            height: 38px;
            position: absolute;
            left: 26.5px;
            @include respond-to('small') {
                left: 17.5px;
            }
            top: 22px;
            z-index: 0;
            opacity: var(--v-medium-emphasis-opacity);
        }
        .flex {
            display: flex;
            &.comune {
                height: 35px;
                color: var(--font-color-label);
            }
            &.avatar {
                margin-top: 12px;
                color: var(--font-color-label);
                @include respond-to('small') {
                    width: 60%;
                }
            }
        }
        .v-chip {
            min-width: 56px;
            min-height: 32px;
            border-radius: 8px;
            text-align: center;
            display: grid;
            right: 8px;
            @include respond-to('small') {
                right: 3px;
            }
            
            &.prix {
                position: absolute;
                top: 8px;
                font-weight: bold;
                font-size: 1.1em;
            }
            &.rapport {
                position: absolute;
                bottom: 8px;
                font-weight: bold;
                font-size: 1.1em;
            }
        }
    }
</style>

<style lang="scss" scoped>
    .v-card {
        position: relative;
        background-color: var(--white-bg-color);
        margin: 20px;
        width: 87.2%;
        border-radius: 24px;
        box-shadow: var(--box-shadow-card);
        color: var(--font-color-label);
        .hour {
            &.v-list-item {
                width: 50px;
                padding-right: 0;
                overflow: visible;
                .v-list-item__content {
                    overflow: visible !important;
                    .v-list-item-title {
                        overflow: visible;
                    }
                }
            }
        }

        .load {
            position: absolute;
            top: 0;
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            background: #1515157d;
            z-index: 999;
            .v-progress-circular {
                margin: auto;

            }
        }

        
    }
    .v-btn {
        position: relative;
        bottom: -8px;
        margin-top: 16px;
    }

</style>

<template>
    <v-card
        class="card-trajet-member mx-auto"
        max-width="500"
    >
        <v-list>

            <div v-if="loading" class="load apear-alpha">
                <v-progress-circular
                    indeterminate
                    color="primary"
                ></v-progress-circular>
            </div>

            <div class="part-list">
                <div>
                    <div class="comune flex">
                        <v-list-item
                            class="hour"
                            :title="infos.hour_start"
                        ></v-list-item>
                        <v-list-item
                            prepend-icon="mdi-navigation"
                            :title="infos.depart"
                        ><div class="line"></div></v-list-item>
                        
                    </div>

                    <div class="comune flex">
                        <v-list-item
                            class="hour"
                            :title="infos.hour_end"
                        ></v-list-item>
                        <v-list-item
                            prepend-icon="mdi-navigation"
                            :title="infos.destination"
                        ></v-list-item>
                    </div>
                </div>

                <div class="avatar flex">
                    <v-avatar
                        size="47px"
                        @click="$emit('touched-avatar')"
                    >
                        <v-img
                            alt="Avatar"
                            :src="infos.avatar"
                        ></v-img>
                    </v-avatar>
                    <!-- <v-avatar color="blue">
                        <span class="text-h5">{{infos.name[0].toUpperCase()}}</span>
                    </v-avatar> -->
                    <v-list-item
                        :title="infos.name"
                    ></v-list-item>
                </div>

                <v-chip
                    class="ma-2 prix"
                    color="blue"
                    label
                >
                    {{infos.price}}€
                </v-chip>

                <v-chip
                    class="ma-2 rapport"
                    color="blue"
                    label
                >
                    {{ infos.passenger_number }}/{{ infos.max_seats }}
                </v-chip>
            </div>

        </v-list>
    </v-card>
</template>


<script>

    // Components
    export default {
        name: 'trajet-member-comp',
        emits: ["touched-avatar"],
        props: {
            infos: {
                type: Object,
                default() {
                    return {
                        depart: "Tsingoni",
                        destination: "Mamoudzou",
                        hour_start: "4:50",
                        hour_end: "6:55",
                        price: 4,
                        name: "Ledou",
                        passenger_number: 2,
                        max_seats: 4
                    };
                },
            },
            load: {
                type: Boolean,
                default: false,
            }
        },
        data() {
            return {
                loading: false,
            }
        },
        watch: {
            load(){
                this.loading=this.load;
            },
        }
    };
</script>