<!-- scss -->
<style lang="scss" model>
    .v-main.identity{
        .v-row + .v-row{
            margin-top: 7px;
        }
        .v-row{
            .v-col{
                padding: 5px;
                .v-card{
                    .v-card-item {
                        .v-card-item__prepend {
                            .v-avatar {
                                .v-icon {
                                    font-size: 35px;
                                }
                            }
                        }
                    }
                }
            }
        }
    }
</style>

<style lang="scss" scoped>
    .v-main{

        .btn-close {
            color: var(--font-color-label);
            background-color: var(--bg-app-color);
        }
        .title {
            font-size: var(--font-size-h1);
            color: var(--font-color-label);
            font-weight: bold;
            width: 100%;
            padding: 0 39px 0px 39px;
            margin: 20px auto;
        }

        .v-row{
            .v-card{
                width: 90%;
                .v-card-item {
                    .v-card-item__prepend {
                        .v-avatar {
                            .v-icon {
                                font-size: 35px;
                            }
                        }
                    }
                }
            }
        }
    }
</style>
   
<!--  -->
<template>

    <!-- ? -->
    <v-main class="identity">

        <v-btn
            class="btn-close"
            icon="mdi-close"
            style="position: absolute; left: 0; top: 0;"
            variant="text"
            @click="$emit('close')"
        />

        <!-- Title -->
        <div
            class="title text-center"
        >Vérification d'identité</div>


        <v-row 
            class=""
        >
            <v-col>
                <v-card
                    class="mx-auto"
                    max-width="344"
                    title="Email"
                    subtitle="Email vérifiée"
                    prepend-icon="mdi-at"
                >
                    <template v-slot:append>
                        <v-btn
                            color="green"
                            icon="mdi-check-circle"
                            variant="text"
                        ></v-btn>
                    </template>
                </v-card>
            </v-col>
        </v-row>
        
        <v-row 
            class=""
        >
            <v-col>
                <v-card
                    class="mx-auto"
                    max-width="344"
                    title="Permis de conduire"
                    subtitle="Aucun permis de conduire"
                    prepend-icon="mdi-card-account-details-outline"
                >
                    <template v-slot:append>
                        <v-btn
                            color="grey-lighten-1"
                            icon="mdi-check-circle"
                            variant="text"
                        ></v-btn>
                    </template>
                </v-card>
            </v-col>
        </v-row>

        <v-row 
            class=""
        >
            <v-col>
                <v-card
                    class="mx-auto"
                    max-width="344"
                    title="RIB"
                    subtitle="Aucun RIB"
                    prepend-icon="mdi-bank-outline"
                >
                    <template v-slot:append>
                        <v-btn
                            color="grey-lighten-1"
                            icon="mdi-check-circle"
                            variant="text"
                        ></v-btn>
                    </template>
                </v-card>
            </v-col>
        </v-row>

        <!-- <v-row>
            <v-file-input
                v-model="files"
                color="deep-purple-accent-4"
                counter
                label="File input"
                multiple
                placeholder="Select your files"
                prepend-icon="mdi-paperclip"
                variant="outlined"
                :show-size="1000"
            >
                <template v-slot:selection="{ fileNames }">
                <template v-for="(fileName, index) in fileNames" :key="fileName">
                    <v-chip
                    v-if="index < 2"
                    color="deep-purple-accent-4"
                    label
                    size="small"
                    class="me-2"
                    >
                    {{ fileName }}
                    </v-chip>

                    <span
                    v-else-if="index === 2"
                    class="text-overline text-grey-darken-3 mx-2"
                    >
                    +{{ files.length - 2 }} File(s)
                    </span>
                </template>
                </template>
            </v-file-input>
        </v-row> -->
    </v-main>

</template>



<!--  -->
<script>
    import { defineComponent } from 'vue';
    // import { mapMutations, mapState } from 'vuex';

    // Components
    // ...

    export default defineComponent({
        name: 'identity-comp',
        emits: ["close"],
        computed: {
        },
        components: {
        },
        props: {
        },
        data() {
            return {
                files: [],
            }
        },
        methods: {
        }
    });
</script>
