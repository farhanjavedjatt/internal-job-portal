// Job detail drawer — opens on card click
function JobDetail({ job, onClose }) {
  if (!job) return null;
  return (
    <div className="detail-backdrop" onClick={onClose}>
      <div className="detail-panel glass" onClick={e => e.stopPropagation()}>
        <button className="detail-close" onClick={onClose} aria-label="Close">
          <svg width="18" height="18" viewBox="0 0 18 18"><path d="M4 4 L14 14 M14 4 L4 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
        </button>
        <div className="detail-glyph" style={{
          background: `linear-gradient(135deg, oklch(72% 0.17 ${job.companyHue}) 0%, oklch(58% 0.14 ${job.companyHue + 40}) 100%)`,
        }}>{job.companyMono}</div>
        <div className="detail-company mono">{job.company} · {job.companySize} PEOPLE</div>
        <div className="detail-title">{job.title}</div>
        <div className="detail-meta">
          <span className="mono">{job.level}</span>
          <span className="dot" />
          <span className="mono">{job.type}</span>
          <span className="dot" />
          <span className="mono">{job.location}</span>
          {job.remote && <><span className="dot" /><span className="mono" style={{color: 'var(--accent)'}}>◉ REMOTE OK</span></>}
        </div>
        <div className="detail-salary-box">
          <div className="detail-salary-label mono">COMPENSATION · ANNUAL</div>
          <div className="detail-salary-value">
            ${job.salaryMin}<span className="mono" style={{fontSize: '0.5em', opacity: 0.6}}>k</span>
            <span style={{opacity: 0.3, margin: '0 0.3em'}}>—</span>
            ${job.salaryMax}<span className="mono" style={{fontSize: '0.5em', opacity: 0.6}}>k</span>
          </div>
        </div>
        <div className="detail-desc">{job.description}</div>
        <div className="detail-tags">
          {job.tags.map(t => <span key={t} className="tag">{t}</span>)}
        </div>
        <div className="detail-stats">
          <div className="detail-stat">
            <div className="detail-stat-num">{job.applicants}</div>
            <div className="detail-stat-label mono">APPLICANTS</div>
          </div>
          <div className="detail-stat">
            <div className="detail-stat-num">{job.daysAgo}<span className="mono" style={{fontSize: '0.5em', opacity: 0.6}}>d</span></div>
            <div className="detail-stat-label mono">POSTED AGO</div>
          </div>
          <div className="detail-stat">
            <div className="detail-stat-num mono" style={{fontSize: '1.4em'}}>{job.timezone}</div>
            <div className="detail-stat-label mono">TIMEZONE</div>
          </div>
        </div>
        <button className="detail-apply">
          Apply now <span aria-hidden>→</span>
        </button>
      </div>
    </div>
  );
}

Object.assign(window, { JobDetail });
