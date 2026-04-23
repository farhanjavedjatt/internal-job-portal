// Filter rail — glass sidebar with chip groups, scrubber, tag cloud
const { useState: useStateFR } = React;

function ChipGroup({ label, options, selected, onToggle, multi = true }) {
  return (
    <div className="chipgroup">
      <div className="chipgroup-label mono">{label}</div>
      <div className="chipgroup-chips">
        {options.map(opt => {
          const isOn = selected.includes(opt);
          return (
            <button
              key={opt}
              className={`chip ${isOn ? 'is-on' : ''}`}
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

function FilterRail({ filters, setFilters, jobs, meta, allTags }) {
  const toggle = (key, val) => {
    setFilters(f => {
      const arr = f[key];
      return { ...f, [key]: arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val] };
    });
  };

  const setSalary = (v) => setFilters(f => ({ ...f, salary: v }));
  const setPosted = (v) => setFilters(f => ({ ...f, posted: v }));
  const setRemote = (v) => setFilters(f => ({ ...f, remote: v }));

  const clearAll = () => setFilters({
    q: '', types: [], levels: [], sizes: [], tags: [],
    salary: [40, 300], posted: 'any', remote: 'any',
  });

  const activeCount =
    filters.types.length + filters.levels.length + filters.sizes.length + filters.tags.length +
    (filters.remote !== 'any' ? 1 : 0) + (filters.posted !== 'any' ? 1 : 0) +
    (filters.salary[0] !== 40 || filters.salary[1] !== 300 ? 1 : 0);

  return (
    <aside className="rail glass">
      <div className="rail-head">
        <div>
          <div className="rail-title">Refine</div>
          <div className="rail-sub mono">{activeCount} FILTER{activeCount !== 1 ? 'S' : ''} ACTIVE</div>
        </div>
        {activeCount > 0 && (
          <button className="rail-clear mono" onClick={clearAll}>CLEAR</button>
        )}
      </div>

      <div className="rail-section">
        <div className="chipgroup-label mono">Workplace</div>
        <div className="segmented">
          {['any', 'remote', 'onsite'].map(v => (
            <button
              key={v}
              className={`segmented-seg ${filters.remote === v ? 'is-on' : ''}`}
              onClick={() => setRemote(v)}
            >{v === 'any' ? 'All' : v[0].toUpperCase() + v.slice(1)}</button>
          ))}
        </div>
      </div>

      <div className="rail-section">
        <SalaryScrubber
          min={40}
          max={300}
          value={filters.salary}
          onChange={setSalary}
          jobs={jobs}
        />
      </div>

      <div className="rail-section">
        <ChipGroup
          label="Seniority"
          options={meta.levels}
          selected={filters.levels}
          onToggle={(v) => toggle('levels', v)}
        />
      </div>

      <div className="rail-section">
        <ChipGroup
          label="Employment"
          options={meta.types}
          selected={filters.types}
          onToggle={(v) => toggle('types', v)}
        />
      </div>

      <div className="rail-section">
        <div className="chipgroup-label mono">Posted</div>
        <div className="segmented">
          {[
            { id: 'any', label: 'Any' },
            { id: '24h', label: '24h' },
            { id: '7d', label: '7d' },
            { id: '30d', label: '30d' },
          ].map(v => (
            <button
              key={v.id}
              className={`segmented-seg ${filters.posted === v.id ? 'is-on' : ''}`}
              onClick={() => setPosted(v.id)}
            >{v.label}</button>
          ))}
        </div>
      </div>

      <div className="rail-section">
        <ChipGroup
          label="Company size"
          options={meta.sizes}
          selected={filters.sizes}
          onToggle={(v) => toggle('sizes', v)}
        />
      </div>

      <div className="rail-section">
        <ChipGroup
          label="Skills"
          options={allTags}
          selected={filters.tags}
          onToggle={(v) => toggle('tags', v)}
        />
      </div>
    </aside>
  );
}

Object.assign(window, { FilterRail });
