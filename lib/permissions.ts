import { getServerSession } from "next-auth";
import { ObjectId } from "mongodb";
import { authOptions } from "./auth";
import { getDb } from "./mongodb";
import type { UserDoc } from "./types";

export async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session) throw new Response("Unauthorized", { status: 401 });
  return session;
}

export async function requireAdmin() {
  const session = await requireSession();
  if (!ObjectId.isValid(session.user.id)) throw new Response("Forbidden", { status: 403 });

  const db = await getDb();
  const admin = await db.collection<UserDoc>("users").findOne({
    _id: new ObjectId(session.user.id),
    role: "admin"
  });
  if (!admin) throw new Response("Forbidden", { status: 403 });

  return {
    ...session,
    user: {
      id: admin._id.toString(),
      name: admin.name,
      username: admin.username,
      role: "admin" as const
    }
  };
}
