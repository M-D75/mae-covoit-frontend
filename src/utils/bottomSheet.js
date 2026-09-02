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

/**
 * Return the part of the layout viewport that is still visible above the
 * software keyboard.
 *
 * Mobile WebViews do not all expose the keyboard in the same way: some shrink
 * window.innerHeight, some only shrink visualViewport, and some only emit the
 * native keyboard height. Keeping the calculation here avoids applying the
 * keyboard height twice when the WebView has already resized itself.
 */
export function getKeyboardAwareViewport({
    layoutHeight,
    visualHeight,
    visualOffsetTop = 0,
    keyboardHeight = 0,
    baselineHeight = layoutHeight,
}) {
    const safeLayoutHeight = Math.max(0, Number(layoutHeight) || 0);
    const safeVisualHeight = Math.max(0, Number(visualHeight) || safeLayoutHeight);
    const safeVisualTop = Math.max(0, Number(visualOffsetTop) || 0);
    const safeKeyboardHeight = Math.max(0, Number(keyboardHeight) || 0);
    const safeBaselineHeight = Math.max(safeLayoutHeight, Number(baselineHeight) || 0);

    const layoutWasResized = safeKeyboardHeight > 0
        && safeBaselineHeight - safeLayoutHeight >= safeKeyboardHeight * 0.5;

    let bottom = Math.min(safeLayoutHeight, safeVisualTop + safeVisualHeight);
    const visualViewportWasResized = bottom < safeLayoutHeight - 1;

    if(safeKeyboardHeight > 0 && !layoutWasResized && !visualViewportWasResized){
        bottom = Math.max(safeVisualTop, safeLayoutHeight - safeKeyboardHeight);
    }

    return {
        top: safeVisualTop,
        bottom,
        height: Math.max(0, bottom - safeVisualTop),
        bottomInset: Math.max(0, safeLayoutHeight - bottom),
    };
}
