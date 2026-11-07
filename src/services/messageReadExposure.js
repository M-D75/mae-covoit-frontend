// Count only portions actually displayed while the conversation is active.
// A tall message is read once its whole height has been exposed, in any order.
export function recordMessageExposure(previous, rect, viewport) {
    const height = rect.bottom - rect.top;
    const start = Math.max(0, viewport.top - rect.top);
    const end = Math.min(height, viewport.bottom - rect.top);
    if(!Number.isFinite(height) || height <= 0 || !Number.isFinite(start) || !Number.isFinite(end) || end <= start) return previous;
    const segments = previous && Math.abs(previous.height - height) < 1 ? previous.segments : [];
    const sorted = [...segments, [start, end]].sort((a,b) => a[0] - b[0]);
    const merged = [];
    for(const segment of sorted){
        const last = merged[merged.length - 1];
        if(last && segment[0] <= last[1] + 1) last[1] = Math.max(last[1], segment[1]);
        else merged.push([...segment]);
    }
    return {height, segments: merged, complete: merged.length === 1 && merged[0][0] <= 1 && merged[0][1] >= height - 1};
}
