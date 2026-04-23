// Living animated background — SVG aurora blobs, responsive to theme
const { useEffect, useRef, useState } = React;

function Aurora({ theme, accentHue }) {
  const ref = useRef(null);
  const [t, setT] = useState(0);

  useEffect(() => {
    let raf;
    let start = performance.now();
    const tick = (now) => {
      setT((now - start) / 1000);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const dark = theme === 'dark';
  const baseBg = dark
    ? 'linear-gradient(180deg, #07080d 0%, #0a0b14 60%, #050509 100%)'
    : 'linear-gradient(180deg, #eef0f6 0%, #e4e7f1 60%, #dde1ee 100%)';

  const blobs = [
    { hue: accentHue, x: 20, y: 30, r: 520, phase: 0 },
    { hue: accentHue + 40, x: 75, y: 25, r: 480, phase: 1.7 },
    { hue: accentHue - 30, x: 60, y: 80, r: 560, phase: 3.3 },
    { hue: accentHue + 90, x: 15, y: 75, r: 420, phase: 5.1 },
  ];

  return (
    <div className="aurora" style={{ background: baseBg }}>
      <svg className="aurora-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          {blobs.map((b, i) => (
            <radialGradient key={i} id={`blob-${i}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={`oklch(${dark ? 65 : 80}% 0.18 ${b.hue})`} stopOpacity={dark ? 0.55 : 0.75} />
              <stop offset="60%" stopColor={`oklch(${dark ? 55 : 75}% 0.12 ${b.hue})`} stopOpacity={dark ? 0.25 : 0.35} />
              <stop offset="100%" stopColor={`oklch(${dark ? 50 : 70}% 0.08 ${b.hue})`} stopOpacity="0" />
            </radialGradient>
          ))}
        </defs>
        {blobs.map((b, i) => {
          const dx = Math.sin(t * 0.08 + b.phase) * 12;
          const dy = Math.cos(t * 0.07 + b.phase * 0.7) * 10;
          const scale = 1 + Math.sin(t * 0.1 + b.phase) * 0.08;
          return (
            <ellipse
              key={i}
              cx={b.x + dx}
              cy={b.y + dy}
              rx={30 * scale}
              ry={26 * scale}
              fill={`url(#blob-${i})`}
            />
          );
        })}
      </svg>
      <div className="aurora-grain" />
      <div className="aurora-vignette" style={{
        background: dark
          ? 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.55) 100%)'
          : 'radial-gradient(ellipse at center, transparent 50%, rgba(20,25,50,0.15) 100%)'
      }} />
    </div>
  );
}

Object.assign(window, { Aurora });
