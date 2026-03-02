import { isAdmin} from "@/actions/admin-actions";
import {AdminDashboard} from "@/app/(protected)/dashboard/_components/admin-dashboard";
import {TutorDashboard} from "@/app/(protected)/dashboard/_components/tutor-dashboard";


export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const isUserAdmin = await isAdmin();
  const {filter} = await searchParams;

  if (isUserAdmin) return <AdminDashboard filter={filter} />;

  return <TutorDashboard />;
}
