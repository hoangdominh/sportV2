"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoutButton } from "./logout-button";

export function AppNav({ role, userName }: { role: "admin" | "member"; userName: string }) {
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <nav className="app-nav">
      <Link className="nav-brand" href="/dashboard">
        <span>₫</span>
        SplitMates
      </Link>
      <div className="nav-links">
        <Link aria-current={isActive("/dashboard") ? "page" : undefined} className={isActive("/dashboard") ? "active" : undefined} href="/dashboard">Dashboard</Link>
        <Link aria-current={isActive("/transactions") ? "page" : undefined} className={isActive("/transactions") ? "active" : undefined} href="/transactions">Giao dịch</Link>
        {role === "admin" ? <Link aria-current={isActive("/users") ? "page" : undefined} className={isActive("/users") ? "active" : undefined} href="/users">User</Link> : null}
      </div>
      <div className="nav-user">
        <span>{userName}</span>
        <b>{role}</b>
        <LogoutButton />
      </div>
    </nav>
  );
}
