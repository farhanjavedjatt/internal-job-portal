// Job card — glass panel with company glyph, salary bar, metadata ribbon
const { useState: useStateJC } = React;

function JobCard({ job, density, onOpen }) {
  const [hover, setHover] = useStateJC(false);
  const postedLabel = job.daysAgo === 0 ? 'today' : job.daysAgo === 1 ? 'yesterday' : `${job.daysAgo}d ago`;

  if (density === 'dense') {
    return (
      <div
        className="job-row glass"
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onClick={() => onOpen(job)}
      >
        <div className="job-row-glyph" style={{ background: `oklch(70% 0.14 ${job.companyHue})` }}>
          <span>{job.companyMono}</span>
        </div>
        <div className="job-row-primary">
          <div className="job-row-title">{job.title}</div>
          <div className="job-row-sub mono">{job.company} · {job.level}</div>
        </div>
        <div className="job-row-loc mono">
          {job.remote && <span className="chip-mini">◉ REMOTE</span>}
          <span>{job.location}</span>
        </div>
        <div className="job-row-type mono">{job.type}</div>
        <div className="job-row-salary">
          <span className="mono salary-num">${job.salaryMin}–{job.salaryMax}k</span>
        </div>
        <div className="job-row-posted mono">{postedLabel}</div>
        <div className="job-row-applicants mono">
          <svg width="10" height="10" viewBox="0 0 10 10" style={{ marginRight: 4, opacity: 0.6 }}>
            <circle cx="5" cy="3.5" r="1.8" fill="none" stroke="currentColor" strokeWidth="1"/>
            <path d="M1.5 9 Q5 6 8.5 9" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
          </svg>
          {job.applicants}
        </div>
        <div className="job-row-arrow" aria-hidden>→</div>
      </div>
    );
  }

  // spacious card
  return (
    <div
      className="job-card glass"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={() => onOpen(job)}
    >
      <div className="job-card-top">
        <div className="job-card-glyph" style={{
          background: `linear-gradient(135deg, oklch(70% 0.16 ${job.companyHue}) 0%, oklch(60% 0.14 ${job.companyHue + 40}) 100%)`,
        }}>
          <span>{job.companyMono}</span>
        </div>
        <div className="job-card-meta">
          <div className="job-card-posted mono">{postedLabel}</div>
          {job.remote && <div className="chip-mini chip-remote">◉ REMOTE</div>}
        </div>
      </div>

      <div className="job-card-title">{job.title}</div>
      <div className="job-card-company mono">{job.company} · {job.companySize} people</div>

      <div className="job-card-desc">{job.description}</div>

      <div className="job-card-tags">
        {job.tags.map(t => (
          <span key={t} className="tag">{t}</span>
        ))}
      </div>

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
          <div className="job-card-salary-fill" style={{
            width: `${Math.min(100, (job.salaryMax / 300) * 100)}%`
          }}/>
        </div>
      </div>

      <div className="job-card-hover-glow" style={{
        opacity: hover ? 1 : 0,
        background: `radial-gradient(circle at 50% 0%, oklch(75% 0.15 ${job.companyHue}) 0%, transparent 60%)`,
      }} />
    </div>
  );
}

Object.assign(window, { JobCard });
