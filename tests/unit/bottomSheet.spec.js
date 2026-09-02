import { describe, expect, it } from 'vitest';
import {
    clampSheetTop,
    getKeyboardAwareViewport,
    selectSheetSnap,
} from '@/utils/bottomSheet.js';

describe('bottom sheet snapping', () => {
    it('never lets the panel hide above its expanded content position', () => {
        expect(clampSheetTop(40, 120, 800)).toBe(120);
        expect(clampSheetTop(900, 120, 800)).toBe(800);
    });

    it('snaps upward to expanded instead of retaining an intermediate level', () => {
        expect(selectSheetSnap({
            releasedY: 280,
            expandedTop: 120,
            peekTop: 480,
            viewportHeight: 800,
        })).toBe('expanded');
    });

    it('returns to preview or closes after a downward drag', () => {
        const positions = {
            expandedTop: 120,
            peekTop: 480,
            viewportHeight: 800,
        };
        expect(selectSheetSnap({ releasedY: 400, ...positions })).toBe('peek');
        expect(selectSheetSnap({ releasedY: 700, ...positions })).toBe('closed');
    });

    it('uses the gesture direction to descend one level at a time', () => {
        const positions = {
            expandedTop: 120,
            peekTop: 480,
            viewportHeight: 800,
        };

        expect(selectSheetSnap({
            releasedY: 175,
            originY: 120,
            originState: 'expanded',
            ...positions,
        })).toBe('peek');
        expect(selectSheetSnap({
            releasedY: 535,
            originY: 480,
            originState: 'peek',
            ...positions,
        })).toBe('closed');
    });

    it('expands the preview after a clear upward gesture', () => {
        expect(selectSheetSnap({
            releasedY: 430,
            originY: 480,
            originState: 'peek',
            expandedTop: 120,
            peekTop: 480,
            viewportHeight: 800,
        })).toBe('expanded');
    });
});

describe('keyboard-aware viewport', () => {
    it('uses visualViewport when the keyboard overlays the layout viewport', () => {
        expect(getKeyboardAwareViewport({
            layoutHeight: 800,
            visualHeight: 500,
            keyboardHeight: 300,
            baselineHeight: 800,
        })).toEqual({
            top: 0,
            bottom: 500,
            height: 500,
            bottomInset: 300,
        });
    });

    it('does not subtract the keyboard twice when innerHeight already shrank', () => {
        expect(getKeyboardAwareViewport({
            layoutHeight: 500,
            visualHeight: 500,
            keyboardHeight: 300,
            baselineHeight: 800,
        })).toEqual({
            top: 0,
            bottom: 500,
            height: 500,
            bottomInset: 0,
        });
    });

    it('falls back to the native keyboard height when viewport APIs do not resize', () => {
        expect(getKeyboardAwareViewport({
            layoutHeight: 800,
            visualHeight: 800,
            keyboardHeight: 300,
            baselineHeight: 800,
        })).toEqual({
            top: 0,
            bottom: 500,
            height: 500,
            bottomInset: 300,
        });
    });
});
