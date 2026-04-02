import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import DashboardClient from "./DashboardClient";

/** Página del dashboard — verifica sesión servidor y renderiza el gestor de tareas */
export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/login");
  return <DashboardClient session={session} />;
}
