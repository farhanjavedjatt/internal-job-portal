"use client";

import { useEffect, useState } from "react";
import type { UiJob } from "@/lib/types";

export default function JobDetail({ job, onClose }: { job: UiJob | null; onClose: () => void }) {
  const [description, setDescription] = useState<string>(job?.description ?? "");
  const [loadingDesc, setLoadingDesc] = useState(false);

  useEffect(() => {
    if (!job) return;
    setDescription(job.description ?? "");
    // Slim list payload omits descriptions to keep SSR lean. Fetch the full
    // text on demand when the detail dialog opens.
    if (!job.description) {
      setLoadingDesc(true);
      fetch(`/api/job/${encodeURIComponent(job.id)}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          if (d?.description) setDescription(d.description);
        })
        .catch(() => {})
        .finally(() => setLoadingDesc(false));
    }
  }, [job]);

  if (!job) return null;
  return (
    <div className="detail-backdrop" onClick={onClose}>
      <div className="detail-panel glass" onClick={(e) => e.stopPropagation()}>
        <button className="detail-close" onClick={onClose} aria-label="Close">
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path
              d="M4 4 L14 14 M14 4 L4 14"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>
        <div
          className="detail-glyph"
          style={{
            background: `linear-gradient(135deg, oklch(72% 0.17 ${job.companyHue}) 0%, oklch(58% 0.14 ${
              job.companyHue + 40
            }) 100%)`,
          }}
        >
          {job.companyMono}
        </div>
        <div className="detail-company mono">{job.company} · {job.source.toUpperCase()}</div>
        <div className="detail-title">{job.title}</div>
        <div className="detail-meta">
          <span className="mono">{job.level}</span>
          <span className="dot" />
          <span className="mono">{job.type}</span>
          <span className="dot" />
          <span className="mono">{job.location}</span>
          {job.remote && (
            <>
              <span className="dot" />
              <span className="mono" style={{ color: "var(--accent)" }}>
                ◉ REMOTE OK
              </span>
            </>
          )}
        </div>
        <div className="detail-salary-box">
          <div className="detail-salary-label mono">COMPENSATION · ANNUAL</div>
          <div className="detail-salary-value">
            ${job.salaryMin}
            <span className="mono" style={{ fontSize: "0.5em", opacity: 0.6 }}>k</span>
            <span style={{ opacity: 0.3, margin: "0 0.3em" }}>—</span>${job.salaryMax}
            <span className="mono" style={{ fontSize: "0.5em", opacity: 0.6 }}>k</span>
          </div>
        </div>
        {loadingDesc && !description ? (
          <div className="detail-desc mono" style={{ opacity: 0.5 }}>loading description…</div>
        ) : description ? (
          <div className="detail-desc">{description}</div>
        ) : null}
        {job.tags.length > 0 && (
          <div className="detail-tags">
            {job.tags.map((t) => (
              <span key={t} className="tag">
                {t}
              </span>
            ))}
          </div>
        )}
        <div className="detail-stats">
          <div className="detail-stat">
            <div className="detail-stat-num">{job.daysAgo}</div>
            <div className="detail-stat-label mono">DAYS AGO</div>
          </div>
          <div className="detail-stat">
            <div className="detail-stat-num mono" style={{ fontSize: "1.2em" }}>
              {job.timezone}
            </div>
            <div className="detail-stat-label mono">TIMEZONE</div>
          </div>
          <div className="detail-stat">
            <div className="detail-stat-num mono" style={{ fontSize: "1.2em" }}>
              {job.source.toUpperCase()}
            </div>
            <div className="detail-stat-label mono">SOURCE</div>
          </div>
        </div>
        {job.jobUrl && (
          <a
            href={job.jobUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="detail-apply"
            style={{ textDecoration: "none" }}
          >
            Apply now <span aria-hidden>→</span>
          </a>
        )}
      </div>
    </div>
  );
}
