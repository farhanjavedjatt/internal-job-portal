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

const PAGE_SIZE = 24;

function buildPageList(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | "…")[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  if (start > 2) pages.push("…");
  for (let i = start; i <= end; i++) pages.push(i);
  if (end < total - 1) pages.push("…");
  pages.push(total);
  return pages;
}

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
  const [page, setPage] = useState(1);

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

  // Reset to page 1 whenever filter/sort changes the result set.
  useEffect(() => {
    setPage(1);
  }, [filters, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const visible = filtered.slice(pageStart, pageStart + PAGE_SIZE);

  return (
    <>
      <Aurora theme={tweaks.theme} accentHue={tweaks.accentHue} />

      <div className="app">
        <header className="topbar glass">
          <div className="brand">
            <div className="brand-mark" aria-hidden>
              <svg width="32" height="32" viewBox="0 0 32 32">
                <defs>
                  <linearGradient id="brand-g" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="var(--accent)" />
                    <stop offset="100%" stopColor="var(--accent-2)" />
                  </linearGradient>
                </defs>
                <rect x="2" y="10" width="28" height="18" rx="4" fill="url(#brand-g)" />
                <path
                  d="M11 10 V7.5 A1.5 1.5 0 0 1 12.5 6 H19.5 A1.5 1.5 0 0 1 21 7.5 V10"
                  fill="none"
                  stroke="url(#brand-g)"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <rect x="13.5" y="16" width="5" height="2" rx="1" fill="rgba(255,255,255,0.9)" />
              </svg>
            </div>
            <div className="brand-name">
              Internal <span className="brand-accent">Job Portal</span>
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
              {tweaks.theme === "light" ? (
                <svg width="18" height="18" viewBox="0 0 18 18">
                  <circle cx="9" cy="9" r="3.5" fill="currentColor" />
                  <g stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
                    {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
                      <line
                        key={a}
                        x1={9 + Math.cos((a * Math.PI) / 180) * 5.5}
                        y1={9 + Math.sin((a * Math.PI) / 180) * 5.5}
                        x2={9 + Math.cos((a * Math.PI) / 180) * 7.5}
                        y2={9 + Math.sin((a * Math.PI) / 180) * 7.5}
                      />
                    ))}
                  </g>
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 18 18">
                  <path
                    d="M14 11 A5.5 5.5 0 0 1 7 4 A5.5 5.5 0 1 0 14 11 Z"
                    fill="currentColor"
                  />
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
                {visible.map((j) => (
                  <JobCard key={j.id} job={j} density="dense" onOpen={setOpen} />
                ))}
              </div>
            ) : (
              <div className="job-grid">
                {visible.map((j) => (
                  <JobCard key={j.id} job={j} density="spacious" onOpen={setOpen} />
                ))}
              </div>
            )}

            {filtered.length > 0 && (
              <nav className="pagination glass" aria-label="Pagination">
                <button
                  className="pagination-btn"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  aria-label="Previous page"
                >
                  ← Prev
                </button>
                <div className="pagination-pages mono">
                  {buildPageList(currentPage, totalPages).map((p, i) =>
                    p === "…" ? (
                      <span key={`e${i}`} className="pagination-ellipsis">…</span>
                    ) : (
                      <button
                        key={p}
                        className={`pagination-page ${p === currentPage ? "is-on" : ""}`}
                        onClick={() => setPage(p as number)}
                        aria-current={p === currentPage ? "page" : undefined}
                      >
                        {p}
                      </button>
                    )
                  )}
                </div>
                <button
                  className="pagination-btn"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  aria-label="Next page"
                >
                  Next →
                </button>
              </nav>
            )}

            <div className="results-footer mono">
              {filtered.length
                ? `showing ${pageStart + 1}–${pageStart + visible.length} of ${filtered.length}`
                : `0 of ${jobs.length}`}
            </div>
          </main>
        </div>

        {open && <JobDetail job={open} onClose={() => setOpen(null)} />}
      </div>
    </>
  );
}
