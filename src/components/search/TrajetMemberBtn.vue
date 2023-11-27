
<style lang="scss" model>

    .card-trajet-member-btn {
        .v-list-item {
            .v-list-item__prepend{
                display: block !important;
            }
        }
        .mdi-navigation.mdi.v-icon.notranslate.v-theme--light.v-icon--size-default{
            color: #eee !important;
            opacity: inherit !important;
            z-index: 99;
            transform: rotate(180deg);
        }
        .part-list {
            padding: 0 0 10px 16px;
            .comune {
                .v-list-item {
                    padding: auto;
                }
            }
        }
        .card-trajet-member i.v-icon {
            font-size: 1.2em;
            margin-right: 10px !important;
        }
        .line {
            background-color: white !important;
            border: dotted 2px gray;
            width: 2px;
            height: 38px;
            position: absolute;
            left: 26.5px;
            top: 21px;
            z-index: 0;
            opacity: var(--v-medium-emphasis-opacity);
        }
        .flex {
            display: flex;
            &.comune {
                height: 35px;
            }
            &.avatar {
                margin-top: 12px;
            }
        }
        .v-chip {
            min-width: 56px;
            min-height: 32px;
            border-radius: 8px;
            text-align: center;
            display: grid;
            background-color: #eee !important;
            color: #eee !important;
            border-radius: 5px;
            &.prix {
                background-color: #eee !important;
                color: #eee !important;
                position: absolute;
                right: 8px;
                top: 8px;
                font-weight: bold;
                font-size: 1.1em;
            }
            &.rapport {
                background-color: #eee !important;
                color: #eee !important;
                position: absolute;
                right: 8px;
                bottom: 8px;
                font-weight: bold;
                font-size: 1.1em;
            }
        }

        &.v-card {
            .v-list{
                .v-list-item {
                    .v-list-item__content {
                        background-color: #eee !important;
                        color: #eee !important;
                        border-radius: 10px;
                    }
                }
            }
        }
    }

</style>

<style lang="scss" scoped>
    .v-card {
        background-color: var(--white-bg-color);
        margin: 20px;
        width: 87.2%;
        border-radius: 24px;
        box-shadow: var(--box-shadow-card);
        .v-list{
            .v-list-item {
                .v-list-item__content {
                    background-color: #eee !important;
                    color: #eee !important;
                    border-radius: 10px;
                }
            }
        }
        .hour {
            &.v-list-item {
                width: 73px;
                padding-right: 0;
            }
        }
    }
    .v-btn {
        position: relative;
        bottom: -8px;
        margin-top: 16px;
    }
    .empty-mask {
        //display: none;
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: var(--white-bg-color);
        z-index: 9;
        opacity: 0.7;
        z-index: 200;
    }
    .empty {
        //display: none;
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 9999;
        text-align: center;
        .v-icon {
            font-size: 5em;
            min-height: 100%;
            align-items: center;
            display: inline-flex;
            color: #484848;
            color: var(--font-color-label);
        }

        .nothing {
            display: table;
            text-align: center;
            height: 100%;
            .contenu {
                text-align: center;
                display: table-cell;
                vertical-align: middle;
                i {
                    font-size: 35px;
                    margin-bottom: 5px;
                    min-height: inherit;
                    color: var(--font-color-label);
                }
                span {
                    font-size: 17px;
                    text-transform: uppercase;
                    display: block;
                    color: var(--font-color-label);
                }
            }
        }
    }

</style>

<template>
    <v-card
        v-if="!empty"
        class="card-trajet-member-btn mx-auto"
        max-width="500"
    >
        <div class="empty-mask"></div>
        <div class="empty">
            <v-icon icon="fa:fa-brands fa-searchengin" />
        </div>
        <v-list>
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
                >
                    <v-img
                        alt="Avatar"
                        src="https://avataaars.io/?avatarStyle=Circle&topType=ShortHairDreads01&accessoriesType=Blank&hairColor=PastelPink&facialHairType=BeardMedium&facialHairColor=BrownDark&clotheType=BlazerShirt&eyeType=Wink&eyebrowType=DefaultNatural&mouthType=Serious&skinColor=Tanned"
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
                    {{ infos.passenger_number }}/4
                </v-chip>
            </div>

        </v-list>
    </v-card>

    <!-- empty -->
    <v-card
        v-else
        class="card-trajet-member-btn mx-auto"
        max-width="500"
    >
        <div class="empty-mask"></div>
        <div class="empty">
            <div
                class="nothing label-filter text-caption mx-auto"
            >
                <div class="contenu">
                    <v-icon icon="mdi-alert-circle-outline"></v-icon>
                    <span>Aucun trajet trouvé !</span>
                </div>
            </div>
        </div>
        <v-list>

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
                >
                    <v-img
                        alt="Avatar"
                        src="https://avataaars.io/?avatarStyle=Circle&topType=ShortHairDreads01&accessoriesType=Blank&hairColor=PastelPink&facialHairType=BeardMedium&facialHairColor=BrownDark&clotheType=BlazerShirt&eyeType=Wink&eyebrowType=DefaultNatural&mouthType=Serious&skinColor=Tanned"
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
                    {{ infos.passenger_number }}/4
                </v-chip>
            </div>

        </v-list>
    </v-card>
</template>


<script>

    // Components
    export default {
        name: 'trajet-member-btn-comp',
        props: {
            infos: {
                type: Object,
                default() {
                    return {
                        "depart": "XXXXXXX",
                        "destination": "XXXXXXX",
                        "hour_start": "X:XX",
                        "hour_end": "X:XX",
                        "price": 4,
                        "name": "XXXXXXXXXXXXX",
                        "passenger_number": 2
                    };
                },
            },
            empty: {
                type: Boolean,
                default: false,
            },
        },
        data() {
            return {
            }
        },
    };
</script>