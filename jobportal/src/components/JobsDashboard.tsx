"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Aurora from "./Aurora";
import FilterRail from "./FilterRail";
import JobCard from "./JobCard";
import JobDetail from "./JobDetail";
import SortWheel from "./SortWheel";
import { useTweaks } from "@/hooks/useTweaks";
import type { JobMeta, UiJob } from "@/lib/types";
import type { ServerFilters } from "@/lib/jobs";

const SORT_OPTIONS = [
  { id: "recent", label: "Most recent" },
  { id: "company", label: "Company A→Z" },
];

type Props = {
  initialJobs: UiJob[];
  totalCount: number;
  page: number;
  pageSize: number;
  filters: ServerFilters;
  sources: string[];
  meta: JobMeta;
};

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

function buildQueryString(updates: Record<string, string | undefined>): string {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(updates)) {
    if (v && v !== "any") params.set(k, v);
  }
  const s = params.toString();
  return s ? `?${s}` : "";
}

export default function JobsDashboard({
  initialJobs,
  totalCount,
  page,
  pageSize,
  filters,
  sources,
  meta,
}: Props) {
  const router = useRouter();
  const [tweaks, setTweaks] = useTweaks();
  const [open, setOpen] = useState<UiJob | null>(null);
  const [searchInput, setSearchInput] = useState(filters.q ?? "");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync search input when URL q changes externally
  useEffect(() => {
    setSearchInput(filters.q ?? "");
  }, [filters.q]);

  // Theme attr (in case it drifts)
  useEffect(() => {
    document.documentElement.dataset.theme = tweaks.theme;
  }, [tweaks.theme]);

  function navigate(updates: Record<string, string | undefined>) {
    // Merge with existing filters, reset to page 1 on any filter change unless page is explicitly set
    const merged: Record<string, string | undefined> = {
      q: filters.q,
      remote: filters.remote,
      posted: filters.posted,
      source: filters.source,
      sort: filters.sort,
      page: String(page),
      ...updates,
    };
    if (!("page" in updates)) merged.page = "1";
    router.push("/" + buildQueryString(merged));
  }

  function onSearchChange(v: string) {
    setSearchInput(v);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      navigate({ q: v.trim() || undefined });
    }, 350);
  }

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const pageStart = (page - 1) * pageSize;

  const heroStats = useMemo(() => {
    // Stats are over the full filtered set; we only have the current page in
    // memory, so show counts that reflect the page-level slice + total.
    const pageJobs = initialJobs;
    const remote = pageJobs.filter((j) => j.remote).length;
    const mids = pageJobs.map((j) => (j.salaryMin + j.salaryMax) / 2).sort((a, b) => a - b);
    const median = mids.length ? Math.round(mids[Math.floor(mids.length / 2)]) : 0;
    const companies = new Set(pageJobs.map((j) => j.company)).size;
    return { total: totalCount, remote, median, companies };
  }, [initialJobs, totalCount]);

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
              value={searchInput}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search title, company, skill, city…"
            />
            {searchInput && (
              <button
                className="search-clear"
                onClick={() => onSearchChange("")}
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </div>

          <div className="topbar-right">
            <SortWheel
              options={SORT_OPTIONS}
              value={filters.sort ?? "recent"}
              onChange={(v) => navigate({ sort: v })}
            />
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
            sources={sources}
            onChange={(updates) => navigate(updates)}
          />

          <main className="main">
            <div className="stats-strip glass">
              <div className="stat">
                <div className="stat-num">{heroStats.total.toLocaleString()}</div>
                <div className="stat-label mono">OPEN ROLES</div>
              </div>
              <div className="stat">
                <div className="stat-num">{heroStats.remote}</div>
                <div className="stat-label mono">REMOTE (PAGE)</div>
              </div>
              <div className="stat">
                <div className="stat-num">{heroStats.companies}</div>
                <div className="stat-label mono">COMPANIES (PAGE)</div>
              </div>
              <div className="stat">
                <div className="stat-num">{totalPages.toLocaleString()}</div>
                <div className="stat-label mono">PAGES</div>
              </div>
              <div className="stat stat-pulse">
                <div className="stat-num-sm mono">LIVE</div>
                <div className="stat-label mono">UPDATED JUST NOW</div>
              </div>
            </div>

            <div className="results-head">
              <div className="results-title">
                {totalCount.toLocaleString()} result{totalCount !== 1 ? "s" : ""}
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

            {initialJobs.length === 0 ? (
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
                {initialJobs.map((j) => (
                  <JobCard key={j.id} job={j} density="dense" onOpen={setOpen} />
                ))}
              </div>
            ) : (
              <div className="job-grid">
                {initialJobs.map((j) => (
                  <JobCard key={j.id} job={j} density="spacious" onOpen={setOpen} />
                ))}
              </div>
            )}

            {totalCount > 0 && (
              <nav className="pagination glass" aria-label="Pagination">
                <button
                  className="pagination-btn"
                  onClick={() => navigate({ page: String(Math.max(1, page - 1)) })}
                  disabled={page === 1}
                  aria-label="Previous page"
                >
                  ← Prev
                </button>
                <div className="pagination-pages mono">
                  {buildPageList(page, totalPages).map((p, i) =>
                    p === "…" ? (
                      <span key={`e${i}`} className="pagination-ellipsis">
                        …
                      </span>
                    ) : (
                      <button
                        key={p}
                        className={`pagination-page ${p === page ? "is-on" : ""}`}
                        onClick={() => navigate({ page: String(p) })}
                        aria-current={p === page ? "page" : undefined}
                      >
                        {p}
                      </button>
                    ),
                  )}
                </div>
                <button
                  className="pagination-btn"
                  onClick={() => navigate({ page: String(Math.min(totalPages, page + 1)) })}
                  disabled={page === totalPages}
                  aria-label="Next page"
                >
                  Next →
                </button>
              </nav>
            )}

            <div className="results-footer mono">
              {totalCount
                ? `showing ${(pageStart + 1).toLocaleString()}–${(pageStart + initialJobs.length).toLocaleString()} of ${totalCount.toLocaleString()}`
                : "0 results"}
            </div>
          </main>
        </div>

        {open && <JobDetail job={open} onClose={() => setOpen(null)} />}
      </div>
    </>
  );
}
