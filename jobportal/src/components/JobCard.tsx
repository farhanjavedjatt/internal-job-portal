"use client";

import type { UiJob } from "@/lib/types";

type Props = {
  job: UiJob;
  density: "spacious" | "dense";
  onOpen: (j: UiJob) => void;
};

export default function JobCard({ job, density, onOpen }: Props) {
  const postedLabel =
    job.daysAgo === 0 ? "today" : job.daysAgo === 1 ? "yesterday" : `${job.daysAgo}d ago`;

  if (density === "dense") {
    return (
      <div className="job-row glass" onClick={() => onOpen(job)}>
        <div
          className="job-row-glyph"
          style={{ background: `oklch(70% 0.14 ${job.companyHue})` }}
        >
          <span>{job.companyMono}</span>
        </div>
        <div className="job-row-primary">
          <div className="job-row-title">{job.title}</div>
          <div className="job-row-sub mono">
            {job.company} · {job.level}
          </div>
        </div>
        <div className="job-row-loc mono">
          {job.remote && <span className="chip-mini">◉ REMOTE</span>}
          <span>{job.location}</span>
        </div>
        <div className="job-row-type mono">{job.type}</div>
        <div className="job-row-salary">
          <span className="mono salary-num">
            ${job.salaryMin}–{job.salaryMax}k
          </span>
        </div>
        <div className="job-row-posted mono">{postedLabel}</div>
        <div className="job-row-applicants mono">
          <span style={{ opacity: 0.5 }}>{job.source}</span>
        </div>
        <div className="job-row-arrow" aria-hidden>
          →
        </div>
      </div>
    );
  }

  return (
    <div className="job-card glass" onClick={() => onOpen(job)}>
      <div className="job-card-top">
        <div
          className="job-card-glyph"
          style={{
            background: `linear-gradient(135deg, oklch(70% 0.16 ${job.companyHue}) 0%, oklch(60% 0.14 ${
              job.companyHue + 40
            }) 100%)`,
          }}
        >
          <span>{job.companyMono}</span>
        </div>
        <div className="job-card-meta">
          <div className="job-card-posted mono">{postedLabel}</div>
          {job.remote && <div className="chip-mini chip-remote">◉ REMOTE</div>}
        </div>
      </div>

      <div className="job-card-title">{job.title}</div>
      <div className="job-card-company mono">
        {job.company} · {job.source}
      </div>

      <div className="job-card-desc">{job.description || "—"}</div>

      {job.tags.length > 0 && (
        <div className="job-card-tags">
          {job.tags.map((t) => (
            <span key={t} className="tag">
              {t}
            </span>
          ))}
        </div>
      )}

      <div className="job-card-divider" />

      <div className="job-card-bottom">
        <div className="job-card-chips mono">
          <span>{job.level}</span>
          <span className="dot" />
          <span>{job.type}</span>
          <span className="dot" />
          <span>{job.location}</span>
        </div>
      </div>

      <div className="job-card-salary">
        <div className="job-card-salary-label mono">COMPENSATION</div>
        <div className="job-card-salary-value">
          <span className="salary-range-num">${job.salaryMin}</span>
          <span className="salary-range-dash">—</span>
          <span className="salary-range-num">${job.salaryMax}</span>
          <span className="salary-range-unit mono">k / yr</span>
        </div>
        <div className="job-card-salary-bar">
          <div
            className="job-card-salary-fill"
            style={{ width: `${Math.min(100, (job.salaryMax / 300) * 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}
