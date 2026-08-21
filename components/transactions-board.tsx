"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { QrCard } from "@/components/qr-card";
import { ReopenTransactionButton } from "@/components/reopen-transaction-button";
import { TransactionStatusButton } from "@/components/transaction-status-button";
import { VoidTransactionButton } from "@/components/void-transaction-button";
import { formatCurrency } from "@/lib/settlement";
import type { TransactionStatus } from "@/lib/types";

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
      <section aria-label="Bộ lọc giao dịch" className="panel transaction-filters">
        <div className="filter-grid">
          <label>Người chuyển<select onChange={(event) => setFromUserId(event.target.value)} value={fromUserId}><option value="all">Tất cả</option>{fromOptions.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}</select></label>
          <label>Người nhận<select onChange={(event) => setToUserId(event.target.value)} value={toUserId}><option value="all">Tất cả</option>{toOptions.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}</select></label>
          <label>Buổi<select onChange={(event) => setEventId(event.target.value)} value={eventId}><option value="all">Tất cả</option>{eventOptions.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}</select></label>
          <label>Trạng thái<select onChange={(event) => setStatus(event.target.value as TransactionStatus | "all")} value={status}><option value="all">Tất cả</option><option value="unpaid">Chưa chuyển</option><option value="paid">Đã chuyển</option><option value="void">Đã hủy</option></select></label>
        </div>
        <p className="filter-result">Đang hiển thị {visibleTransactions.length}/{transactions.length} giao dịch riêng theo từng buổi.</p>
      </section>

      <section className="person-board">
        {groups.length === 0 ? <div className="panel empty-state">Không có giao dịch phù hợp với bộ lọc.</div> : null}
        {groups.map((group) => {
          const referenceTotal = group.items.reduce((sum, item) => sum + item.amount, 0);
          return (
            <article className="person-block" key={group.fromUserId}>
              <header className="person-block-heading">
                <div><p className="eyebrow">Người chuyển</p><h2>{group.fromName}</h2></div>
                <div className="reference-total"><span>Tổng tham khảo</span><strong>{formatCurrency(referenceTotal)}</strong><small>Không phải một khoản tất toán</small></div>
              </header>
              <div className="transaction-card-grid">
                {group.items.map((transaction) => {
                  const description = `${transferPrefix} ${transaction.eventName} ${transaction.fromName}`;
                  const paidAudit = transaction.status === "paid" ? [formatAuditDate(transaction.paidAt), transaction.paidByName ?? transaction.paidBy].filter(Boolean).join(" · ") : "";
                  const reopenAudit = transaction.reopenedAt ? [formatAuditDate(transaction.reopenedAt), transaction.reopenedByName ?? transaction.reopenedBy].filter(Boolean).join(" · ") : "";
                  const voidAudit = transaction.status === "void" ? [formatAuditDate(transaction.voidedAt), transaction.voidedByName ?? transaction.voidedBy].filter(Boolean).join(" · ") : "";
                  return (
                    <article className={`raw-transaction-card status-card-${transaction.status}`} key={transaction.id}>
                      <div className="raw-transaction-top">
                        <span className={`status-${transaction.status}`}>{statusLabel(transaction.status)}</span>
                        <time>{transaction.eventDate ? new Intl.DateTimeFormat("vi-VN").format(new Date(transaction.eventDate)) : "Không còn dữ liệu ngày"}</time>
                      </div>
                      <div className="raw-transaction-main">
                        {transaction.eventExists ? <Link href={`/events/${transaction.eventId}`}>{transaction.eventName}</Link> : <span className="missing-event">{transaction.eventName}</span>}
                        <p><strong>{transaction.fromName}</strong><span>→</span><strong>{transaction.toName}</strong></p>
                        <b>{formatCurrency(transaction.amount)}</b>
                      </div>
                      {paidAudit ? <p className="audit-note">Xác nhận: {paidAudit}</p> : null}
                      {reopenAudit ? <p className="audit-note">Mở lại: {reopenAudit}{transaction.reopenReason ? ` · ${transaction.reopenReason}` : ""}</p> : null}
                      {transaction.status === "void" ? <div className="void-note"><strong>Lý do hủy</strong><span>{transaction.voidReason}</span>{voidAudit ? <small>{voidAudit}</small> : null}</div> : null}
                      {transaction.status !== "void" ? (
                        <div className="raw-transaction-payment">
                          <QrCard amount={transaction.amount} description={description} toUserId={transaction.toUserId} />
                          {isAdmin && transaction.status === "unpaid" ? <div className="transaction-actions"><TransactionStatusButton id={transaction.id} /><VoidTransactionButton description={`${transaction.fromName} → ${transaction.toName} của ${transaction.eventName}`} id={transaction.id} /></div> : null}
                          {isAdmin && transaction.status === "paid" ? <div className="transaction-actions"><ReopenTransactionButton description={`${transaction.fromName} → ${transaction.toName} của ${transaction.eventName}`} id={transaction.id} /></div> : null}
                        </div>
                      ) : isAdmin ? (
                        <div className="transaction-actions">
                          <ReopenTransactionButton description={`${transaction.fromName} → ${transaction.toName} của ${transaction.eventName}`} id={transaction.id} />
                        </div>
                      ) : null}
                    </article>
                  );
                })}
              </div>
            </article>
          );
        })}
      </section>
    </>
  );
}
