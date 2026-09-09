"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { MemberAvatar, ParticipantAvatars, type AvatarParticipant } from "@/components/member-avatar";
import { ActivityIcon } from "@/components/activity-icon";
import { useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { ActivityType } from "@/lib/activity";
import { transactionsHref, TRANSACTIONS_PAGE_SIZE, type TransactionFilters, type TransactionFilterOptions, type TransactionCounts } from "@/lib/transaction-filters";
import { QrCard } from "@/components/qr-card";
import { ReopenTransactionButton } from "@/components/reopen-transaction-button";
import { TransactionStatusButton } from "@/components/transaction-status-button";
import { VoidTransactionButton } from "@/components/void-transaction-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/settlement";
import type { TransactionStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

export interface TransactionBoardItem {
  id: string;
  eventId: string;
  eventName: string;
  eventDate: string | null;
  eventExists: boolean;
  activityType: ActivityType;
  participants: AvatarParticipant[];
  fromUserId: string;
  fromName: string;
  toUserId: string;
  toName: string;
  amount: number;
  status: TransactionStatus;
  paidAt?: string;
  paidBy?: string;
  paidByName?: string;
  reopenedAt?: string;
  reopenedBy?: string;
  reopenedByName?: string;
  reopenReason?: string;
  voidedAt?: string;
  voidedBy?: string;
  voidedByName?: string;
  voidReason?: string;
}

function statusLabel(status: TransactionStatus) {
  if (status === "paid") return "Đã chuyển";
  if (status === "void") return "Đã hủy";
  return "Chưa chuyển";
}

function statusVariant(status: TransactionStatus): "paid" | "unpaid" | "void" {
  if (status === "paid") return "paid";
  if (status === "void") return "void";
  return "unpaid";
}

function formatAuditDate(value?: string) {
  if (!value) return null;
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}

export function TransactionsBoard({
  transactions,
  isAdmin,
  transferPrefix,
  filters,
  options,
  counts,
  total
}: {
  transactions: TransactionBoardItem[];
  isAdmin: boolean;
  transferPrefix: string;
  filters: TransactionFilters;
  options: TransactionFilterOptions;
  counts: TransactionCounts;
  total: number;
  totalAmount: number;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const pageCount = Math.max(1, Math.ceil(total / TRANSACTIONS_PAGE_SIZE));
  const changeFilter = (key: "from" | "to" | "event" | "status", value: string) => {
    if (key === "status" && !["all", "unpaid", "paid", "void"].includes(value)) return;
    startTransition(() => router.push(transactionsHref({ ...filters, [key]: value, page: 1 })));
  };
  const refreshTransactions = () => startTransition(() => router.refresh());

  const groups = useMemo(() => {
    const grouped = new Map<string, { fromUserId: string; fromName: string; items: TransactionBoardItem[] }>();
    for (const transaction of transactions) {
      const current = grouped.get(transaction.fromUserId);
      if (current) current.items.push(transaction);
      else grouped.set(transaction.fromUserId, { fromUserId: transaction.fromUserId, fromName: transaction.fromName, items: [transaction] });
    }
    return [...grouped.values()].sort((a, b) => a.fromName.localeCompare(b.fromName, "vi") || a.fromUserId.localeCompare(b.fromUserId));
  }, [transactions]);

  const renderTransactionCard = (transaction: TransactionBoardItem) => {
    const description = `${transferPrefix} ${transaction.eventName} ${transaction.fromName}`;
    const paidAudit = transaction.status === "paid" ? [formatAuditDate(transaction.paidAt), transaction.paidByName ?? transaction.paidBy].filter(Boolean).join(" · ") : "";
    const reopenAudit = transaction.reopenedAt ? [formatAuditDate(transaction.reopenedAt), transaction.reopenedByName ?? transaction.reopenedBy].filter(Boolean).join(" · ") : "";
    const voidAudit = transaction.status === "void" ? [formatAuditDate(transaction.voidedAt), transaction.voidedByName ?? transaction.voidedBy].filter(Boolean).join(" · ") : "";

    return (
      <Card
        className={cn(
          "border-border bg-white/[0.03] transition-all",
          transaction.status === "unpaid" && "border-orange-400/25 bg-orange-500/[0.035] shadow-[0_18px_50px_-28px_rgba(251,146,60,0.65)]",
          transaction.status === "paid" && "border-emerald-400/15 bg-emerald-500/[0.025] opacity-70 hover:opacity-100",
          transaction.status === "void" && "bg-white/[0.015] opacity-60"
        )}
        key={transaction.id}
      >
        <CardContent className="flex flex-col gap-3.5 p-4">
          <div className="flex items-center justify-between gap-3">
            <Badge variant={statusVariant(transaction.status)}>{statusLabel(transaction.status)}</Badge>
            <time className="text-right text-xs font-black text-muted-foreground">
              {transaction.eventDate ? new Intl.DateTimeFormat("vi-VN").format(new Date(transaction.eventDate)) : "Không còn dữ liệu ngày"}
            </time>
          </div>
          <div className="flex flex-col gap-2">
            {transaction.eventExists ? (
              <Link className="text-sm font-black text-blue-400 hover:underline" href={`/events/${transaction.eventId}`}>
                <ActivityIcon activityType={transaction.activityType} />
                {transaction.eventName}
              </Link>
            ) : (
              <span className="text-sm font-black text-blue-400"><ActivityIcon activityType={transaction.activityType} />{transaction.eventName}</span>
            )}
            <ParticipantAvatars participants={transaction.participants} />
            <p className="flex flex-wrap items-center gap-2 text-sm">
              <span className="inline-flex min-w-0 items-center gap-2"><MemberAvatar userId={transaction.fromUserId} name={transaction.fromName} /><strong className="break-words font-bold">{transaction.fromName}</strong></span>
              <span className="text-emerald-400">→</span>
              <span className="inline-flex min-w-0 items-center gap-2"><MemberAvatar userId={transaction.toUserId} name={transaction.toName} /><strong className="break-words font-bold">{transaction.toName}</strong></span>
            </p>
            <b className="text-xl font-black tracking-tight sm:text-2xl">{formatCurrency(transaction.amount)}</b>
          </div>
          {paidAudit ? <p className="text-xs font-black text-muted-foreground">Xác nhận: {paidAudit}</p> : null}
          {reopenAudit ? <p className="text-xs font-black text-muted-foreground">Mở lại: {reopenAudit}{transaction.reopenReason ? ` · ${transaction.reopenReason}` : ""}</p> : null}
          {transaction.status === "void" ? (
            <div className="rounded-lg border-l-[3px] border-muted-foreground/50 bg-white/[0.02] p-3 text-sm leading-relaxed text-muted-foreground">
              <strong className="text-foreground">Lý do hủy</strong>
              <p className="mt-1">{transaction.voidReason}</p>
              {voidAudit ? <small className="mt-1 block text-xs font-black text-muted-foreground/60">{voidAudit}</small> : null}
            </div>
          ) : null}
          {transaction.status !== "void" ? (
            <>
              <Separator />
              <div className="flex flex-col gap-3">
                <QrCard amount={transaction.amount} description={description} toUserId={transaction.toUserId} />
                {isAdmin && transaction.status === "unpaid" ? (
                  <div className="flex flex-wrap gap-2">
                    <TransactionStatusButton id={transaction.id} onConfirmed={refreshTransactions} />
                    <VoidTransactionButton
                      description={`${transaction.fromName} → ${transaction.toName} của ${transaction.eventName}`}
                      id={transaction.id}
                      onVoided={refreshTransactions}
                    />
                  </div>
                ) : null}
                {isAdmin && transaction.status === "paid" ? (
                  <div className="flex flex-wrap gap-2">
                    <ReopenTransactionButton
                      description={`${transaction.fromName} → ${transaction.toName} của ${transaction.eventName}`}
                      id={transaction.id}
                      onReopened={refreshTransactions}
                    />
                  </div>
                ) : null}
              </div>
            </>
          ) : isAdmin ? (
            <div className="flex flex-wrap gap-2">
              <ReopenTransactionButton
                description={`${transaction.fromName} → ${transaction.toName} của ${transaction.eventName}`}
                id={transaction.id}
                onReopened={refreshTransactions}
              />
            </div>
          ) : null}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="transactions-board-type" aria-busy={isPending}>
      <Card className="mb-5 border-border bg-slate-900/60 backdrop-blur-xl">
        <CardContent className="p-5">
          <fieldset disabled={isPending} className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {([
              { key: "from", label: "Người chuyển" },
              { key: "to", label: "Người nhận" },
              { key: "event", label: "Buổi" }
            ] as const).map(({ key, label }) => (
              <div className="space-y-1.5" key={key}>
                <label htmlFor={`filter-${key}`} className="text-xs font-black text-muted-foreground">{label}</label>
                <Select disabled={isPending} value={filters[key]} onValueChange={(value) => changeFilter(key, value)}>
                  <SelectTrigger id={`filter-${key}`}><SelectValue /></SelectTrigger>
                  <SelectContent className="transactions-select-type">
                    <SelectItem value="all">Tất cả</SelectItem>
                    {options[key].map((option) => <SelectItem key={option.id} value={option.id}>{option.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            ))}
            <div className="space-y-1.5">
              <label htmlFor="filter-status" className="text-xs font-black text-muted-foreground">Trạng thái</label>
              <Select disabled={isPending} value={filters.status} onValueChange={(value) => changeFilter("status", value)}>
                <SelectTrigger id="filter-status"><SelectValue /></SelectTrigger>
                <SelectContent className="transactions-select-type">
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="unpaid">Chưa chuyển</SelectItem>
                  <SelectItem value="paid">Đã chuyển</SelectItem>
                  <SelectItem value="void">Đã hủy</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </fieldset>
          <div className="mt-4 flex flex-wrap gap-1 rounded-lg bg-[#151b2e] p-1" role="group" aria-label="Lọc nhanh trạng thái giao dịch">
            {([
              { value: "all", label: "Tất cả", count: counts.unpaid + counts.paid + counts.void },
              { value: "unpaid", label: "Chưa chuyển", count: counts.unpaid },
              { value: "paid", label: "Đã chuyển", count: counts.paid },
              { value: "void", label: "Đã hủy", count: counts.void }
            ] as const).map((tab) => (
              <button
                key={tab.value}
                type="button"
                disabled={isPending}
                aria-pressed={filters.status === tab.value}
                onClick={() => changeFilter("status", tab.value)}
                className={cn("min-h-9 rounded-lg px-4 text-sm font-black text-[#8a93a6] transition-colors hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-400 disabled:opacity-50", filters.status === tab.value && "bg-emerald-500/15 text-emerald-200")}
              >
                {tab.label} <span className="text-xs font-bold opacity-70">({tab.count})</span>
              </button>
            ))}
          </div>
          <span role="status" className="sr-only">{isPending ? "Đang cập nhật…" : ""}</span>
        </CardContent>
      </Card>
      <fieldset disabled={isPending} className="min-w-0 space-y-5" aria-label="Giao dịch trên trang này">
        {groups.length === 0 ? (
          <Card className="border-border bg-slate-900/60 backdrop-blur-xl">
            <CardContent className="p-6 text-center text-muted-foreground">
              <p>Không có giao dịch phù hợp với bộ lọc.</p>
              <Link className="mt-3 inline-block text-emerald-400 hover:underline" href="/transactions?status=all">Xem tất cả giao dịch</Link>
            </CardContent>
          </Card>
        ) : null}
        {groups.map((group) => (
          <Card className="overflow-hidden border-border bg-slate-900/70 shadow-xl backdrop-blur-xl" key={group.fromUserId}>
            <CardHeader className="border-b border-border p-5">
              <p className="text-xs font-black uppercase tracking-widest text-emerald-400">Người chuyển · {group.items.length} khoản trên trang này</p>
              <h2 className="mt-1 flex items-center gap-3 text-2xl font-black tracking-tight sm:text-3xl"><MemberAvatar userId={group.fromUserId} name={group.fromName} />{group.fromName}</h2>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 p-5 lg:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
              {group.items.map(renderTransactionCard)}
            </CardContent>
          </Card>
        ))}
      </fieldset>
      <nav aria-label="Phân trang giao dịch" className="mt-6 grid grid-cols-2 items-center gap-3 rounded-2xl border border-emerald-300/20 bg-slate-900 p-4 sm:grid-cols-[auto_1fr_auto] sm:p-5">
        <button type="button" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-emerald-300/50 bg-emerald-300/15 px-5 text-emerald-100 transition-colors enabled:hover:bg-emerald-300/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/5 disabled:text-slate-500 motion-reduce:transition-none" disabled={isPending || filters.page <= 1} onClick={() => startTransition(() => router.push(transactionsHref({ ...filters, page: filters.page - 1 })))}><ArrowLeft size={18} aria-hidden="true" />Trang trước</button>
        <span className="col-span-2 row-start-1 text-center text-sm text-slate-300 sm:col-span-1 sm:col-start-2 sm:row-start-auto">Trang <strong className="text-emerald-200">{filters.page}</strong> / {pageCount}<span className="mt-1 block text-xs text-slate-400">{TRANSACTIONS_PAGE_SIZE} giao dịch mỗi trang</span></span>
        <button type="button" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-emerald-300 bg-emerald-300 px-5 text-slate-950 transition-colors enabled:hover:bg-emerald-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/5 disabled:text-slate-500 motion-reduce:transition-none" disabled={isPending || filters.page >= pageCount} onClick={() => startTransition(() => router.push(transactionsHref({ ...filters, page: filters.page + 1 })))}>Trang sau<ArrowRight size={18} aria-hidden="true" /></button>
      </nav>
    </div>
  );
}
