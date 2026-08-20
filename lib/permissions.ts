import { getServerSession } from "next-auth";
import { authOptions } from "./auth";

export async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session) throw new Response("Unauthorized", { status: 401 });
  return session;
}

export async function requireAdmin() {
  const session = await requireSession();
  if (session.user.role !== "admin") throw new Response("Forbidden", { status: 403 });
  return session;
}
