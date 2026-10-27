<template>
    <div class="passenger-boarding-access">
        <v-chip v-if="access.status === 'onboard'" variant="tonal" color="success" size="small" prepend-icon="mdi-check-circle-outline" role="status" :aria-label="access.message">À bord</v-chip>
        <template v-else>
            <span v-if="!compact" class="waiting-state"><v-icon size="16" icon="mdi-clock-outline" aria-hidden="true" /> {{ access.status === 'available' ? 'En attente du véhicule' : access.status === 'early' ? 'Avant le départ' : access.status === 'expired' ? 'Délai terminé' : 'Code indisponible' }}</span>
            <v-btn class="code-action" :variant="compact ? 'text' : 'tonal'" color="primary" density="comfortable" prepend-icon="mdi-dialpad" aria-label="Code de montée" :aria-disabled="!access.canOpen" @click="activate">Code</v-btn>
            <p v-if="(explaining || showReason) && !access.canOpen" role="status">{{ access.message }}</p>
        </template>
    </div>
</template>
<script>
export default {
    name: 'PassengerBoardingAccess',
    props: { access: { type: Object, required: true }, compact: Boolean, showReason: Boolean },
    emits: ['open', 'explain'],
    data: () => ({ explaining: false }),
    methods: { activate() { if (this.access.canOpen) { this.explaining = false; this.$emit('open'); } else if (this.compact) this.$emit('explain'); else this.explaining = true; } },
};
</script>
<style scoped>
.passenger-boarding-access { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; font-size: 13px; color: rgb(var(--v-theme-on-surface)); }
.waiting-state { font-size: 12px; opacity: .8; }
.code-action { min-height: 44px; min-width: 80px; text-transform: none; letter-spacing: normal; }
.code-action[aria-disabled='true'] { opacity: .6; cursor: help; }
p { flex-basis: 100%; margin: 2px 0; font-size: 12px; }
.code-action:focus-visible { outline: 2px solid rgb(var(--v-theme-primary)); outline-offset: 2px; }
</style>
