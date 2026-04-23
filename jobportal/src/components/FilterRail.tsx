"use client";

import SalaryScrubber from "./SalaryScrubber";
import type { Filters, JobMeta, UiJob } from "@/lib/types";

type Props = {
  filters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
  jobs: UiJob[];
  meta: JobMeta;
  allTags: string[];
};

function ChipGroup({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string;
  options: string[];
  selected: string[];
  onToggle: (v: string) => void;
}) {
  return (
    <div className="chipgroup">
      <div className="chipgroup-label mono">{label}</div>
      <div className="chipgroup-chips">
        {options.map((opt) => {
          const isOn = selected.includes(opt);
          return (
            <button
              key={opt}
              className={`chip ${isOn ? "is-on" : ""}`}
              onClick={() => onToggle(opt)}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function FilterRail({ filters, setFilters, jobs, meta, allTags }: Props) {
  const toggle = (key: "types" | "levels" | "sizes" | "tags", val: string) => {
    setFilters((f) => {
      const arr = f[key];
      return {
        ...f,
        [key]: arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val],
      };
    });
  };

  const setSalary = (v: [number, number]) => setFilters((f) => ({ ...f, salary: v }));
  const setPosted = (v: Filters["posted"]) => setFilters((f) => ({ ...f, posted: v }));
  const setRemote = (v: Filters["remote"]) => setFilters((f) => ({ ...f, remote: v }));

  const clearAll = () =>
    setFilters({
      q: "",
      types: [],
      levels: [],
      sizes: [],
      tags: [],
      salary: [40, 300],
      posted: "any",
      remote: "any",
    });

  const activeCount =
    filters.types.length +
    filters.levels.length +
    filters.sizes.length +
    filters.tags.length +
    (filters.remote !== "any" ? 1 : 0) +
    (filters.posted !== "any" ? 1 : 0) +
    (filters.salary[0] !== 40 || filters.salary[1] !== 300 ? 1 : 0);

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
              className={`segmented-seg ${filters.remote === v ? "is-on" : ""}`}
              onClick={() => setRemote(v)}
            >
              {v === "any" ? "All" : v[0].toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="rail-section">
        <SalaryScrubber min={40} max={300} value={filters.salary} onChange={setSalary} jobs={jobs} />
      </div>

      <div className="rail-section">
        <ChipGroup
          label="Seniority"
          options={meta.levels}
          selected={filters.levels}
          onToggle={(v) => toggle("levels", v)}
        />
      </div>

      <div className="rail-section">
        <ChipGroup
          label="Employment"
          options={meta.types}
          selected={filters.types}
          onToggle={(v) => toggle("types", v)}
        />
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
              className={`segmented-seg ${filters.posted === v.id ? "is-on" : ""}`}
              onClick={() => setPosted(v.id)}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {allTags.length > 0 && (
        <div className="rail-section">
          <ChipGroup
            label="Skills"
            options={allTags.slice(0, 40)}
            selected={filters.tags}
            onToggle={(v) => toggle("tags", v)}
          />
        </div>
      )}
    </aside>
  );
}
