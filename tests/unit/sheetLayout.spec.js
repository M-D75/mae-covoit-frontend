import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import sheetLayout from '@/utils/sheetLayout.js';
import { observeSheetViewport } from '@/utils/sheetViewport.js';

const native = vi.hoisted(() => ({ listeners: {}, removals: [] }));
vi.mock('@capacitor/core', () => ({ Capacitor: { isNativePlatform: () => true } }));
vi.mock('@capacitor/keyboard', () => ({ Keyboard: {
    addListener: vi.fn(async (event, callback) => {
        native.listeners[event] = callback;
        const remove = vi.fn();
        native.removals.push(remove);
        return { remove };
    }),
} }));

let frames;
let now;
function advance() {
    now += 100;
    const callbacks = [...frames.values()];
    frames.clear();
    callbacks.forEach(callback => callback(now));
}

function createSheet(contentHeight = 300) {
    const content = document.createElement('div');
    Object.defineProperty(content, 'scrollHeight', { configurable: true, get: () => contentHeight });
    const sheet = {
        ...sheetLayout.data(),
        mode: 'time',
        $refs: { sheetContent: content, subCont: document.createElement('div') },
        $nextTick: callback => callback(),
        $emit: vi.fn(),
        $router: { replace: vi.fn() },
        resizeContent: height => { contentHeight = height; },
    };
    Object.entries(sheetLayout.methods).forEach(([name, method]) => {
        sheet[name] = method.bind(sheet);
    });
    sheet.sizeScreen = 800;
    sheet.visibleViewportHeight = 800;
    return sheet;
}

beforeEach(() => {
    frames = new Map();
    now = 0;
    let id = 0;
    vi.stubGlobal('requestAnimationFrame', callback => { frames.set(++id, callback); return id; });
    vi.stubGlobal('cancelAnimationFrame', frame => frames.delete(frame));
    vi.spyOn(performance, 'now').mockImplementation(() => now);
    native.listeners = {};
    native.removals = [];
});
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe('sheet positioning', () => {
    it('follows a closing keyboard even when a time sheet opens halfway through', async () => {
        const visual = new EventTarget();
        visual.height = 500;
        visual.offsetTop = 0;
        vi.stubGlobal('visualViewport', visual);
        vi.stubGlobal('innerHeight', 800);
        const sheet = createSheet();
        const positions = [];
        const stop = observeSheetViewport(viewport => {
            sheet.sizeScreen = viewport.bottom;
            sheet.visibleViewportHeight = viewport.height;
            sheet.viewportBottomInset = viewport.bottomInset;
            sheet.scheduleContentReposition();
            positions.push(viewport.bottom);
        });
        await Promise.resolve();
        native.listeners.keyboardWillHide({});
        sheet.open();
        expect(sheet.y).toBe(140);
        // No resize event here: WKWebView can finish resizing after the native event.
        visual.height = 650;
        advance(); advance();
        expect(sheet.y).toBe(290);
        visual.height = 800;
        native.listeners.keyboardDidHide({});
        advance(); advance();
        expect(sheet.y).toBe(440);
        expect(sheet.viewportBottomInset).toBe(0);
        expect(positions).toContain(650);
        stop();
        await vi.waitFor(() => {
            expect(native.removals.every(remove => remove.mock.calls.length === 1)).toBe(true);
        });
    });

    it('fits asynchronously loaded content and shrinks again on a shorter step', () => {
        const sheet = createSheet(100);
        sheet.open();
        expect(sheet.y).toBe(640);
        sheet.resizeContent(600);
        sheet.scheduleContentReposition(); advance();
        expect(sheet.y).toBe(140);
        sheet.resizeContent(200);
        sheet.reOpenB(); advance();
        expect(sheet.y).toBe(540);
        expect(sheet.open_b).toBe(true);
        expect(sheet.$emit.mock.calls.filter(([event]) => event === 'opened')).toHaveLength(1);
    });

    it('clamps a dragged reporting sheet, preserves the gesture during resize, and snaps', () => {
        const sheet = createSheet(600);
        sheet.mode = 'alert';
        sheet.openMiddle();
        const peek = sheet.y;
        sheet.onDragStart();
        sheet.onDrag({ y: -300 });
        expect(sheet.y).toBe(140);
        sheet.scheduleContentReposition(); advance();
        expect(sheet.y).toBe(140);
        sheet.onDragStop({ y: -300 });
        expect(sheet.sheetState).toBe('expanded');
        sheet.onDragStart();
        sheet.onDragStop({ y: 200 });
        expect(sheet.sheetState).toBe('peek');
        expect(sheet.y).toBe(peek);
        sheet.onDragStart();
        sheet.onDragStop({ y: 800 });
        expect(sheet.open_b).toBe(false);
    });

    it('never reopens a sheet closed while repositioning was queued', () => {
        const sheet = createSheet();
        sheet.open();
        sheet.reOpenB();
        sheet.close();
        advance();
        expect(sheet.y).toBe(800);
        expect(sheet.open_b).toBe(false);
    });

    it('limits oversized content to the safe top of the visible viewport', () => {
        const sheet = createSheet(1200);
        sheet.viewportTop = 80;
        sheet.sizeScreen = 500;
        sheet.visibleViewportHeight = 420;
        sheet.open();
        expect(sheet.y).toBe(96);
        sheet.onDragStart();
        sheet.onDrag({ y: 0 });
        expect(sheet.y).toBe(96);
    });

    it('keeps a focused field visible by scrolling only the panel content', () => {
        const sheet = createSheet();
        const input = document.createElement('input');
        sheet.$refs.subCont.appendChild(input);
        document.body.appendChild(sheet.$refs.subCont);
        sheet.$refs.subCont.getBoundingClientRect = () => ({ top: 100, bottom: 400, height: 300 });
        input.getBoundingClientRect = () => ({ top: 390, bottom: 430, height: 40 });
        sheet.open();
        input.focus();
        sheet.keepFocusedFieldVisible();
        expect(sheet.$refs.subCont.scrollTop).toBe(30);
        sheet.$refs.subCont.remove();
    });

    it('cleans up native listeners even when unmounted before registration finishes', async () => {
        const stop = observeSheetViewport(vi.fn());
        stop();
        await Promise.resolve();
        expect(native.removals).toHaveLength(4);
        await vi.waitFor(() => {
            expect(native.removals.every(remove => remove.mock.calls.length === 1)).toBe(true);
        });
        expect(frames.size).toBe(0);
    });
});
