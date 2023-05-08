<!-- scss -->
<!-- scss -->
<style lang="scss" model>
    .inf-comp {
        .blc-btn {
            div.label {
                width: 100% !important;
                font-size: 20px !important;
                text-align: center !important;
                text-transform: uppercase !important;
                font-weight: 450 !important;
            }
        }
    }
</style>

<style lang="scss" scoped>

    /* ? */
    .inf-comp {
        border-radius: 24px;
        border: solid white 10px;
        margin-top: 30px;
        margin-bottom: 15px;
        background-color: var(--white-bg-color);
        width: 82.7%;
        height: 94px;
        .blc-btn {
            border-radius: 15px;
            height: 100%;
            display: flex;
            align-items: center;
            background-color: #f5f5f5;
            div {
                
                width: 33%;
                text-align: center;
                &.btn {
                    cursor: pointer;
                }
                .text-subtitle{
                    margin-top: 5px;
                    text-transform: uppercase;
                    text-align: center;
                    width: 100%;
                    color: #616161;
                    font-size: 12px;
                    font-weight: bold;
                }
            }
        }
    }

</style>
   
<!--  -->
<template>

    <!-- ? -->
    <div
        class="inf-comp mx-auto"
    >
        <div
            class="blc-btn"
        >
            <div 
                v-for="(info, index) in infos_panneau"
                :key="index"
                :class="{btn : info.btn}"
                @click="choiceFunctionBtnInfo(info.text)"
                >
                
                <div v-if="info.label && ! info.icon" class="label text-body-2">{{ info.label }}</div>
                <v-icon v-if="info.icon">
                    {{info.icon}}
                </v-icon>
                <div class="text-subtitle">{{info.text}}</div>
            </div>
        </div>
    </div>

</template>



<!--  -->
<script>
    import { defineComponent } from 'vue';

    // Components
    // ...

    export default defineComponent({
        name: 'info-comp',

        components: {
        },
        props: {
            modeEdit: {
                type:Boolean,
                default:true,
            },
            infos_panneau: {
                type:Array,
                default: () => [
                    {
                        btn:true,
                        icon:"mdi-history",
                        text:"historique",
                    },
                    {
                        btn:false,
                        icon:"mdi-car",
                        text:"chauffeur",
                    },
                    {
                        btn:true,
                        icon:"mdi-lightbulb-on",
                        text:"mode",
                    },
                ]
            },
        },
        data() {
            return {
                
            }
        },
        methods: {
            choiceFunctionBtnInfo(name){
                switch (name.toLowerCase()) {
                    case 'mode':
                        this.test2();
                        break;
                    case 'historique':
                        this.test3();
                        break;
                    case 'Papayas':
                        console.log('Mangoes and papayas are $2.79 a pound.');
                        // Expected output: "Mangoes and papayas are $2.79 a pound."
                        break;
                    default:
                        console.log(`Sorry, we are out of ${name}.`);
                }
            },
            test2(){
                console.log("text2")
            },
            test3(){
                console.log("text3")
            }
        }
    });
</script>
