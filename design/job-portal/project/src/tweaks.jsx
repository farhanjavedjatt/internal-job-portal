// Tweaks panel — controls for accent hue, density, theme, font
const { useEffect: useEffectTW, useState: useStateTW } = React;

function TweaksPanel({ tweaks, setTweaks, onClose }) {
  const update = (key, val) => {
    setTweaks(t => {
      const next = { ...t, [key]: val };
      try {
        window.parent.postMessage({ type: '__edit_mode_set_keys', edits: next }, '*');
      } catch(e) {}
      return next;
    });
  };

  return (
    <div className="tweaks-panel glass">
      <div className="tweaks-head">
        <span className="mono tweaks-title">TWEAKS</span>
        <button className="tweaks-close" onClick={onClose}>×</button>
      </div>

      <div className="tweaks-row">
        <label className="mono tweaks-label">Theme</label>
        <div className="segmented">
          {['light','dark'].map(v => (
            <button key={v} className={`segmented-seg ${tweaks.theme === v ? 'is-on' : ''}`} onClick={() => update('theme', v)}>{v}</button>
          ))}
        </div>
      </div>

      <div className="tweaks-row">
        <label className="mono tweaks-label">Density</label>
        <div className="segmented">
          {['spacious','dense'].map(v => (
            <button key={v} className={`segmented-seg ${tweaks.density === v ? 'is-on' : ''}`} onClick={() => update('density', v)}>{v}</button>
          ))}
        </div>
      </div>

      <div className="tweaks-row">
        <label className="mono tweaks-label">Accent hue · {tweaks.accentHue}°</label>
        <input
          type="range" min="0" max="360" step="1" value={tweaks.accentHue}
          onChange={e => update('accentHue', parseInt(e.target.value))}
          className="tweaks-slider"
          style={{
            background: `linear-gradient(90deg, oklch(75% 0.15 0), oklch(75% 0.15 60), oklch(75% 0.15 120), oklch(75% 0.15 180), oklch(75% 0.15 240), oklch(75% 0.15 300), oklch(75% 0.15 360))`
          }}
        />
      </div>

      <div className="tweaks-row">
        <label className="mono tweaks-label">Font</label>
        <div className="segmented">
          {['inter','space','serif'].map(v => (
            <button key={v} className={`segmented-seg ${tweaks.font === v ? 'is-on' : ''}`} onClick={() => update('font', v)}>{v}</button>
          ))}
        </div>
      </div>

      <div className="tweaks-row">
        <label className="mono tweaks-label">Card style</label>
        <div className="segmented">
          {['frost','crystal','liquid'].map(v => (
            <button key={v} className={`segmented-seg ${tweaks.cardStyle === v ? 'is-on' : ''}`} onClick={() => update('cardStyle', v)}>{v}</button>
          ))}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { TweaksPanel });
