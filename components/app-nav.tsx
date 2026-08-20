import Link from "next/link";
import { LogoutButton } from "./logout-button";

export function AppNav({ role, userName }: { role: "admin" | "member"; userName: string }) {
  return (
    <nav className="app-nav">
      <Link className="nav-brand" href="/dashboard">
        <span>₫</span>
        SplitMates
      </Link>
      <div className="nav-links">
        <Link href="/dashboard">Dashboard</Link>
        <Link href="/transactions">Giao dịch</Link>
        {role === "admin" ? <Link href="/users">User</Link> : null}
      </div>
      <div className="nav-user">
        <span>{userName}</span>
        <b>{role}</b>
        <LogoutButton />
      </div>
    </nav>
  );
}
