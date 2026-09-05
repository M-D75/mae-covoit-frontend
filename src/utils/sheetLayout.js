import { clampSheetTop, selectSheetSnap } from './bottomSheet.js';
import { observeSheetViewport } from './sheetViewport.js';

// Shared by the publication/payment sheets and the map's reporting sheet.
export default {
    data: () => ({
        y: 0,
        open_b: false,
        sheetState: 'closed',
        isDragging: false,
        dragStartY: 0,
        dragStartState: 'closed',
        viewportTop: 0,
        sizeScreen: 0,
        visibleViewportHeight: 0,
        viewportBottomInset: 0,
        viewportTracking: false,
        subContHeigth: 0,
        subContSupHeigth: 0,
        contentResizeObserver: null,
        contentResizeFrame: null,
        stopSheetViewport: null,
        sheetDisposed: false,
    }),
    computed: {
        bottomMenuStyle(){
            return {
                top: `${this.y}px`,
                bottom: `${this.viewportBottomInset}px`,
                maxHeight: `${Math.max(0, this.sizeScreen - this.getSafeTop())}px`,
            };
        },
    },
    mounted(){
        this.stopSheetViewport = observeSheetViewport(viewport => {
            this.viewportTop = viewport.top;
            this.sizeScreen = viewport.bottom;
            this.visibleViewportHeight = viewport.height;
            this.viewportBottomInset = viewport.bottomInset;
            this.viewportTracking = viewport.tracking;
            this.scheduleContentReposition();
        });
        if(typeof ResizeObserver !== 'undefined'){
            this.contentResizeObserver = new ResizeObserver(this.scheduleContentReposition);
            // Observe natural content too: a clipped scroll container can keep
            // the same height while Stripe or the time selector finishes loading.
            for(const name of ['subCont', 'sheetContent', 'subContSup']){
                if(this.$refs[name]) this.contentResizeObserver.observe(this.$refs[name]);
            }
        }
    },
    beforeUnmount(){
        this.sheetDisposed = true;
        this.stopSheetViewport?.();
        this.contentResizeObserver?.disconnect();
        if(this.contentResizeFrame !== null) cancelAnimationFrame(this.contentResizeFrame);
    },
    methods: {
        refreshSheetMetrics(){
            const content = this.$refs.sheetContent;
            const scrollContainer = this.$refs.subCont;
            const style = scrollContainer ? getComputedStyle(scrollContainer) : null;
            const padding = (parseFloat(style?.paddingTop) || 0) + (parseFloat(style?.paddingBottom) || 0);
            this.subContHeigth = (content?.scrollHeight || 0) + padding;
            this.subContSupHeigth = this.$refs.subContSup?.scrollHeight || 0;
        },
        getSafeTop(){
            const inset = parseFloat(getComputedStyle(document.documentElement)
                .getPropertyValue('--safe-area-inset-top')) || 0;
            return Math.max(this.viewportTop + 16, inset + 12);
        },
        getExpandedTopPosition(){
            this.refreshSheetMetrics();
            return Math.max(this.getSafeTop(), this.sizeScreen - (this.subContHeigth + this.subContSupHeigth + 60));
        },
        getPeekTopPosition(){
            const expanded = this.getExpandedTopPosition();
            return Math.max(expanded, this.sizeScreen - Math.min(420, this.visibleViewportHeight * 0.45));
        },
        getInitialSheetState(){ return 'expanded'; },
        getPositionForState(state){
            if(state === 'expanded') return this.getExpandedTopPosition();
            if(state === 'peek') return this.getPeekTopPosition();
            return this.sizeScreen;
        },
        setSheetState(state){
            this.sheetState = state;
            this.y = Math.round(this.getPositionForState(state));
        },
        scheduleContentReposition(){
            if(this.sheetDisposed || this.contentResizeFrame !== null) return;
            this.contentResizeFrame = requestAnimationFrame(() => {
                this.contentResizeFrame = null;
                if(!this.isDragging){
                    this.setSheetState(this.open_b ? this.sheetState : 'closed');
                    if(this.open_b && this.viewportTracking) this.$nextTick(this.keepFocusedFieldVisible);
                }
            });
        },
        keepFocusedFieldVisible(){
            const container = this.$refs.subCont;
            const field = document.activeElement;
            if(this.sheetDisposed || !this.open_b || this.isDragging || !container?.contains(field)) return;
            const bounds = container.getBoundingClientRect();
            const inputBounds = field.getBoundingClientRect();
            // Stripe manages scrolling within a tall Payment Element itself.
            if(inputBounds.height > bounds.height) return;
            if(inputBounds.bottom > bounds.bottom) container.scrollTop += inputBounds.bottom - bounds.bottom;
            else if(inputBounds.top < bounds.top) container.scrollTop -= bounds.top - inputBounds.top;
        },
        onDragStart(){
            this.isDragging = true;
            this.dragStartY = this.y;
            this.dragStartState = this.sheetState;
        },
        onDrag(pos){
            if(!this.open_b) return;
            this.y = Math.round(clampSheetTop(pos.y, this.getExpandedTopPosition(), this.sizeScreen));
        },
        onDragStop(pos){
            this.isDragging = false;
            if(!this.open_b) return;
            const state = selectSheetSnap({
                releasedY: pos.y,
                expandedTop: this.getExpandedTopPosition(),
                peekTop: this.getPeekTopPosition(),
                viewportHeight: this.sizeScreen,
                originY: this.dragStartY,
                originState: this.dragStartState,
            });
            if(state === 'closed') this.close();
            else this.setSheetState(state);
        },
        open(){
            if(['time', 'nb-passenger', 'select-price', 'select-day', 'select-week'].includes(this.mode)){
                document.activeElement?.blur?.();
            }
            const wasOpen = this.open_b;
            this.open_b = true;
            this.isDragging = false;
            this.setSheetState(this.getInitialSheetState());
            this.$nextTick(this.scheduleContentReposition);
            if(!wasOpen) this.$emit('opened');
            return true;
        },
        openMiddle(){
            this.open();
            this.setSheetState('peek');
            return true;
        },
        close(){
            if(!this.open_b) return false;
            this.open_b = false;
            this.isDragging = false;
            this.setSheetState('closed');
            if(this.mode === 'reserve' && this.notif) this.$router.replace('/');
            this.$emit('close');
            return false;
        },
        reOpenB(){
            if(!this.open_b) return;
            this.$nextTick(this.scheduleContentReposition);
        },
    },
    watch: {
        mode(){
            if(this.open_b){
                this.sheetState = this.getInitialSheetState();
                this.$nextTick(this.scheduleContentReposition);
            }
        },
    },
};
