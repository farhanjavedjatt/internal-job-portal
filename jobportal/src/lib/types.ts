export type JobRow = {
  id: string;
  source: string;
  source_job_id: string;
  title: string;
  company: string | null;
  company_url: string | null;
  location_country: string | null;
  location_city: string | null;
  location_state: string | null;
  is_remote: boolean;
  description: string | null;
  job_type: string | null;
  job_function: string | null;
  job_level: string | null;
  date_posted: string | null;
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string | null;
  salary_interval: string | null;
  job_url: string | null;
  tags: string[] | null;
  first_seen_at: string;
  last_seen_at: string;
  is_active: boolean;
};

export type UiJob = {
  id: string;
  title: string;
  company: string;
  companyHue: number;
  companyMono: string;
  companySize: string;
  location: string;
  timezone: string;
  remote: boolean;
  type: string;
  level: string;
  salaryMin: number;
  salaryMax: number;
  postedAt: number;
  daysAgo: number;
  tags: string[];
  description: string;
  applicants: number | null;
  relevance: number;
  jobUrl: string;
  source: string;
};

export type Filters = {
  q: string;
  types: string[];
  levels: string[];
  sizes: string[];
  tags: string[];
  salary: [number, number];
  posted: "any" | "24h" | "7d" | "30d";
  remote: "any" | "remote" | "onsite";
};

export type JobMeta = {
  types: string[];
  levels: string[];
  sizes: string[];
};

export type Tweaks = {
  theme: "light" | "dark";
  accentHue: number;
  density: "spacious" | "dense";
  font: "inter" | "space" | "serif";
  cardStyle: "frost" | "crystal" | "liquid";
};
