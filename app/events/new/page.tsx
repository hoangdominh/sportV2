import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { AppNav } from "@/components/app-nav";
import { authOptions } from "@/lib/auth";
import { NewEventForm } from "./new-event-form";

export default async function NewEventPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role !== "admin") redirect("/dashboard");

  return (
    <main className="app-shell narrow">
      <AppNav role={session.user.role} userName={session.user.name} />
      <NewEventForm />
    </main>
  );
}
