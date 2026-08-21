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
    <nav className="mb-6 flex items-center justify-between gap-4 rounded-full border border-border bg-slate-900/80 px-2 py-2 shadow-lg backdrop-blur-xl">
      {/* <Link className="flex items-center gap-2 px-3 py-1.5 font-black tracking-tight text-foreground" href="/dashboard">
        <span className="grid h-8 w-8 place-items-center rounded-full bg-primary text-xs font-black text-primary-foreground">₫</span>
        SplitMates
      </Link> */}
      <div className="flex items-center gap-1">
        <Link
          aria-current={isActive("/dashboard") ? "page" : undefined}
          className={cn(
            "rounded-full px-4 py-2.5 text-sm font-black transition-colors",
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
            "rounded-full px-4 py-2.5 text-sm font-black transition-colors",
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
              "rounded-full px-4 py-2.5 text-sm font-black transition-colors",
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
      <div className="flex items-center gap-2">
        <span className="text-sm font-black text-foreground">{userName}</span>
        <Badge variant="secondary" className="rounded-full bg-emerald-500/10 text-emerald-400 border-0 text-xs">
          {role}
        </Badge>
        <LogoutButton />
      </div>
    </nav>
  );
}
