<!-- model -->
<style lang="scss" model>
    .v-app-bar {
            box-shadow: var(--box-shadow-card) !important;
        // toolbar
        .v-toolbar {
            position: fixed;
        }
        .v-btn i.v-icon.icon-chev-left {
            margin-right: 0;
            // font-size: 2em;
        }
    }
</style>

<!-- scoped -->
<style lang="scss" scoped>
    .v-app-bar{
        // toolbar
        .v-toolbar {
            position: fixed;
            z-index: 1;
            background-color: var(--bg-app-color);
            box-shadow: var(--box-shadow-card);
            // natif bar notif safe zone
            padding-top: var(--safe-area-inset-top);
            margin-top: var(--safe-area-inset-top);

            .v-btn {
                i.v-icon {
                    margin-right: 0 !important;
                    color: var(--gray-icon-color);
                    &.mdi-chevron-left {
                        font-size: 2em;
                    }
                }

                &.active {
                    i.v-icon {
                        color: var(--blue-color);
                    }
                }
            }
            .v-toolbar-title {
                font-size: var(--font-size-h1-toolbar);
                color: var(--font-color-label);
                .text-subtitle-2 {
                    font-size: var(--font-size-subtitle-toolbar);
                }
            }
            .label-filter.text-caption {
                width: 85%;
            }
        }
    }

</style>
   
<!--  -->
<template>

    <v-app-bar
        extended
        :extension-height="barHeight"
    >
        <!-- toolbar -->
        <v-toolbar
            class=""
            color=""
            dark
        >
            <!-- <v-app-bar-nav-icon></v-app-bar-nav-icon> -->
            <v-btn 
                icon
                @click="previous()"
            >
                <v-icon
                    class="icon-chev-left mr-0"
                >mdi-chevron-left</v-icon>
            </v-btn>
            
            <v-toolbar-title
                v-if="mode=='date-dep-dest'"
                class="ml-5 mr-5"
            >
                {{trajet.depart}} vers {{trajet.destination}} 
                <div class="text-subtitle-2 font-weight-medium">{{date}}, {{nbPassenger}} passager</div>
            </v-toolbar-title>

            <v-toolbar-title
                v-if="mode=='shared-ids'"
                class="ml-5 mr-5"
            >
                Partagé par {{ user_shared.firstname }} {{ user_shared.lastname }}
                <!-- <div class="text-subtitle-2 font-weight-medium">{{date}}, {{nbPassenger}} passager</div> -->
            </v-toolbar-title>

            <v-btn 
                icon
                :class="{active: filterOpen}"
                @click="$emit('open-filter')"  
            >
                <v-icon>mdi-filter</v-icon>
            </v-btn>
        </v-toolbar>
    </v-app-bar>
</template>



<!--  -->
<script>
    import { defineComponent } from 'vue';
    import { SafeAreaController, SafeArea } from '@aashu-dubey/capacitor-statusbar-safe-area';

    export default defineComponent({
        name: 'toolbar-comp',
        emits: ["open-filter"],
        components: {
        },
        props: {
            mode: {
                type: String,
                default: "date-dep-dest",
            },
            user_shared: {
                type: Object,
                default (){
                    return {firstname: "prénom", lastname: "nom"};
                },
            },
            trajet: {
                type: Object,
                default (){
                    return {depart: "Tsingoni", destination: "Mamoudzou"};
                },
            },
            date: {
                type: String,
                default: "Aujourd'hui",
            },
            nombre_trajet: {
                type: Number,
                default: 1,
            },
            nbPassenger: {
                type: String,
                default: "0",
            },
            filterOpen: {
                type: Boolean,
                default: false,
            }
        },
        data() {
            return {
                barHeight: 0,
            }
        },
        mounted() {
            SafeAreaController.injectCSSVariables();

            this.initStatusBarHeight();
        },
        methods: {
            previous(){
                this.$router.go(-1);
            },
            async initStatusBarHeight(){
                const insets = await this.getSafeAreaInsets();
                this.barHeight = insets["top"];
            },
            async getSafeAreaInsets () {
                const insets = await SafeArea.getSafeAreaInsets();
                return insets; // Ex. { "bottom":34, "top":47, "right":0, "left":0 }
            },
        }
    });
</script>
