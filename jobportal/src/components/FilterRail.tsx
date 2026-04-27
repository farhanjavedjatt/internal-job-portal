"use client";

import type { ServerFilters } from "@/lib/jobs";

type Props = {
  filters: ServerFilters;
  sources: string[];
  onChange: (updates: Record<string, string | undefined>) => void;
};

export default function FilterRail({ filters, sources, onChange }: Props) {
  const remote = filters.remote ?? "any";
  const posted = filters.posted ?? "any";
  const source = filters.source;

  const activeCount =
    (remote !== "any" ? 1 : 0) +
    (posted !== "any" ? 1 : 0) +
    (source ? 1 : 0) +
    (filters.q ? 1 : 0);

  function clearAll() {
    onChange({ q: undefined, remote: undefined, posted: undefined, source: undefined });
  }

  return (
    <aside className="rail glass">
      <div className="rail-head">
        <div>
          <div className="rail-title">Refine</div>
          <div className="rail-sub mono">
            {activeCount} FILTER{activeCount !== 1 ? "S" : ""} ACTIVE
          </div>
        </div>
        {activeCount > 0 && (
          <button className="rail-clear mono" onClick={clearAll}>
            CLEAR
          </button>
        )}
      </div>

      <div className="rail-section">
        <div className="chipgroup-label mono">Workplace</div>
        <div className="segmented">
          {(["any", "remote", "onsite"] as const).map((v) => (
            <button
              key={v}
              className={`segmented-seg ${remote === v ? "is-on" : ""}`}
              onClick={() => onChange({ remote: v === "any" ? undefined : v })}
            >
              {v === "any" ? "All" : v[0].toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="rail-section">
        <div className="chipgroup-label mono">Posted</div>
        <div className="segmented">
          {(
            [
              { id: "any", label: "Any" },
              { id: "24h", label: "24h" },
              { id: "7d", label: "7d" },
              { id: "30d", label: "30d" },
            ] as const
          ).map((v) => (
            <button
              key={v.id}
              className={`segmented-seg ${posted === v.id ? "is-on" : ""}`}
              onClick={() => onChange({ posted: v.id === "any" ? undefined : v.id })}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {sources.length > 1 && (
        <div className="rail-section">
          <div className="chipgroup-label mono">Source</div>
          <div className="chipgroup-chips">
            <button
              className={`chip ${!source ? "is-on" : ""}`}
              onClick={() => onChange({ source: undefined })}
            >
              all
            </button>
            {sources.map((s) => (
              <button
                key={s}
                className={`chip ${source === s ? "is-on" : ""}`}
                onClick={() => onChange({ source: source === s ? undefined : s })}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}
