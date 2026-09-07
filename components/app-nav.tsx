"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoutButton } from "./logout-button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function AppNav({ role, userName }: { role: "admin" | "member"; userName: string }) {
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <nav className="mb-5 flex flex-col gap-3 rounded-3xl border border-border bg-slate-900/80 px-2 py-2 shadow-lg backdrop-blur-xl sm:mb-6 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:rounded-full">
      {/* <Link className="flex items-center gap-2 px-3 py-1.5 font-black tracking-tight text-foreground" href="/dashboard">
        <span className="grid h-8 w-8 place-items-center rounded-full bg-primary text-xs font-black text-primary-foreground">₫</span>
        SplitMates
      </Link> */}
      <div className="flex w-full items-center gap-1 overflow-x-auto pb-1 sm:w-auto sm:overflow-visible sm:pb-0">
        <Link
          aria-current={isActive("/dashboard") ? "page" : undefined}
          className={cn(
            "shrink-0 rounded-full px-3 py-2.5 text-sm font-black transition-colors sm:px-4",
            isActive("/dashboard")
              ? "bg-emerald-500/15 text-emerald-400"
              : "text-muted-foreground hover:bg-emerald-500/10 hover:text-emerald-400"
          )}
          href="/dashboard"
        >
          Dashboard
        </Link>
        <Link
          aria-current={isActive("/transactions") ? "page" : undefined}
          className={cn(
            "shrink-0 rounded-full px-3 py-2.5 text-sm font-black transition-colors sm:px-4",
            isActive("/transactions")
              ? "bg-emerald-500/15 text-emerald-400"
              : "text-muted-foreground hover:bg-emerald-500/10 hover:text-emerald-400"
          )}
          href="/transactions"
        >
          Giao dịch
        </Link>
        {role === "admin" ? (
          <Link
            aria-current={isActive("/users") ? "page" : undefined}
            className={cn(
              "shrink-0 rounded-full px-3 py-2.5 text-sm font-black transition-colors sm:px-4",
              isActive("/users")
                ? "bg-emerald-500/15 text-emerald-400"
                : "text-muted-foreground hover:bg-emerald-500/10 hover:text-emerald-400"
            )}
            href="/users"
          >
            User
          </Link>
        ) : null}
      </div>
      <div className="flex w-full flex-wrap items-center justify-between gap-2 sm:w-auto sm:flex-nowrap sm:justify-end">
        <span className="min-w-0 truncate text-sm font-black text-foreground">{userName}</span>
        <Badge variant="secondary" className="rounded-full bg-emerald-500/10 text-emerald-400 border-0 text-xs">
          {role}
        </Badge>
        <LogoutButton />
      </div>
    </nav>
  );
}
