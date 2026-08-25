/** Keep a dragged sheet between its content-sized top and the viewport bottom. */
export function clampSheetTop(position, expandedTop, viewportHeight) {
    const safePosition = Number.isFinite(Number(position)) ? Number(position) : viewportHeight;
    return Math.min(viewportHeight, Math.max(expandedTop, safePosition));
}

/**
 * Pick one deterministic resting point after a drag.
 *
 * A deliberate gesture follows its direction: expanded -> preview -> closed
 * when moving down, and preview -> expanded when moving up. A short gesture
 * still snaps to the nearest resting point.
 */
export function selectSheetSnap({
    releasedY,
    expandedTop,
    peekTop,
    viewportHeight,
    originY = null,
    originState = null,
    movementThreshold = 40,
}) {
    const clampedY = clampSheetTop(releasedY, expandedTop, viewportHeight);
    const numericOriginY = Number(originY);
    const hasOrigin = originY !== null && Number.isFinite(numericOriginY);
    const movement = hasOrigin ? clampedY - numericOriginY : 0;

    if(hasOrigin && Math.abs(movement) >= movementThreshold){
        if(movement < 0) return 'expanded';
        if(originState === 'expanded') return 'peek';
        if(originState === 'peek') return 'closed';
    }

    const closeThreshold = peekTop + Math.min(120, (viewportHeight - peekTop) * 0.55);
    if (clampedY >= closeThreshold) return 'closed';

    const expandedThreshold = expandedTop + ((peekTop - expandedTop) / 2);
    return clampedY <= expandedThreshold ? 'expanded' : 'peek';
}
