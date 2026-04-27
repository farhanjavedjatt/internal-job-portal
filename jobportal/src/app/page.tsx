import JobsDashboard from "@/components/JobsDashboard";
import { fetchAllSources, fetchJobsPage, META, type ServerFilters } from "@/lib/jobs";

type SP = Promise<{
  page?: string;
  q?: string;
  remote?: string;
  posted?: string;
  source?: string;
  sort?: string;
}>;

const PAGE_SIZE = 24;

function parseFilters(sp: Awaited<SP>): ServerFilters {
  const remote =
    sp.remote === "remote" || sp.remote === "onsite" || sp.remote === "any"
      ? sp.remote
      : "any";
  const posted =
    sp.posted === "24h" || sp.posted === "7d" || sp.posted === "30d" || sp.posted === "any"
      ? sp.posted
      : "any";
  const sort = sp.sort === "company" ? "company" : "recent";
  return {
    q: sp.q?.trim() || undefined,
    remote,
    posted,
    source: sp.source || undefined,
    sort,
  };
}

export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const filters = parseFilters(sp);

  const [pageData, sources] = await Promise.all([
    fetchJobsPage(filters, page, PAGE_SIZE),
    fetchAllSources(),
  ]);

  return (
    <JobsDashboard
      initialJobs={pageData.jobs}
      totalCount={pageData.totalCount}
      page={pageData.page}
      pageSize={pageData.pageSize}
      filters={filters}
      sources={sources}
      meta={META}
    />
  );
}
