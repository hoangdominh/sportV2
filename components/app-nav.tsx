"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MemberAvatar } from "./member-avatar";
import { LogoutButton } from "./logout-button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function AppNav({ role, userName, userId }: { role: "admin" | "member"; userName: string; userId: string }) {
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <nav aria-label="Điều hướng chính" className="site-nav">
      <Link className="site-brand" href="/dashboard" aria-label="Sổ Sân, về tổng quan">
        <span className="site-brand-mark" aria-hidden="true">S</span>
        <span><strong>SỔ SÂN</strong><small>QUỸ ĐỘI · MÙA NÀY</small></span>
      </Link>
      <div className="site-nav-links">
        <Link
          aria-current={isActive("/dashboard") ? "page" : undefined}
          className={cn("site-nav-link", isActive("/dashboard") && "active")}
          href="/dashboard"
          prefetch={true}
        >
          Tổng quan
        </Link>
        <Link
          aria-current={isActive("/transactions") ? "page" : undefined}
          className={cn("site-nav-link", isActive("/transactions") && "active")}
          href="/transactions"
          prefetch={true}
        >
          Khoản chuyển
        </Link>
        {role === "admin" ? (
          <Link
            aria-current={isActive("/users") ? "page" : undefined}
            className={cn("site-nav-link", isActive("/users") && "active")}
            href="/users"
            prefetch={true}
          >
            Thành viên
          </Link>
        ) : null}
      </div>
      <div className="site-nav-account">
        <span className="site-nav-user"><MemberAvatar userId={userId} name={userName} /><span className="truncate">{userName}</span></span>
        <Badge variant="secondary" className="site-role-badge">
          {role === "admin" ? "Quản lý" : "Thành viên"}
        </Badge>
        <LogoutButton />
      </div>
    </nav>
  );
}
