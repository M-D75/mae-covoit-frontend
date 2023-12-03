
<style type="text/css">
    .circle-back {
        width: 100px;
        height: 100px;
        background-color: v-bind(color);
        opacity: 0.1;
        position: absolute;
        border-radius: 100px;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        
    }
    .icon-and-back {
        position: relative;
    }
</style>

<style lang="scss" scoped>
    .v-container {
        background-color: var(--white-bg-color);
        display: flex;
        align-items: center;
        box-shadow: none;
        width: 100%;
        min-height: 100%;
        .v-card {
            background-color: var(--white-bg-color);
            margin-top: 30px;
            overflow: visible;
            width: 100%;
            box-shadow: none;
            i.v-icon {
                margin: 0 !important;
            }
            .text-notif {
                // margin-top: 90px;
                font-size: 16px;
                padding: 50px 15px;
                color: var(--font-color-label);
            }

            .v-btn {
                margin: 0px auto;
                margin-top: 80px;
                color: var(--font-color-label);
            }
        }
    }
   

 </style>

<template>
    <v-container
        class="position-relative"
    >
        <v-card
            class="mx-auto"
        >
            <div class="text-center">

                <div v-if="labelHead != '' && labelHead!=null" class="text-notif font-weight-bold">{{ labelHead }}</div>
                <div class="icon-and-back">
                <div class="circle-back"></div>
                <v-icon
                    class="mr-0"
                    :color="color"
                    :icon="icon"
                    size="80"
                    style="margin: 0;"
                ></v-icon>
                </div>
                <div v-if="message != '' && message!=null" class="text-notif font-weight-bold">{{ message }}</div>

                <v-btn 
                v-if="labelBtn!=''"
                class="text-none"
                rounded="xl" 
                size="x-large"
                variant="outlined"
                block
                @click="action()"
                >{{ labelBtn }}</v-btn>
            </div>
        </v-card>
    </v-container>
</template>


<script>
    import $ from 'jquery'

    // Components
    export default {
        name: 'notif-bottom-menu',
        data() {
            return {
                number_trajet: 1,
            }
        },
        props: {
            message: {
                type: String,
                default: "",
            },
            icon: {
                type: String,
                default: "mdi-check-circle",
            },
            color: {
                type: String,
                default: "#9fcb66",
            },
            labelBtn: {
                type: String,
                default: '',
            },
            labelHead: {
                type: String,
                default: '',
            },
            mode: {
                type: String,
                default: '',
            },
        },
        mounted (){
            // const vue = this;
            $(document).ready(function() {
                $(".cont-btn-switch").on("click", function(){
                console.log("switch")
                });
            });
        },
        methods: {
            action(){
                console.log("action:");
                console.log("mode--", this.mode);
                this.$emit(this.mode);
            },
        },
    };
</script>