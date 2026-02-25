import { isAdmin} from "@/actions/admin-actions";
import {AdminDashboard} from "@/app/(protected)/dashboard/_components/admin-dashboard";
import {TutorDashboard} from "@/app/(protected)/dashboard/_components/tutor-dashboard";


export default async function DashboardPage() {
  const isUserAdmin = await isAdmin();

  if (isUserAdmin) {return <AdminDashboard />}

  return <TutorDashboard />
}
