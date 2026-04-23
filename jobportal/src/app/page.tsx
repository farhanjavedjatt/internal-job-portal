import JobsDashboard from "@/components/JobsDashboard";
import { fetchJobs, META } from "@/lib/jobs";

export const revalidate = 60;

export default async function Page() {
  const jobs = await fetchJobs({}, 500);
  return <JobsDashboard initialJobs={jobs} meta={META} />;
}
