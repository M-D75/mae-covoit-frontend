<template>
    <PublishMap
        :itineraire="itineraire"
        @trajet-selected="$emit('trajet-selected')"
    />
</template>

<script>
import { defineComponent } from 'vue';
import PublishMap from '@/components/publish/Map.vue';

// Vue de contrôle : elle suit le fournisseur global, comme le flux de publication.
export default defineComponent({
    name: 'MapProviderView',
    components: { PublishMap },
    emits: ['trajet-selected'],
    props: {
        itineraire: {
            type: Object,
            default: () => ({
                origin: {
                    location: {
                        latLng: {
                            latitude: -12.7243245,
                            longitude: 45.0589372,
                            latLngTab: [-12.7243245, 45.0589372],
                        },
                    },
                    infos: { village: 'Acoua', commune: 'Acoua' },
                },
                destination: {
                    location: {
                        latLng: {
                            latitude: -12.9292776,
                            longitude: 45.1763906,
                            latLngTab: [-12.9292776, 45.1763906],
                        },
                    },
                    infos: { village: 'Bambo-Est', commune: 'Bandrélé' },
                },
            }),
        },
    },
});
</script>
