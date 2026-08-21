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
          const referenceTotal = group.items.reduce((sum, item) => sum + item.amount, 0);
          return (
            <Card className="overflow-hidden border-border bg-slate-900/70 shadow-xl backdrop-blur-xl" key={group.fromUserId}>
              <CardHeader className="flex flex-col gap-4 border-b border-border p-5 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-emerald-400">Người chuyển</p>
                  <h2 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">{group.fromName}</h2>
                </div>
                <div className="flex flex-col items-start gap-0.5 text-right sm:items-end">
                  <span className="text-xs font-black text-muted-foreground">Tổng tham khảo</span>
                  <strong className="text-xl font-black tracking-tight text-lime-400">{formatCurrency(referenceTotal)}</strong>
                  <small className="text-xs font-black text-muted-foreground">Không phải một khoản tất toán</small>
                </div>
              </CardHeader>
              <CardContent className="p-5">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {group.items.map((transaction) => {
                    const description = `${transferPrefix} ${transaction.eventName} ${transaction.fromName}`;
                    const paidAudit = transaction.status === "paid" ? [formatAuditDate(transaction.paidAt), transaction.paidByName ?? transaction.paidBy].filter(Boolean).join(" · ") : "";
                    const reopenAudit = transaction.reopenedAt ? [formatAuditDate(transaction.reopenedAt), transaction.reopenedByName ?? transaction.reopenedBy].filter(Boolean).join(" · ") : "";
                    const voidAudit = transaction.status === "void" ? [formatAuditDate(transaction.voidedAt), transaction.voidedByName ?? transaction.voidedBy].filter(Boolean).join(" · ") : "";
                    return (
                      <Card
                        className={cn(
                          "border-border bg-white/[0.03] transition-colors",
                          transaction.status === "void" && "bg-white/[0.015] opacity-75"
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
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </section>
    </>
  );
}
