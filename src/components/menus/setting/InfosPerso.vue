

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
            <div class="label text-subtitle">{{ group.label }}</div>
            <CardButton 
                v-for="(param, indexP) in group.parameters"
                :key="indexP"
                :prependIconColor="param.prependIconColor" 
                :prependIcon="param.prependIcon"
                :text="param.text"
                :chip="param.chip"
                :chipIcon="param.chipIcon"
                :chipText="param.chipText"
                :fun="group.fun"
            />
        </div>
    </div>
 
 </template>



<script>
    // Components
    import CardButton from '@/components/menus/setting/CardButton.vue';

    export default {
    name: "infos-perso-comp",
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
    mounted() {
    },
};
</script>

