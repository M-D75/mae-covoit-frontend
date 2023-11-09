<!-- scoped -->
<style lang="scss" model>
    .group-card-comp {
        .v-text-field {
            .v-field__input {
                color: var(--font-color-label);
            }
        }
    }

</style>

<!-- scoped -->
<style lang="scss" scoped>
    .group-card-comp {
        width: 82.5%;
        .label {
            margin-top: 14px;
            font-size: 14px;
            text-transform: capitalize;
            color: var(--font-color-label);
        }
        .v-text-field {
            background-color: var(--white-bg-color);
            border-radius: 10px;
            font-size: 16px;
            height: 50px;
            .v-field__input {
                color: var(--font-color-label);
            }
        }
    }

</style>


<!--  -->
<template>

    <div class="group-card-comp mx-auto">
        <div 
            v-for="(group, indexG) in groupInput"
            :key="indexG"
        >
            <div class="label text-subtitle">{{ group.label }}</div>
            <v-text-field 
                v-model="group.value" 
                variant="solo-filled"
                :disabled="'disabled' in group ? true : false"
                hide-details
                :persistent-placeholder="false"
                :persistent-hint="false"
            ></v-text-field>
        </div>
    </div>
 
 </template>



<script>
    //import $ from 'jquery'

    // Components

    export default {
        name: "group-card-btn-comp",
        components: {
        },
        props: {
            groupInput: {
                type: Array,
                default: () => [
                    {
                        label: "Civilite",
                        value: "Mr",
                    },
                    {
                        label: "Nom",
                        value: "Ledou",
                    },
                    {
                        label: "prénom",
                        value: "BGG",
                    },
                    {
                        label: "email",
                        value: "mail@bg.com",
                    },
                    {
                        label: "Téléphone",
                        value: "0606060606",
                    },
                    {
                        label: "Adresse",
                        value: "1 rue des BG",
                    },
                    {
                        label: "Complement",
                        value: "",
                    },
                    {
                        label: "Code Postal",
                        value: "97680",
                    },
                    {
                        label: "Commune",
                        value: "Tsingoni",
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

