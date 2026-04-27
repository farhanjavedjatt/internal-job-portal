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

// PostgREST caps a single response at 1000 rows by default. To return the full
// filtered set without changing the UI contract, fetchJobs paginates internally
// via .range(start, end) chunks. We do a HEAD count first to learn how many
// pages to fetch, then issue them all in parallel — turning what would be a
// 100+ sequential round-trip dance into a single fan-out.
const CHUNK_SIZE = 1000;
const DEFAULT_LIMIT = 200_000;

// Columns shipped to the dashboard's initial render. `raw` (full source jsonb)
// and `description` (can be multi-KB) are omitted on purpose to keep the SSR
// payload light — the detail dialog gets the full row via a separate fetch.
const SLIM_COLUMNS = [
  "id", "source", "source_job_id", "title",
  "company", "company_url",
  "location_country", "location_city", "location_state",
  "is_remote",
  "job_type", "job_function", "job_level",
  "date_posted",
  "salary_min", "salary_max", "salary_currency", "salary_interval",
  "job_url", "tags",
  "first_seen_at", "last_seen_at", "is_active",
].join(",");

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyFilters<Q>(q: Q, filters?: Partial<Filters>): Q {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let cur: any = q;
  if (filters?.q && filters.q.trim()) {
    cur = cur.textSearch("search_tsv", filters.q.trim(), { type: "websearch" });
  }
  if (filters?.remote === "remote") cur = cur.eq("is_remote", true);
  if (filters?.remote === "onsite") cur = cur.eq("is_remote", false);
  if (filters?.posted === "24h") cur = cur.gte("date_posted", daysAgoISO(1));
  if (filters?.posted === "7d") cur = cur.gte("date_posted", daysAgoISO(7));
  if (filters?.posted === "30d") cur = cur.gte("date_posted", daysAgoISO(30));
  return cur as Q;
}

async function fetchChunk(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sb: any,
  filters: Partial<Filters> | undefined,
  offset: number,
  to: number,
  attempt: number = 1,
): Promise<JobRow[]> {
  const builder = applyFilters(
    sb
      .from("jobs")
      .select(SLIM_COLUMNS)
      .eq("is_active", true)
      .order("date_posted", { ascending: false, nullsFirst: false })
      .order("id", { ascending: true })
      .range(offset, to),
    filters,
  );
  const { data, error } = await builder;
  if (error) {
    if (attempt < 3) {
      // Retry transient timeouts (Supabase free tier statement timeout under load).
      await new Promise((r) => setTimeout(r, 200 * attempt));
      return fetchChunk(sb, filters, offset, to, attempt + 1);
    }
    console.error(`fetchJobs chunk ${offset}-${to} failed after ${attempt} attempts`, error);
    return [];
  }
  return (data ?? []) as unknown as JobRow[];
}

// Run an array of async tasks with bounded concurrency, preserving order.
async function mapWithConcurrency<T, R>(
  items: T[],
  fn: (item: T) => Promise<R>,
  concurrency: number,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  async function worker() {
    while (true) {
      const i = next++;
      if (i >= items.length) return;
      results[i] = await fn(items[i]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, () => worker()));
  return results;
}

export async function fetchJobs(
  filters?: Partial<Filters>,
  limit = DEFAULT_LIMIT,
): Promise<UiJob[]> {
  const sb = await getServerSupabase();

  // 1. ESTIMATED count — Postgres planner stats, instant. The exact count
  //    triggers an RLS-aware COUNT(*) which times out on 70k+ rows under the
  //    Supabase free tier statement timeout.
  const countBuilder = applyFilters(
    sb.from("jobs").select("id", { count: "estimated", head: true }).eq("is_active", true),
    filters,
  );
  const countResp = await countBuilder;
  // Even if the estimate fails, fall back to a sane default and let the
  // sequential tail at the end discover the true end of the result set.
  const estimate = countResp.error ? DEFAULT_LIMIT : (countResp.count ?? DEFAULT_LIMIT);
  // Add 10% overshoot so a low estimate doesn't truncate; sequential tail handles the rest.
  const target = Math.min(Math.ceil(estimate * 1.1), limit);

  // 2. Fan out range fetches in parallel.
  const offsets: number[] = [];
  for (let o = 0; o < target; o += CHUNK_SIZE) offsets.push(o);

  // Bounded concurrency keeps us from drowning Supabase's free-tier connection
  // pool, which causes statement-timeout errors on individual range queries.
  const PARALLELISM = 8;
  const parallelResults = await mapWithConcurrency(
    offsets,
    (offset) => fetchChunk(sb, filters, offset, Math.min(offset + CHUNK_SIZE, target) - 1),
    PARALLELISM,
  );

  const all: JobRow[] = parallelResults.flat();

  // 3. Sequential tail — if the last parallel chunk was full, the dataset may
  //    extend beyond our estimate. Keep walking forward until we hit a short
  //    page or the safety cap.
  let nextOffset = target;
  let lastChunkFull =
    parallelResults.length > 0 && parallelResults[parallelResults.length - 1].length === CHUNK_SIZE;
  while (lastChunkFull && nextOffset < limit) {
    const to = Math.min(nextOffset + CHUNK_SIZE, limit) - 1;
    const chunk = await fetchChunk(sb, filters, nextOffset, to);
    all.push(...chunk);
    if (chunk.length < to - nextOffset + 1) break;
    nextOffset += CHUNK_SIZE;
    lastChunkFull = chunk.length === CHUNK_SIZE;
  }

  return all.map(rowToUi);
}

function daysAgoISO(days: number): string {
  const d = new Date(Date.now() - days * 86400000);
  return d.toISOString().slice(0, 10);
}
