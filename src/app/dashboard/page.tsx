import DashboardHearo from "@/components/dashboard/DashboardHero";
import DashboardProjects from "@/components/dashboard/DashboardProjects";
async function Page() {
  return (
    <main className="container mx-auto px-4 py-8">
      <DashboardHearo />
      <DashboardProjects />
    </main>
  );
}
export default Page;
