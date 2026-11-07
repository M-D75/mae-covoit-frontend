
<style lang="scss" model>
    .select-car-view {
        .model.scrollable-container {
            cursor: pointer;
            overflow-x: auto;
            scrollbar-width: thin;
            scrollbar-color: transparent transparent;
            //display: inline-table;
            // .text{
            //     margin-top: 5px;
            // }
        }

        /* Pour Chrome, Edge et Safari */
        .scrollable-container::-webkit-scrollbar {
            width: 1px;
        }

        .scrollable-container::-webkit-scrollbar-track {
            background: transparent;
        }

        .scrollable-container::-webkit-scrollbar-thumb {
            background-color: transparent;
        }
    }
</style>

<!-- scss -->
<style lang="scss" scoped>
    .v-container.select-car-view{
        // height: 100vh;
        .title {
            font-size: var(--font-size-h1);
            font-weight: bold;
            width: 90%;
            margin: 30px auto;
            color: var(--font-color-label);
        }

        div.card-contain{
            margin: auto;
            .v-card.car {
                margin: 10px auto;
                padding: 5px 20px;
                width: 90%;
                border-radius: 16px;
                background-color: var(--white-bg-color);
                box-shadow: var(--box-shadow-card);
                .v-list {
                    overflow: visible;
                    height: 56px;
                    display: flex;
                    justify-content: space-between;
                    .icon-container {
                        margin: auto 0;
                        .v-icon {
                            display: grid;
                            margin: auto;
                            font-size: 2em;
                            color: var(--font-color-label);
                        }
                    }
                    .model {
                        position: relative;
                        //max-width: 170px;
                        margin: auto 15px !important;
                        width: 65%;
                        overflow-x: auto;
                        .text{
                            position: relative;
                            width: fit-content;
                            text-transform: uppercase;
                            font-weight: bold;
                            font-size: 16px;
                            white-space: nowrap;
                            color: var(--font-color-label);
                        }
                    }
                    .color {
                        margin: auto 0;
                        // border: 4px solid #eeecec ;
                        opacity: 0.2;
                        border-radius: 200px;
                        height: 32px;
                        width: 32px;
                    }
                }
            }
        }
    }
</style>
   
<!--  -->
<template>
    <v-main>
        <v-container 
            class="select-car-view"
        >
            <div
                class="title text-center"
            >Quelle voiture comptez-vous prendre ?</div>

            <div 
                class="card-contain"
            >
                <p v-if="loading" role="status" class="text-center">Chargement de vos véhicules…</p>
                <div v-else-if="error" role="alert" class="text-center">
                    <p>{{ error }}</p>
                    <v-btn @click="loadCars">Réessayer</v-btn>
                </div>
                <p v-else-if="infos.length === 0" class="text-center">
                    Aucun véhicule disponible. Ajoutez un véhicule depuis votre profil pour publier.
                </p>
                <v-card
                    v-for="info in infos"
                    :key="info.id"
                    class="car mx-auto"
                    @click="selectCar(info)"
                >
                    <v-list>
                        <div class="icon-container"><v-icon >{{ info.icon }}</v-icon></div>
                        <div class="model scrollable-container" ><div class="text">{{ info.model }}</div></div>
                        <div class="color" :style="'background-color: ' + info.color"></div>
                    </v-list>
                </v-card>
            </div>
        </v-container>
    </v-main>
</template>



<!--  -->
<script>
    import { defineComponent } from 'vue';
    import { mapState, mapActions } from 'vuex';

    const vehicleIcons = {
        Moto: 'mdi-motorbike',
        Compact: 'mdi-car-hatchback',
        Berline: 'mdi-car-sports',
        SUV: 'mdi-car-estate',
        Monospace: 'mdi-car-estate',
    };

    export default defineComponent({
        name: 'select-car-view',
        computed: {
            ...mapState("profil", ["cars"]),
            infos() {
                if (this.loading || this.error) return [];
                return (this.cars || []).map(car => ({
                    model: car.license_plate,
                    color: car.color,
                    icon: vehicleIcons[car.model] || 'mdi-car',
                    id: car.id,
                    seats: car.seats,
                }));
            },
        },
        data() {
            return {
                car: null,
                seats: 0,
                loading: true,
                error: '',
            };
        },
        mounted() {
            this.loadCars();
        },
        methods: {
            ...mapActions("profil", ["getCars"]),
            async loadCars() {
                this.loading = true;
                this.error = '';
                this.car = null;
                this.seats = 0;
                try {
                    const result = await this.getCars();
                    if (result?.status !== 0) {
                        this.error = result?.message || 'Impossible de charger vos véhicules.';
                    }
                } catch {
                    this.error = 'Impossible de charger vos véhicules. Veuillez réessayer.';
                } finally {
                    this.loading = false;
                }
            },
            selectCar(info) {
                if (this.loading || this.error || info.id == null || !this.infos.includes(info)) return;
                this.car = info.id;
                this.seats = info.seats;
                this.$emit("car-selected");
            },
        },
    });
</script>
