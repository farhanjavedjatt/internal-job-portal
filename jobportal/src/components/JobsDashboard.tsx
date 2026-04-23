"use client";

import { useEffect, useMemo, useState } from "react";
import Aurora from "./Aurora";
import FilterRail from "./FilterRail";
import JobCard from "./JobCard";
import JobDetail from "./JobDetail";
import SortWheel from "./SortWheel";
import { useTweaks } from "@/hooks/useTweaks";
import type { Filters, JobMeta, UiJob } from "@/lib/types";

const SORT_OPTIONS = [
  { id: "recent", label: "Most recent" },
  { id: "salary-desc", label: "Salary ↓" },
  { id: "salary-asc", label: "Salary ↑" },
  { id: "match", label: "Best match" },
  { id: "company", label: "Company A→Z" },
];

type Props = {
  initialJobs: UiJob[];
  meta: JobMeta;
};

export default function JobsDashboard({ initialJobs, meta }: Props) {
  const [tweaks, setTweaks] = useTweaks();
  const [filters, setFilters] = useState<Filters>({
    q: "",
    types: [],
    levels: [],
    sizes: [],
    tags: [],
    salary: [40, 300],
    posted: "any",
    remote: "any",
  });
  const [sort, setSort] = useState("recent");
  const [open, setOpen] = useState<UiJob | null>(null);

  const jobs = initialJobs;
  const allTags = useMemo(() => {
    const s = new Set<string>();
    jobs.forEach((j) => j.tags.forEach((t) => s.add(t)));
    return [...s].sort();
  }, [jobs]);

  const filtered = useMemo(() => {
    const q = filters.q.toLowerCase().trim();
    let list = jobs.filter((j) => {
      if (q) {
        const hay = `${j.title} ${j.company} ${j.location} ${j.tags.join(" ")}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (filters.remote === "remote" && !j.remote) return false;
      if (filters.remote === "onsite" && j.remote) return false;
      if (filters.types.length && !filters.types.includes(j.type)) return false;
      if (filters.levels.length && !filters.levels.includes(j.level)) return false;
      if (filters.tags.length && !filters.tags.some((t) => j.tags.includes(t))) return false;
      const mid = (j.salaryMin + j.salaryMax) / 2;
      if (mid < filters.salary[0] || mid > filters.salary[1]) return false;
      if (filters.posted === "24h" && j.daysAgo > 1) return false;
      if (filters.posted === "7d" && j.daysAgo > 7) return false;
      if (filters.posted === "30d" && j.daysAgo > 30) return false;
      return true;
    });
    const sorted = [...list];
    if (sort === "recent") sorted.sort((a, b) => a.daysAgo - b.daysAgo);
    else if (sort === "salary-desc") sorted.sort((a, b) => b.salaryMax - a.salaryMax);
    else if (sort === "salary-asc") sorted.sort((a, b) => a.salaryMin - b.salaryMin);
    else if (sort === "match") sorted.sort((a, b) => b.relevance - a.relevance);
    else if (sort === "company") sorted.sort((a, b) => a.company.localeCompare(b.company));
    return sorted;
  }, [jobs, filters, sort]);

  const heroStats = useMemo(() => {
    const total = filtered.length;
    const remote = filtered.filter((j) => j.remote).length;
    const mids = filtered.map((j) => (j.salaryMin + j.salaryMax) / 2).sort((a, b) => a - b);
    const medianSalary = mids.length ? Math.round(mids[Math.floor(mids.length / 2)]) : 0;
    const companies = new Set(filtered.map((j) => j.company)).size;
    return { total, remote, medianSalary, companies };
  }, [filtered]);

  // Suppress SSR hydration drift on theme classes
  useEffect(() => {
    document.documentElement.dataset.theme = tweaks.theme;
  }, [tweaks.theme]);

  return (
    <>
      <Aurora theme={tweaks.theme} accentHue={tweaks.accentHue} />

      <div className="app">
        <header className="topbar glass">
          <div className="brand">
            <div className="brand-mark" aria-hidden>
              <svg width="28" height="28" viewBox="0 0 28 28">
                <circle
                  cx="14"
                  cy="14"
                  r="11"
                  fill="none"
                  stroke="url(#brand-g)"
                  strokeWidth="1.5"
                />
                <circle cx="14" cy="14" r="6" fill="url(#brand-g)" opacity="0.8" />
                <defs>
                  <linearGradient id="brand-g" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="var(--accent)" />
                    <stop offset="100%" stopColor="var(--accent-2)" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <div className="brand-name">
              Prism<span className="brand-dot">.</span>work
            </div>
          </div>

          <div className="search glass-inset">
            <svg width="16" height="16" viewBox="0 0 16 16" className="search-icon">
              <circle cx="7" cy="7" r="5" fill="none" stroke="currentColor" strokeWidth="1.4" />
              <path
                d="M10.5 10.5 L14 14"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
            </svg>
            <input
              value={filters.q}
              onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
              placeholder="Search title, company, skill, city…"
            />
            {filters.q && (
              <button
                className="search-clear"
                onClick={() => setFilters((f) => ({ ...f, q: "" }))}
              >
                ×
              </button>
            )}
          </div>

          <div className="topbar-right">
            <SortWheel options={SORT_OPTIONS} value={sort} onChange={setSort} />
            <button
              className="theme-toggle"
              onClick={() =>
                setTweaks((t) => ({ ...t, theme: t.theme === "dark" ? "light" : "dark" }))
              }
              aria-label="toggle theme"
            >
              {tweaks.theme === "dark" ? (
                <svg width="18" height="18" viewBox="0 0 18 18">
                  <circle cx="9" cy="9" r="3.5" fill="currentColor" />
                  <g stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
                    {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
                      <line
                        key={a}
                        x1={9 + Math.cos((a * Math.PI) / 180) * 6}
                        y1={9 + Math.sin((a * Math.PI) / 180) * 6}
                        x2={9 + Math.cos((a * Math.PI) / 180) * 7.5}
                        y2={9 + Math.sin((a * Math.PI) / 180) * 7.5}
                      />
                    ))}
                  </g>
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 18 18">
                  <path d="M13 10 A5 5 0 0 1 8 5 A5 5 0 0 0 13 10 Z" fill="currentColor" />
                </svg>
              )}
            </button>
          </div>
        </header>

        <div className="layout">
          <FilterRail
            filters={filters}
            setFilters={setFilters}
            jobs={jobs}
            meta={meta}
            allTags={allTags}
          />

          <main className="main">
            <div className="stats-strip glass">
              <div className="stat">
                <div className="stat-num">{heroStats.total}</div>
                <div className="stat-label mono">OPEN ROLES</div>
              </div>
              <div className="stat">
                <div className="stat-num">{heroStats.remote}</div>
                <div className="stat-label mono">REMOTE</div>
              </div>
              <div className="stat">
                <div className="stat-num">
                  ${heroStats.medianSalary}
                  <span style={{ fontSize: "0.5em", opacity: 0.5 }} className="mono">
                    k
                  </span>
                </div>
                <div className="stat-label mono">MEDIAN SALARY</div>
              </div>
              <div className="stat">
                <div className="stat-num">{heroStats.companies}</div>
                <div className="stat-label mono">COMPANIES</div>
              </div>
              <div className="stat stat-pulse">
                <div className="stat-num-sm mono">LIVE</div>
                <div className="stat-label mono">UPDATED JUST NOW</div>
              </div>
            </div>

            <div className="results-head">
              <div className="results-title">
                {filtered.length} result{filtered.length !== 1 ? "s" : ""}
                {filters.q && (
                  <span className="results-q">
                    {" "}
                    · matching "<em>{filters.q}</em>"
                  </span>
                )}
              </div>
              <div className="density-toggle">
                <button
                  className={tweaks.density === "spacious" ? "is-on" : ""}
                  onClick={() => setTweaks((t) => ({ ...t, density: "spacious" }))}
                  aria-label="spacious"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14">
                    <rect x="1" y="1" width="5.5" height="5.5" rx="1" fill="currentColor" />
                    <rect x="7.5" y="1" width="5.5" height="5.5" rx="1" fill="currentColor" />
                    <rect x="1" y="7.5" width="5.5" height="5.5" rx="1" fill="currentColor" />
                    <rect x="7.5" y="7.5" width="5.5" height="5.5" rx="1" fill="currentColor" />
                  </svg>
                </button>
                <button
                  className={tweaks.density === "dense" ? "is-on" : ""}
                  onClick={() => setTweaks((t) => ({ ...t, density: "dense" }))}
                  aria-label="dense"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14">
                    <rect x="1" y="2" width="12" height="1.5" rx="0.5" fill="currentColor" />
                    <rect x="1" y="6.3" width="12" height="1.5" rx="0.5" fill="currentColor" />
                    <rect x="1" y="10.5" width="12" height="1.5" rx="0.5" fill="currentColor" />
                  </svg>
                </button>
              </div>
            </div>

            {filtered.length === 0 ? (
              <div className="empty glass">
                <div className="empty-glyph">◍</div>
                <div className="empty-title">No roles match those filters</div>
                <div className="empty-sub mono">
                  Loosen a filter or clear them all to see the full set.
                </div>
              </div>
            ) : tweaks.density === "dense" ? (
              <div className="job-list">
                <div className="job-list-head mono">
                  <span>ROLE</span>
                  <span>LOCATION</span>
                  <span>TYPE</span>
                  <span>SALARY</span>
                  <span>POSTED</span>
                  <span>SOURCE</span>
                  <span></span>
                </div>
                {filtered.map((j) => (
                  <JobCard key={j.id} job={j} density="dense" onOpen={setOpen} />
                ))}
              </div>
            ) : (
              <div className="job-grid">
                {filtered.map((j) => (
                  <JobCard key={j.id} job={j} density="spacious" onOpen={setOpen} />
                ))}
              </div>
            )}

            <div className="results-footer mono">
              — end of results · {filtered.length} of {jobs.length} —
            </div>
          </main>
        </div>

        {open && <JobDetail job={open} onClose={() => setOpen(null)} />}
      </div>
    </>
  );
}
