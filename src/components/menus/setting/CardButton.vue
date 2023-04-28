<style lang="scss" model>
    .card-btn {
        .v-list-item__prepend {
            .v-icon {
                margin-right: 10px !important;
                color: v-bind(prependIconColor) !important;
            }
        }
        .v-list-item-title {
            font-weight: 450;
        }
    }
</style>

<!-- scoped -->
<style lang="scss" scoped>
    .v-card {
        border-radius: 15px;
        // width: 85%;
        margin: 10px auto 10px auto;
        &.card-btn {
            box-shadow: 2px 2px 10px #eee;
            height: 60px;
            .v-list-item {
                height: 100%;
                i.v-icon {
                    font-weight: bold;
                    color: #2e8dff;
                }

                .v-chip {
                    display: grid;
                    position: absolute;
                    right: 5px;
                    top: 7px;
                    min-width: 50px;
                    text-align: center;
                    .v-icon {
                        height: 100%;
                        color: #2e8dff !important;
                    }
                }
            }
        }
    }

</style>


<!--  -->
<template>

    <v-card
      class="card-btn mx-auto "
    >
        <v-list-item
            class="card-btn"
            :prepend-icon="prependIcon"
            :title="text"
        >
            <v-chip
                v-if="chip"
                class="ma-2 prix text-center"
                color="blue"
                label
            >
                
                <v-icon
                    v-if="chipText == ''"
                >
                    {{chipIcon}}
                </v-icon>
                {{chipText}}
            </v-chip>
        </v-list-item>
    </v-card>
 
 </template>



<script>
    import $ from 'jquery'

    // Components
    export default {
        name: 'card-btn-menu-comp',
        data() {
            return {
            }
        },
        props: {
            prependIcon: {
                type: String,
                default: "mdi-car",
            },
            text: {
                type: String,
                default: "Text",
            },
            chip: {
                type: Boolean,
                default: true,
            },
            chipIcon: {
                type: String,
                default: "mdi-chevron-right",
            },
            chipText: {
                type: String,
                default: "",
            },
            prependIconColor: {
                type: String,
                default: "gray",
            }
        },
        mounted (){
            // const vue = this;
            $(document).ready(function() {
            });
        },
    };
</script>

