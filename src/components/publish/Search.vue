
<style lang="scss" model>
   .blc-text.publish .v-input .v-input__prepend {
      margin-right: -5px !important;
      text-align: center;
   }
   .blc-text.publish .v-input .v-input__prepend i.v-icon.mdi-navigation.mdi.notranslate.v-theme--light.v-icon--size-default {
      transform: inherit;
   }
</style>

<!-- scss -->
<style lang="scss" scoped>
   

   .bloc {
        position: absolute;
        background-color: var(--bg-app-color);
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        .title {
            font-size: var(--font-size-h1);
            font-weight: bold;
            width: 100%;
            margin: 25px auto;
        }
        
        .blc-text {
            width: 85%;
        }
        .v-card {
            width: 90%;
            box-shadow: none;
            .v-input__prepend {
                margin-right: 0;
                text-align: center;
            }
        }

        .v-card.list {
            background-color: var(--bg-app-color);
            > .v-list {
                margin: auto;
                width: 90%;
                background-color: var(--bg-app-color);
            }
        }
        
   }

</style>
   
<!--  -->
<template>
    <div class="bloc">
        <div
            class="title text-center"
        >{{ title }}</div>

        <v-card
            style="overflow: visible;"
            class="mx-auto rounded-xl w-85 overflow-visible"
            max-width="500"
        >
            <v-list class="overflow-visible rounded-xl">

                <div class="publish blc-text mx-auto">
                    <v-text-field
                        v-model="saisi"
                        :label="label"
                        :focused="focus"
                        :active="focus"
                        :autofocus="focus"
                        persistent-hint
                        prepend-icon="mdi-navigation"
                        variant="solo"
                    ></v-text-field>
                </div>
                
            </v-list>
        </v-card>
        
        <v-card
            class="mx-auto list"
        >
            <v-list
            >
                <v-list-item
                    v-for="(item, index) in items"
                    :key="index"
                    :value="index"
                    @click="select(item)"
                >{{ item }}</v-list-item>
            </v-list>
        </v-card>
    </div>
</template>



<!--  -->
<script>
    import { defineComponent } from 'vue';

    // Components
    //...

    export default defineComponent({
        name: 'search-publish-comp',
        computed: {
        },
        props: {
            title: {
                type: String,
                default: "D'ou partez vous",
            },
            label: {
                type: String,
                default: "Choisissez une commune de depart",
            },
            items: {
                type: Array,
                default: () => [],
            },
            focus: {
                type: Boolean,
                default: false,
            }
        },
        data() {
            return {
                saisi: "",
            }
        },
        mounted(){
        },
        methods: {
            select(val){
                this.saisi = val;
                this.$emit("selected");
                return this.saisi;
            },
            getSaisi(){
                return this.saisi;
            },
        },
        watch: {
            saisi(){
                this.$emit("saisi");
            }
        }
    });
</script>
