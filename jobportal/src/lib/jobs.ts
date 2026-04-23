import { getServerSupabase } from "./supabase";
import type { Filters, JobMeta, JobRow, UiJob } from "./types";

export const META: JobMeta = {
  types: ["Full-time", "Part-time", "Contract"],
  levels: ["Junior", "Mid", "Senior", "Staff", "Principal"],
  sizes: ["1–10", "11–50", "51–200", "201–500", "501–2k", "2k+"],
};

export function rowToUi(row: JobRow): UiJob {
  const company = row.company ?? "Unknown";
  const hue = hashHue(company);
  const locationParts = [row.location_city, row.location_state ?? row.location_country]
    .filter(Boolean)
    .join(", ");
  const postedAt = row.date_posted
    ? Date.parse(row.date_posted)
    : Date.parse(row.first_seen_at);
  const now = Date.now();
  const daysAgo = Math.max(0, Math.round((now - postedAt) / 86400000));
  const salaryMin = scaleSalary(row.salary_min, row.salary_interval);
  const salaryMax = scaleSalary(row.salary_max, row.salary_interval);

  return {
    id: row.id,
    title: row.title,
    company,
    companyHue: hue,
    companyMono: monoOf(company),
    companySize: "—",
    location: locationParts || (row.is_remote ? "Remote" : "—"),
    timezone: tzFromCountry(row.location_country),
    remote: row.is_remote,
    type: normalizeType(row.job_type),
    level: normalizeLevel(row.job_level ?? row.title),
    salaryMin: salaryMin ?? 40,
    salaryMax: salaryMax ?? Math.max(60, (salaryMin ?? 40) + 20),
    postedAt,
    daysAgo,
    tags: (row.tags ?? []).slice(0, 5),
    description: row.description ?? "",
    applicants: null,
    relevance: 0.5,
    jobUrl: row.job_url ?? "",
    source: row.source,
  };
}

function scaleSalary(n: number | null, interval: string | null): number | null {
  if (n === null || n === undefined || Number.isNaN(n)) return null;
  // Normalize to "k/yr" units.
  if (interval === "hourly") return Math.round((n * 2080) / 1000);
  if (interval === "monthly") return Math.round((n * 12) / 1000);
  return Math.round(n / 1000);
}

function hashHue(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h % 360;
}

function monoOf(s: string): string {
  const words = s.split(/\s+/).filter(Boolean);
  if (!words.length) return "—";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

const TZ_BY_COUNTRY: Record<string, string> = {
  USA: "US", "United States": "US",
  UK: "GMT", "United Kingdom": "GMT", England: "GMT",
  Germany: "CET", Deutschland: "CET",
  Canada: "EST", Netherlands: "CET", France: "CET",
  Spain: "CET", Portugal: "WET", Ireland: "GMT",
};
function tzFromCountry(c: string | null): string {
  if (!c) return "—";
  return TZ_BY_COUNTRY[c] ?? c.slice(0, 3).toUpperCase();
}

function normalizeType(s: string | null): string {
  if (!s) return "Full-time";
  const v = s.toLowerCase();
  if (v.includes("part")) return "Part-time";
  if (v.includes("contract") || v.includes("freelance")) return "Contract";
  if (v.includes("intern")) return "Internship";
  return "Full-time";
}

function normalizeLevel(s: string | null): string {
  if (!s) return "Mid";
  const v = s.toLowerCase();
  if (v.includes("principal")) return "Principal";
  if (v.includes("staff")) return "Staff";
  if (v.includes("senior") || v.includes("sr.") || v.includes("sr ")) return "Senior";
  if (v.includes("junior") || v.includes("jr.") || v.includes("entry")) return "Junior";
  if (v.includes("lead") || v.includes("head of")) return "Staff";
  return "Mid";
}

export async function fetchJobs(filters?: Partial<Filters>, limit = 500): Promise<UiJob[]> {
  const sb = await getServerSupabase();
  let q = sb
    .from("jobs")
    .select("*")
    .eq("is_active", true)
    .order("date_posted", { ascending: false, nullsFirst: false })
    .limit(limit);

  if (filters?.q && filters.q.trim()) {
    q = q.textSearch("search_tsv", filters.q.trim(), { type: "websearch" });
  }
  if (filters?.remote === "remote") q = q.eq("is_remote", true);
  if (filters?.remote === "onsite") q = q.eq("is_remote", false);
  if (filters?.posted === "24h") q = q.gte("date_posted", daysAgoISO(1));
  if (filters?.posted === "7d") q = q.gte("date_posted", daysAgoISO(7));
  if (filters?.posted === "30d") q = q.gte("date_posted", daysAgoISO(30));

  const { data, error } = await q;
  if (error) {
    console.error("fetchJobs error", error);
    return [];
  }
  return (data as JobRow[]).map(rowToUi);
}

function daysAgoISO(days: number): string {
  const d = new Date(Date.now() - days * 86400000);
  return d.toISOString().slice(0, 10);
}
