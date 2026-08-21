"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
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

interface FilterOption {
  id: string;
  name: string;
}

function uniqueOptions(items: TransactionBoardItem[], idKey: "fromUserId" | "toUserId", nameKey: "fromName" | "toName") {
  return [...new Map(items.map((item) => [item[idKey], { id: item[idKey], name: item[nameKey] }])).values()].sort(
    (a, b) => a.name.localeCompare(b.name, "vi")
  );
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
  transferPrefix
}: {
  transactions: TransactionBoardItem[];
  isAdmin: boolean;
  transferPrefix: string;
}) {
  const [fromUserId, setFromUserId] = useState("all");
  const [toUserId, setToUserId] = useState("all");
  const [eventId, setEventId] = useState("all");
  const [status, setStatus] = useState<TransactionStatus | "all">("all");

  const fromOptions = useMemo(() => uniqueOptions(transactions, "fromUserId", "fromName"), [transactions]);
  const toOptions = useMemo(() => uniqueOptions(transactions, "toUserId", "toName"), [transactions]);
  const eventOptions = useMemo<FilterOption[]>(
    () =>
      [...new Map(transactions.map((item) => [item.eventId, { id: item.eventId, name: item.eventName }])).values()].sort(
        (a, b) => a.name.localeCompare(b.name, "vi")
      ),
    [transactions]
  );

  const visibleTransactions = useMemo(
    () =>
      transactions.filter(
        (transaction) =>
          (fromUserId === "all" || transaction.fromUserId === fromUserId) &&
          (toUserId === "all" || transaction.toUserId === toUserId) &&
          (eventId === "all" || transaction.eventId === eventId) &&
          (status === "all" || transaction.status === status)
      ),
    [eventId, fromUserId, status, toUserId, transactions]
  );

  const groups = useMemo(() => {
    const grouped = new Map<string, { fromUserId: string; fromName: string; items: TransactionBoardItem[] }>();
    for (const transaction of visibleTransactions) {
      const current = grouped.get(transaction.fromUserId);
      if (current) current.items.push(transaction);
      else grouped.set(transaction.fromUserId, { fromUserId: transaction.fromUserId, fromName: transaction.fromName, items: [transaction] });
    }
    return [...grouped.values()].sort((a, b) => a.fromName.localeCompare(b.fromName, "vi"));
  }, [visibleTransactions]);

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
                {transaction.eventName}
              </Link>
            ) : (
              <span className="text-sm font-black text-blue-400">{transaction.eventName}</span>
            )}
            <p className="flex items-center gap-2 text-sm">
              <strong className="font-bold">{transaction.fromName}</strong>
              <span className="text-emerald-400">→</span>
              <strong className="font-bold">{transaction.toName}</strong>
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
                    <TransactionStatusButton id={transaction.id} />
                    <VoidTransactionButton description={`${transaction.fromName} → ${transaction.toName} của ${transaction.eventName}`} id={transaction.id} />
                  </div>
                ) : null}
                {isAdmin && transaction.status === "paid" ? (
                  <div className="flex flex-wrap gap-2">
                    <ReopenTransactionButton description={`${transaction.fromName} → ${transaction.toName} của ${transaction.eventName}`} id={transaction.id} />
                  </div>
                ) : null}
              </div>
            </>
          ) : isAdmin ? (
            <div className="flex flex-wrap gap-2">
              <ReopenTransactionButton description={`${transaction.fromName} → ${transaction.toName} của ${transaction.eventName}`} id={transaction.id} />
            </div>
          ) : null}
        </CardContent>
      </Card>
    );
  };

  return (
    <>
      <Card className="mb-5 border-border bg-slate-900/60 backdrop-blur-xl">
        <CardContent className="p-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1.5">
              <label className="text-xs font-black text-muted-foreground">Người chuyển</label>
              <Select value={fromUserId} onValueChange={setFromUserId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  {fromOptions.map((option) => <SelectItem key={option.id} value={option.id}>{option.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-black text-muted-foreground">Người nhận</label>
              <Select value={toUserId} onValueChange={setToUserId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  {toOptions.map((option) => <SelectItem key={option.id} value={option.id}>{option.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-black text-muted-foreground">Buổi</label>
              <Select value={eventId} onValueChange={setEventId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  {eventOptions.map((option) => <SelectItem key={option.id} value={option.id}>{option.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-black text-muted-foreground">Trạng thái</label>
              <Select value={status} onValueChange={(v) => setStatus(v as TransactionStatus | "all")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="unpaid">Chưa chuyển</SelectItem>
                  <SelectItem value="paid">Đã chuyển</SelectItem>
                  <SelectItem value="void">Đã hủy</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <p className="mt-3 text-xs font-black text-muted-foreground">
            Đang hiển thị {visibleTransactions.length}/{transactions.length} giao dịch riêng theo từng buổi.
          </p>
        </CardContent>
      </Card>

      <section className="space-y-5">
        {groups.length === 0 ? (
          <Card className="border-border bg-slate-900/60 backdrop-blur-xl">
            <CardContent className="p-6 text-center text-muted-foreground">
              Không có giao dịch phù hợp với bộ lọc.
            </CardContent>
          </Card>
        ) : null}
        {groups.map((group) => {
          const unpaidItems = group.items.filter((item) => item.status === "unpaid");
          const paidItems = group.items.filter((item) => item.status === "paid");
          const voidItems = group.items.filter((item) => item.status === "void");
          const unpaidTotal = unpaidItems.reduce((sum, item) => sum + item.amount, 0);
          const paidTotal = paidItems.reduce((sum, item) => sum + item.amount, 0);
          const referenceTotal = group.items.reduce((sum, item) => sum + item.amount, 0);
          const showUnpaid = status === "all" || status === "unpaid";
          const showPaid = status === "all" || status === "paid";
          const showVoid = status === "all" || status === "void";

          return (
            <Card className="overflow-hidden border-border bg-slate-900/70 shadow-xl backdrop-blur-xl" key={group.fromUserId}>
              <CardHeader className="flex flex-col gap-4 border-b border-border p-5 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-emerald-400">Người chuyển</p>
                  <h2 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">{group.fromName}</h2>
                </div>
                <div className="grid grid-cols-2 gap-3 text-left sm:min-w-[360px]">
                  <div className="rounded-xl border border-orange-400/20 bg-orange-500/10 p-3">
                    <span className="text-xs font-black uppercase tracking-widest text-orange-300">Cần chuyển</span>
                    <strong className="mt-1 block text-lg font-black tracking-tight text-orange-300">{formatCurrency(unpaidTotal)}</strong>
                    <small className="text-xs font-bold text-muted-foreground">{unpaidItems.length} giao dịch</small>
                  </div>
                  <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-3">
                    <span className="text-xs font-black uppercase tracking-widest text-emerald-300">Đã chuyển</span>
                    <strong className="mt-1 block text-lg font-black tracking-tight text-emerald-300">{formatCurrency(paidTotal)}</strong>
                    <small className="text-xs font-bold text-muted-foreground">{paidItems.length} giao dịch</small>
                  </div>
                  <p className="col-span-2 text-right text-xs font-black text-muted-foreground">Tổng tham khảo: {formatCurrency(referenceTotal)}</p>
                </div>
              </CardHeader>
              <CardContent className="space-y-5 p-5">
                <div className={cn("grid gap-5", status === "all" && "xl:grid-cols-[minmax(0,1.08fr)_minmax(320px,0.92fr)]")}>
                  {showUnpaid ? (
                    <section className="rounded-2xl border border-orange-400/20 bg-orange-500/[0.035] p-4">
                      <div className="mb-4 flex items-end justify-between gap-3">
                        <div>
                          <p className="text-xs font-black uppercase tracking-widest text-orange-300">Chưa chuyển</p>
                          <h3 className="text-lg font-black">Khoản cần xử lý</h3>
                        </div>
                        <Badge variant="unpaid">{unpaidItems.length}</Badge>
                      </div>
                      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                        {unpaidItems.length > 0 ? unpaidItems.map(renderTransactionCard) : <p className="empty-state">Không có khoản chưa chuyển.</p>}
                      </div>
                    </section>
                  ) : null}

                  {showPaid ? (
                    <section className="rounded-2xl border border-emerald-400/15 bg-emerald-500/[0.025] p-4">
                      <div className="mb-4 flex items-end justify-between gap-3">
                        <div>
                          <p className="text-xs font-black uppercase tracking-widest text-emerald-300">Đã chuyển</p>
                          <h3 className="text-lg font-black text-muted-foreground">Lưu vết xác nhận</h3>
                        </div>
                        <Badge variant="paid">{paidItems.length}</Badge>
                      </div>
                      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                        {paidItems.length > 0 ? paidItems.map(renderTransactionCard) : <p className="empty-state">Chưa có khoản đã chuyển.</p>}
                      </div>
                    </section>
                  ) : null}
                </div>

                {showVoid && voidItems.length > 0 ? (
                  <section className="rounded-2xl border border-slate-500/20 bg-white/[0.015] p-4">
                    <div className="mb-4 flex items-end justify-between gap-3">
                      <div>
                        <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Đã hủy</p>
                        <h3 className="text-lg font-black text-muted-foreground">Không tính vào thanh toán</h3>
                      </div>
                      <Badge variant="void">{voidItems.length}</Badge>
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                      {voidItems.map(renderTransactionCard)}
                    </div>
                  </section>
                ) : null}
              </CardContent>
            </Card>
          );
        })}
      </section>
    </>
  );
}
