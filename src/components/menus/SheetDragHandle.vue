<template>
    <button
        class="sheet-drag-handle"
        type="button"
        aria-label="Déplacer le panneau"
        @pointerdown="start"
        @pointermove="move"
        @pointerup="finish"
        @pointercancel="cancel"
        @lostpointercapture="cancel"
        @keydown.up.prevent="$emit('expand')"
        @keydown.down.prevent="$emit('collapse')"
    ><span></span></button>
</template>

<script>
export default {
    emits: ['drag-start', 'dragging', 'drag-end', 'expand', 'collapse'],
    props: { top: { type: Number, required: true } },
    data: () => ({ pointerId: null, startY: 0, startTop: 0 }),
    methods: {
        start(event){
            if(this.pointerId !== null || !event.isPrimary || event.button !== 0) return;
            this.pointerId = event.pointerId;
            this.startY = event.clientY;
            this.startTop = this.top;
            event.currentTarget.setPointerCapture(event.pointerId);
            this.$emit('drag-start', { y: this.top });
        },
        move(event){
            if(event.pointerId !== this.pointerId) return;
            this.$emit('dragging', { y: this.startTop + event.clientY - this.startY });
        },
        finish(event){
            if(event.pointerId !== this.pointerId) return;
            this.pointerId = null;
            this.$emit('drag-end', { y: this.startTop + event.clientY - this.startY });
        },
        cancel(event){
            if(event.pointerId !== this.pointerId) return;
            this.pointerId = null;
            this.$emit('drag-end', { y: this.top });
        },
    },
};
</script>

<style scoped>
.sheet-drag-handle {
    display: grid;
    place-items: center;
    width: 100%;
    height: 44px;
    flex: 0 0 44px;
    border: 0;
    background: transparent;
    cursor: grab;
    touch-action: none;
    user-select: none;
}
.sheet-drag-handle:active { cursor: grabbing; }
.sheet-drag-handle span {
    width: 56px;
    height: 4px;
    border-radius: 4px;
    background: gray;
}
</style>
