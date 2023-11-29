<!-- scoped -->
<style lang="scss" model>
    .group-card-comp {

        .v-text-field {
            .v-input__control{
                .v-field {
                    .v-field__outline{
                        display: none;
                    }
                }
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
            color: var(--font-color-label);
        }

        .v-btn{
            margin: 30px auto;
        }
    }

</style>


<!--  -->
<template>

    <div class="group-card-comp mx-auto">
        <div 
            v-for="(group, indexG) in groupInputWritable"
            :key="indexG"
        >
            <div class="label text-subtitle">{{ group.label }}</div>
            <v-text-field 
                v-if=" ! group.typeInput || group.typeInput == 'text-field'"
                v-model="group.value" 
                variant="outlined"
                :disabled="'disabled' in group ? true : false"
                hide-details
                @input="funInput($event, group.fn, group.id)"
                :ref="group.id"
                :persistent-placeholder="false"
                :persistent-hint="false"
            ></v-text-field>

            <v-select
                v-if="group.typeInput == 'select'"
                :items="group.items"
                v-model="group.value"
                variant="outlined"
            ></v-select>

            <v-autocomplete
                v-if="group.typeInput == 'autocomplete'"
                :label="group.label"
                :items="group.items"
                v-model="group.value"
                variant="outlined"
            ></v-autocomplete>
        </div>

        <v-btn
            class="map-btn mr-4 text-none"
            rounded="xl" 
            size="x-large"
            variant="outlined"
            block
            @click="valid()"
        >
            Valider
        </v-btn>
    </div>

    <!-- message -->
    <v-snackbar
        v-model="showSnackbar"
        :timeout="4000"
    >
        <v-icon icon="$success"></v-icon> <span>{{ messageSnackbar }}</span>
    </v-snackbar>
 
 </template>



<script>
    //import $ from 'jquery'
    import { mapMutations } from 'vuex';

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
                        id: "civilite",
                        label: "Civilite",
                        value: "Mr",
                    },
                    {
                        id: "nom",
                        label: "Nom",
                        value: "Ledou",
                    },
                    {
                        id: "prenom",
                        label: "prénom",
                        value: "BGG",
                    },
                    {
                        id: "email",
                        label: "email",
                        value: "mail@bg.com",
                    },
                    {
                        id: "tel",
                        label: "Téléphone",
                        value: "0606060606",
                    },
                    {
                        id: "principal",
                        label: "Adresse",
                        value: "1 rue des BG",
                    },
                    {
                        id: "complement",
                        label: "Complement",
                        value: "",
                    },
                    {
                        id: "code_postal",
                        label: "Code Postal",
                        value: "97680",
                    },
                    {
                        id: "commune",
                        label: "Commune",
                        value: "Tsingoni",
                    },
                ]
            },
        },
        data() {
            return {
                showSnackbar: false,
                messageSnackbar: "",
                groupInputWritable: [],
            };
        },
        methods: {
            ...mapMutations("profil", ["SET_INFOS"]),
            valid(){
                console.log("goupInput", this.groupInput);
                let data = {};
                for (let index = 0; index < this.groupInput.length; index++) {
                    const element = this.groupInput[index];
                    data[element.id] = element.value;
                }
                console.log("data", data);
                this.SET_INFOS(data);
                this.messageSnackbar = "Mise à jour effectuée !";
                this.showSnackbar = true;
            },
            checkNumericalValue(event){
                event.target.value = event.target.value.replace(/\D/g, '')
            },
            funInput(event, fn, ref){
                if( fn == "checkNumericalValue"){
                    this.checkNumericalValue(event, ref)
                }
            }
        },
        mounted() {
            this.groupInputWritable = this.groupInput;
        },
    };
</script>

