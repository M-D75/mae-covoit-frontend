

<!-- scoped -->
<style lang="scss" scoped>
    .group-card-comp {
        width: 82.5%;
        .title{
            font-size: 16px;
            font-weight: bold;
            text-align: center;
        }

        .text {
            font-size: 14px;
            font-weight:lighter;
            color: gray;
            text-align: justify;
            white-space: pre-line;
        }

        .v-btn{
            margin-top: 20px;
        }
    }

</style>


<!--  -->
<template>

    <div class="group-card-comp mx-auto">
        <div class="title ">{{ title }}</div>
        <br>
        <div class="text">{{ text }}</div>

        <v-btn
            v-if="mode=='infos-general'"
            class="text-none"
            rounded="xl" 
            size="x-large"
            variant="outlined"
            block
        >
            J'accepte
        </v-btn>

        <v-btn
            v-if="mode=='data-protection'"
            class="text-none"
            rounded="xl" 
            size="x-large"
            variant="outlined"
            block
        >
            Supprimer mon compte
        </v-btn>
    </div>

    
 
 </template>



<script>

    // Components

    export default {
        name: "infos-general-comp",
        components: {
        },
        props: {
            mode: {
                type: String,
                default: "infos-general",
            },
            title: {
                type: String,
                default: "Title",
            },
            text: {
                type: String,
                default: "text",
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

