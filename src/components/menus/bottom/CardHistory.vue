
<style lang="scss" model>
</style>

<style lang="scss" scoped>

    .card-trajet-history {
        margin: 10px auto;
        //background-color: var(--bg-app-color);
        .v-card {
            display: flex;
            justify-content: space-between;
            width: 327px;
            height: 53px;
            padding: 5px;
            border-radius: 24px;
            color: var(--font-color-label);
            background-color: var(--white-bg-color);
            > div {
                margin: auto;
                &.container-avatar {
                    margin-left: 0;
                    .v-avatar {
                        height: 100%;
                        margin: auto 0;
                    }
                }
                &.trajet {
                    display: flex;
                    margin: auto 0;
                    justify-content: space-between;
                    width: 100%;
                    padding: 0 10px;
                }
            }
        }
    }

</style>

<template>

    <div class="card-trajet-history">

        <v-card
            class="mx-auto"
            max-width="500"
        >
            <div class="container-avatar">
                <v-avatar>
                    <v-img
                        alt="Avatar"
                        :src="infos.avatar"
                    ></v-img>
                </v-avatar>
            </div>
            
            <div class="trajet">
                <div>{{ infos.depart }}</div>
                <v-icon>mdi-swap-horizontal</v-icon>
                <div>{{ infos.destination }}</div>
            </div>

            <div class="infos">
                <v-chip
                    class=""
                    color="blue"
                >
                    {{ infos.price }}€
                </v-chip>
                <!-- <div>{{ infos.price }}</div> -->
            </div>
        </v-card>
    </div>

</template>


<script>

   // Components
   export default {
      name: 'card-trajet-history-comp',
      props: {
         infos: {
            type: Object,
            default() {
                return {
                        "depart": "Tsingoni",
                        "destination": "Mamoudzou",
                        "price": 4,
                    };
            },
         },
      },
      data() {
         return {
         }
      },
   };
</script>