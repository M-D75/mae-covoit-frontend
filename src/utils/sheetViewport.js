import { Capacitor } from '@capacitor/core';
import { Keyboard } from '@capacitor/keyboard';
import { getKeyboardAwareViewport } from './bottomSheet.js';

/** Observe the whole keyboard animation, including WebViews with late resize events. */
export function observeSheetViewport(onChange) {
    let disposed = false;
    let frame = null;
    let followUntil = 0;
    let keyboardHeight = 0;
    let baselineHeight = window.innerHeight;
    const handles = [];
    const visualViewport = window.visualViewport;

    function sample() {
        frame = null;
        if(disposed) return;
        const layoutHeight = window.innerHeight;
        const viewport = getKeyboardAwareViewport({
            layoutHeight,
            visualHeight: visualViewport?.height,
            visualOffsetTop: visualViewport?.offsetTop,
            keyboardHeight,
            baselineHeight,
        });
        if(!keyboardHeight) baselineHeight = layoutHeight;
        onChange({ ...viewport, tracking: performance.now() < followUntil });
        if(performance.now() < followUntil) frame = requestAnimationFrame(sample);
    }

    function follow() {
        if(disposed) return;
        followUntil = performance.now() + 600;
        if(frame === null) frame = requestAnimationFrame(sample);
    }

    window.addEventListener('resize', follow);
    visualViewport?.addEventListener('resize', follow);
    visualViewport?.addEventListener('scroll', follow);
    if(Capacitor.isNativePlatform()) {
        for(const event of ['keyboardWillShow', 'keyboardDidShow', 'keyboardWillHide', 'keyboardDidHide']) {
            Keyboard.addListener(event, (info) => {
                keyboardHeight = event.endsWith('Show') ? Number(info.keyboardHeight) || 0 : 0;
                follow();
            }).then(handle => {
                if(disposed) handle.remove();
                else handles.push(handle);
            }).catch(error => console.error('Unable to observe sheet keyboard:', error));
        }
    }
    sample();
    follow();
    return () => {
        disposed = true;
        if(frame !== null) cancelAnimationFrame(frame);
        window.removeEventListener('resize', follow);
        visualViewport?.removeEventListener('resize', follow);
        visualViewport?.removeEventListener('scroll', follow);
        handles.forEach(handle => handle.remove());
    };
}
