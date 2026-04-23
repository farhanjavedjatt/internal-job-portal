// Mock job dataset — 120 jobs across varied companies, levels, types, geos
(function(){
  const companies = [
    { name: 'Northwind Labs', hue: 210, mono: 'NL' },
    { name: 'Halcyon', hue: 280, mono: 'HA' },
    { name: 'Meridian', hue: 160, mono: 'ME' },
    { name: 'Axiom Forge', hue: 30, mono: 'AF' },
    { name: 'Tessera', hue: 340, mono: 'TE' },
    { name: 'Quill & Quark', hue: 50, mono: 'QQ' },
    { name: 'Lattice AI', hue: 195, mono: 'LA' },
    { name: 'Vellum', hue: 15, mono: 'VL' },
    { name: 'Brightwater', hue: 230, mono: 'BW' },
    { name: 'Sable', hue: 300, mono: 'SA' },
    { name: 'Polymer', hue: 130, mono: 'PO' },
    { name: 'Obsidian Data', hue: 260, mono: 'OD' },
    { name: 'Perennial', hue: 100, mono: 'PE' },
    { name: 'Cartograph', hue: 190, mono: 'CA' },
    { name: 'Marrow', hue: 5, mono: 'MR' },
    { name: 'Fathom', hue: 220, mono: 'FA' },
    { name: 'Kite Works', hue: 75, mono: 'KW' },
    { name: 'Helios', hue: 45, mono: 'HE' },
    { name: 'Anthem', hue: 315, mono: 'AN' },
    { name: 'Umbra', hue: 250, mono: 'UM' },
  ];

  const roles = [
    { title: 'Senior Frontend Engineer', tags: ['React', 'TypeScript', 'CSS'], cat: 'eng' },
    { title: 'Staff Backend Engineer', tags: ['Go', 'Postgres', 'Distributed Systems'], cat: 'eng' },
    { title: 'Product Designer', tags: ['Figma', 'Prototyping', 'Systems'], cat: 'design' },
    { title: 'Design Engineer', tags: ['React', 'Motion', 'CSS'], cat: 'design' },
    { title: 'ML Research Engineer', tags: ['PyTorch', 'LLMs', 'Research'], cat: 'ml' },
    { title: 'Data Scientist', tags: ['Python', 'SQL', 'Statistics'], cat: 'data' },
    { title: 'Engineering Manager', tags: ['Leadership', 'Hiring', 'Strategy'], cat: 'mgmt' },
    { title: 'Platform Engineer', tags: ['Kubernetes', 'Terraform', 'AWS'], cat: 'eng' },
    { title: 'iOS Engineer', tags: ['Swift', 'SwiftUI', 'iOS'], cat: 'mobile' },
    { title: 'Android Engineer', tags: ['Kotlin', 'Jetpack', 'Android'], cat: 'mobile' },
    { title: 'Product Manager', tags: ['Strategy', 'Roadmap', 'B2B'], cat: 'pm' },
    { title: 'Technical Writer', tags: ['Docs', 'DX', 'API'], cat: 'docs' },
    { title: 'Security Engineer', tags: ['AppSec', 'Cloud', 'Incident Response'], cat: 'sec' },
    { title: 'DevRel Engineer', tags: ['Community', 'Content', 'APIs'], cat: 'devrel' },
    { title: 'Brand Designer', tags: ['Identity', 'Typography', 'Illustration'], cat: 'design' },
    { title: 'Motion Designer', tags: ['After Effects', 'Lottie', 'Systems'], cat: 'design' },
    { title: 'Data Engineer', tags: ['Airflow', 'Spark', 'dbt'], cat: 'data' },
    { title: 'Full Stack Engineer', tags: ['Node', 'React', 'Postgres'], cat: 'eng' },
    { title: 'SRE', tags: ['Observability', 'Incident Mgmt', 'Linux'], cat: 'eng' },
    { title: 'AI Product Lead', tags: ['LLMs', 'Strategy', 'UX'], cat: 'ml' },
    { title: 'UX Researcher', tags: ['Qualitative', 'Surveys', 'Insights'], cat: 'design' },
    { title: 'Growth Engineer', tags: ['Experimentation', 'Analytics', 'SQL'], cat: 'growth' },
    { title: 'Solutions Architect', tags: ['Enterprise', 'APIs', 'Integration'], cat: 'eng' },
    { title: 'QA Engineer', tags: ['Automation', 'Playwright', 'CI'], cat: 'eng' },
  ];

  const cities = [
    { name: 'New York, NY', tz: 'EST' },
    { name: 'San Francisco, CA', tz: 'PST' },
    { name: 'Seattle, WA', tz: 'PST' },
    { name: 'Austin, TX', tz: 'CST' },
    { name: 'Boston, MA', tz: 'EST' },
    { name: 'London, UK', tz: 'GMT' },
    { name: 'Berlin, DE', tz: 'CET' },
    { name: 'Amsterdam, NL', tz: 'CET' },
    { name: 'Toronto, ON', tz: 'EST' },
    { name: 'Remote — Global', tz: 'ANY' },
    { name: 'Remote — US', tz: 'US' },
    { name: 'Remote — EU', tz: 'EU' },
    { name: 'Lisbon, PT', tz: 'WET' },
    { name: 'Singapore', tz: 'SGT' },
    { name: 'Sydney, AU', tz: 'AEST' },
  ];

  const types = ['Full-time', 'Part-time', 'Contract'];
  const levels = ['Junior', 'Mid', 'Senior', 'Staff', 'Principal'];
  const sizes = ['1–10', '11–50', '51–200', '201–500', '501–2k', '2k+'];

  // deterministic pseudo-random
  let seed = 7;
  const rand = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
  const pick = (arr) => arr[Math.floor(rand() * arr.length)];
  const range = (a, b) => a + Math.floor(rand() * (b - a + 1));

  const descriptions = [
    'Shape the core product experience alongside a small, senior team. Strong ownership, calm cadence.',
    'Ship surfaces that millions interact with daily. We value craft, clarity, and end-to-end ownership.',
    'Work at the edge of what\'s possible in our domain. Research-led, product-grounded.',
    'Partner closely with design and product to make fast, delightful, fluid interfaces.',
    'Own a critical piece of our platform. Deep work, thoughtful reviews, real impact.',
    'Help us build the tools our customers depend on every day. Small team, big surface area.',
    'Bring ideas to life across mobile, web, and ambient surfaces. Craft-obsessed team.',
    'Define and execute our strategy for the next 18 months. Cross-functional leadership role.',
    'Build infrastructure that thousands of engineers rely on. Reliability is the product.',
    'Prototype, evaluate, ship. Tight loop between research and product.',
  ];

  const jobs = [];
  for (let i = 0; i < 120; i++) {
    const c = pick(companies);
    const r = pick(roles);
    const loc = pick(cities);
    const remote = loc.name.startsWith('Remote') || rand() < 0.35;
    const lvl = pick(levels);
    const base = r.cat === 'ml' ? 160 : r.cat === 'mgmt' ? 180 : r.cat === 'design' ? 120 : r.cat === 'pm' ? 150 : 130;
    const lvlMul = { Junior: 0.55, Mid: 0.8, Senior: 1.0, Staff: 1.3, Principal: 1.6 }[lvl];
    const min = Math.round((base * lvlMul + range(-15, 10)) / 5) * 5;
    const max = min + range(20, 60);
    const daysAgo = range(0, 34);
    const postedAt = Date.now() - daysAgo * 86400000;
    const applicants = range(3, 480);
    jobs.push({
      id: 'j' + (1000 + i),
      title: r.title,
      company: c.name,
      companyHue: c.hue,
      companyMono: c.mono,
      companySize: pick(sizes),
      location: loc.name,
      timezone: loc.tz,
      remote,
      type: pick(types),
      level: lvl,
      salaryMin: min,
      salaryMax: max,
      postedAt,
      daysAgo,
      tags: r.tags,
      category: r.cat,
      description: pick(descriptions),
      applicants,
      relevance: rand(),
    });
  }

  window.JOBS = jobs;
  window.JOB_META = { companies, roles, cities, types, levels, sizes };
})();
