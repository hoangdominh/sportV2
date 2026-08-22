import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { AppNav } from "@/components/app-nav";
import { authOptions } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";
import type { UserDoc } from "@/lib/types";
import { CreateUserForm } from "./user-form";
import { DeleteUserButton } from "./delete-user-button";
import { getBankName } from "@/lib/banks";
import { UserBankForm } from "./user-bank-form";

export default async function UsersPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role !== "admin") redirect("/dashboard");

  const db = await getDb();
  const users = await db
    .collection<UserDoc>("users")
    .find({}, { projection: { passwordHash: 0 } })
    .sort({ role: 1, name: 1 })
    .toArray();

  return (
    <main className="app-shell">
      <AppNav role={session.user.role} userName={session.user.name} />
      <header className="topbar">
        <div>
          <p className="eyebrow">Quản trị</p>
          <h1>Quản lý user</h1>
        </div>
      </header>

      <section className="content-grid users-grid">
        <CreateUserForm />
        <div className="panel">
          <div className="panel-heading">
            <h2>Danh sách tài khoản</h2>
            <span>{users.length} user</span>
          </div>
          <div className="user-list">
            {users.map((user) => (
              <div className="user-row rich-user-row" key={user._id.toString()}>
                <div className="user-main-info">
                  <strong>{user.name}</strong>
                  <span>@{user.username} · {user.role}</span>
                  <span>QR: {user.bankAccountNo ? `${getBankName(user.bankBin)} · ${user.bankAccountNo}` : "Chưa khai báo"}</span>
                </div>
                <UserBankForm
                  bankAccountName={user.bankAccountName}
                  bankAccountNo={user.bankAccountNo}
                  bankBin={user.bankBin}
                  role={user.role}
                  userId={user._id.toString()}
                >
                  {session.user.id !== user._id.toString() ? (
                    <DeleteUserButton id={user._id.toString()} name={user.name} />
                  ) : (
                    <span className="muted self-center text-sm font-black">Đang đăng nhập</span>
                  )}
                </UserBankForm>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
