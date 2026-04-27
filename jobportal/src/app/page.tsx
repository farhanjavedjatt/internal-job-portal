import JobsDashboard from "@/components/JobsDashboard";
import { fetchJobs, META } from "@/lib/jobs";

export const revalidate = 60;

export default async function Page() {
  // No artificial cap — fetchJobs paginates via 1000-row .range() chunks internally.
  const jobs = await fetchJobs({});
  return <JobsDashboard initialJobs={jobs} meta={META} />;
}
