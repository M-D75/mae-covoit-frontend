

<!-- scoped -->
<style lang="scss" scoped>
    .group-card-comp {
        width: 82.5%;
        .label {
            margin-top: 14px;
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
            color: var(--font-color-label);
        }
    }

</style>


<!--  -->
<template>

    <div class="group-card-comp mx-auto">
        <div 
            v-for="(group, indexG) in groupeParameters"
            :key="indexG"
        >
            <div v-if="!group.disable" class="contain-lab-card">
                <div class="label text-subtitle">{{ group.label }}</div>
                <div 
                    v-for="(param, indexP) in group.parameters"
                    :key="indexP"
                    class="cont-lab-card"
                >
                    <CardButton 
                        v-if="param.none == undefined || param.none != false"
                        
                        :prependIconColor="param.prependIconColor" 
                        :prependIcon="param.prependIcon"
                        :text="param.text"
                        :chip="param.chip"
                        :chipIcon="param.chipIcon"
                        :chipText="param.chipText"
                        :fun="param.fun"
                        :switchBtn="param.switchBtn"
                        :classConfig="param.classConfig"
                    />
                </div>
            </div>
        </div>
    </div>
 
 </template>



<script>
    // import $ from 'jquery'

    // Components
    import CardButton from '@/components/menus/setting/CardButton.vue';

    export default {
        name: "group-card-btn-comp",
        components: {
            CardButton,
        },
        props: {
            groupeParameters: {
                type: Array,
                default: () => [
                    {
                        label: "Preferences",
                        parameters: [
                            {
                                prependIcon:"mdi-car",
                                text:"Text prepend chip",
                                chip:true,
                                chipIcon: null,
                                chipText: "",

                            },
                        ],
                    },
                    {
                        label: "Other",
                        parameters: [
                            {
                                prependIcon:"mdi-car",
                                text:"Text prepend and chipIcon",
                                chip:true,
                                chipIcon: "mdi-chevron-right",
                                chipText: "",

                            },
                            {
                                prependIcon:"",
                                text:"Text and no prepend",
                                chip:true,
                                chipIcon: null,
                                chipText: "",

                            },
                            {
                                prependIcon:"",
                                text:"Text and text chip",
                                chip:true,
                                chipIcon: null,
                                chipText: "chip-text",

                            },
                            {
                                prependIcon:"",
                                text:"Text and chip icon",
                                chip:true,
                                chipIcon: "mdi-chevron-right",
                                chipText: "",

                            },
                        ],
                    },
                ]
            },
        },
        data() {
            return {
                
            };
        },
        methods: {
        },
        mounted() {
            
        },
    };
</script>

