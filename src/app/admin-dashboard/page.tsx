import auth from "@/lib/auth";
import { redirect } from "next/navigation";
import UsersTable from "@/components/adminDashboard/usersTable";

async function adminPage() {
  const session = await auth();
  if (!session || session?.user.role !== "Admin") {
    redirect("/");
  }

  return (
    <div className="p-8">
      <UsersTable />
    </div>
  );
}
export default adminPage;
