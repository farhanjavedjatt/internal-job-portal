// Salary scrubber — dual-handle range with spring feel + sparkline distribution
const { useEffect: useEffectSS, useRef: useRefSS, useState: useStateSS, useMemo: useMemoSS } = React;

function SalaryScrubber({ min, max, value, onChange, jobs }) {
  const trackRef = useRefSS(null);
  const [dragging, setDragging] = useStateSS(null); // 'lo' | 'hi' | null

  // histogram of salary midpoints
  const buckets = useMemoSS(() => {
    const n = 40;
    const arr = new Array(n).fill(0);
    jobs.forEach(j => {
      const mid = (j.salaryMin + j.salaryMax) / 2;
      const idx = Math.max(0, Math.min(n - 1, Math.floor(((mid - min) / (max - min)) * n)));
      arr[idx]++;
    });
    const peak = Math.max(...arr, 1);
    return arr.map(v => v / peak);
  }, [jobs, min, max]);

  const toPct = (v) => ((v - min) / (max - min)) * 100;

  useEffectSS(() => {
    if (!dragging) return;
    const onMove = (e) => {
      const track = trackRef.current;
      if (!track) return;
      const rect = track.getBoundingClientRect();
      const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
      const pct = Math.max(0, Math.min(1, x / rect.width));
      const raw = min + pct * (max - min);
      const snapped = Math.round(raw / 5) * 5;
      if (dragging === 'lo') onChange([Math.min(snapped, value[1] - 10), value[1]]);
      else onChange([value[0], Math.max(snapped, value[0] + 10)]);
    };
    const onUp = () => setDragging(null);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onMove);
    window.addEventListener('touchend', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onUp);
    };
  }, [dragging, value, min, max, onChange]);

  const loPct = toPct(value[0]);
  const hiPct = toPct(value[1]);

  return (
    <div className="scrubber">
      <div className="scrubber-head">
        <span className="scrubber-label">Salary</span>
        <span className="scrubber-value mono">${value[0]}k — ${value[1]}k</span>
      </div>
      <div className="scrubber-histogram">
        {buckets.map((h, i) => {
          const bucketPct = (i / buckets.length) * 100;
          const inRange = bucketPct >= loPct - 2 && bucketPct <= hiPct + 2;
          return (
            <div
              key={i}
              className="scrubber-bar"
              style={{
                height: `${Math.max(4, h * 100)}%`,
                opacity: inRange ? 1 : 0.25,
                background: inRange ? 'var(--accent)' : 'var(--fg-faint)',
              }}
            />
          );
        })}
      </div>
      <div className="scrubber-track" ref={trackRef}>
        <div className="scrubber-rail" />
        <div
          className="scrubber-range"
          style={{ left: `${loPct}%`, right: `${100 - hiPct}%` }}
        />
        <button
          className={`scrubber-handle ${dragging === 'lo' ? 'is-dragging' : ''}`}
          style={{ left: `${loPct}%` }}
          onMouseDown={() => setDragging('lo')}
          onTouchStart={() => setDragging('lo')}
          aria-label="min salary"
        />
        <button
          className={`scrubber-handle ${dragging === 'hi' ? 'is-dragging' : ''}`}
          style={{ left: `${hiPct}%` }}
          onMouseDown={() => setDragging('hi')}
          onTouchStart={() => setDragging('hi')}
          aria-label="max salary"
        />
      </div>
      <div className="scrubber-ticks mono">
        <span>${min}k</span>
        <span>${Math.round((min + max) / 2)}k</span>
        <span>${max}k</span>
      </div>
    </div>
  );
}

Object.assign(window, { SalaryScrubber });
