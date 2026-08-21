import Link from "next/link";
import { ObjectId } from "mongodb";
import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";
import { AppNav } from "@/components/app-nav";
import { DeleteResourceButton } from "@/components/delete-resource-button";
import { QrCard } from "@/components/qr-card";
import { ReopenTransactionButton } from "@/components/reopen-transaction-button";
import { TransactionStatusButton } from "@/components/transaction-status-button";
import { VoidTransactionButton } from "@/components/void-transaction-button";
import { authOptions } from "@/lib/auth";
import { deriveEventStatus } from "@/lib/event-status";
import { getDb } from "@/lib/mongodb";
import { formatCurrency } from "@/lib/settlement";
import type { EventDoc, TransactionDoc } from "@/lib/types";

export default async function EventDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (!ObjectId.isValid(params.id)) notFound();

  const db = await getDb();
  const event = await db.collection<EventDoc>("events").findOne({ _id: new ObjectId(params.id) });
  if (!event) notFound();
  const transactions = await db
    .collection<TransactionDoc>("transactions")
    .find({ eventId: event._id })
    .sort({ status: -1, amount: -1 })
    .toArray();
  const bettingPool = event.participants.reduce((sum, participant) => sum + Math.max(participant.adjustmentAmount ?? 0, 0), 0);
  const voidCount = transactions.filter((transaction) => transaction.status === "void").length;
  const unpaidCount = transactions.filter((transaction) => transaction.status === "unpaid").length;
  const eventStatus = deriveEventStatus(transactions.map((transaction) => transaction.status));

  return (
    <main className="app-shell">
      <AppNav role={session.user.role} userName={session.user.name} />
      <header className="topbar">
        <div>
          <p className="eyebrow">Chi tiết buổi</p>
          <h1>{event.name}</h1>
          <span className="muted">{new Intl.DateTimeFormat("vi-VN").format(event.date)}</span>
        </div>
        <div className="topbar-actions">
          <Link className="ghost-button" href="/dashboard">
            Về dashboard
          </Link>
          {session.user.role === "admin" ? (
            <DeleteResourceButton
              confirmText={`Xoá buổi "${event.name}"? Chỉ có thể xoá khi chưa có khoản đã thanh toán; giao dịch liên quan sẽ được lưu dưới trạng thái hủy.`}
              endpoint={`/api/events/${event._id.toString()}`}
              redirectTo="/dashboard"
            />
          ) : null}
        </div>
      </header>

      <section className="hero-grid">
        <article className="metric-card accent">
          <span>Tổng chi</span>
          <strong>{formatCurrency(event.totalAmount)}</strong>
          <small>{event.participants.length} người tham gia</small>
        </article>
        <article className="metric-card">
          <span>Mỗi người chịu</span>
          <strong>{formatCurrency(event.perPersonAmount)}</strong>
          <small>Mức cơ sở; chênh lệch 1đ được phân bổ xác định</small>
        </article>
        <article className="metric-card">
          <span>Trạng thái</span>
          <strong>{eventStatus === "settled" ? "Đã xong" : eventStatus === "needs_review" ? "Cần kiểm tra" : "Còn nợ"}</strong>
          <small>{eventStatus === "needs_review" ? `${voidCount} giao dịch đã hủy` : bettingPool > 0 ? `Kèo thắng ${formatCurrency(bettingPool)}` : `${unpaidCount} giao dịch chưa chuyển`}</small>
        </article>
      </section>

      <section className="content-grid detail-grid">
        <div className="panel">
          <div className="panel-heading">
            <h2>Cân bằng từng người</h2>
          </div>
          <div className="balance-list">
            {event.participants.map((participant) => (
              <div className="balance-row" key={participant.userId.toString()}>
                <div>
                  <strong>{participant.name}</strong>
                  <span>Đã ứng {formatCurrency(participant.paidAmount)}</span>
                  <span>Phần chịu: {formatCurrency(participant.shareAmount ?? event.perPersonAmount)}</span>
                  <span>Tiền bàn: {formatSignedCurrency(participant.baseBalance ?? participant.paidAmount - (participant.shareAmount ?? event.perPersonAmount))}</span>
                  <span>Kèo: {formatSignedCurrency(participant.adjustmentAmount ?? 0)}</span>
                </div>
                <b className={participant.balance >= 0 ? "positive" : "negative"}>
                  Net {formatSignedCurrency(participant.balance)}
                </b>
              </div>
            ))}
          </div>
        </div>

        <div className="panel">
          <div className="panel-heading">
            <h2>Giao dịch của buổi</h2>
            <span>{session.user.role === "admin" ? "Có thể đổi trạng thái" : "Chỉ xem"}</span>
          </div>
          <div className="settlement-list">
            {transactions.length === 0 ? <p className="empty-state">Không phát sinh chuyển khoản.</p> : null}
            {transactions.map((transaction) => {
              const description = `${process.env.TRANSFER_PREFIX ?? "CHIA TIEN"} ${event.name} ${transaction.fromName}`;
              return (
                <article className="settlement-card" key={transaction._id.toString()}>
                  <div className="settlement-main">
                    <div>
                      <p>
                        <strong>{transaction.fromName}</strong> chuyển cho <strong>{transaction.toName}</strong>
                      </p>
                      <span>{formatCurrency(transaction.amount)}</span>
                    </div>
                    <b className={`status-${transaction.status}`}>
                      {transaction.status === "paid" ? "Đã chuyển" : transaction.status === "void" ? "Đã hủy" : "Chưa chuyển"}
                    </b>
                  </div>
                  {transaction.status === "paid" && (transaction.paidAt || transaction.paidByName || transaction.paidBy) ? (
                    <p className="audit-note">Xác nhận: {formatAudit(transaction.paidAt, transaction.paidByName ?? transaction.paidBy)}</p>
                  ) : null}
                  {transaction.reopenedAt ? (
                    <p className="audit-note">Mở lại: {formatAudit(transaction.reopenedAt, transaction.reopenedByName ?? transaction.reopenedBy)}{transaction.reopenReason ? ` · ${transaction.reopenReason}` : ""}</p>
                  ) : null}
                  {transaction.status === "void" ? (
                    <>
                      <div className="void-note">
                        <strong>Lý do hủy</strong>
                        <span>{transaction.voidReason ?? "Không có lý do"}</span>
                        {(transaction.voidedAt || transaction.voidedByName || transaction.voidedBy) ? <small>{formatAudit(transaction.voidedAt, transaction.voidedByName ?? transaction.voidedBy)}</small> : null}
                      </div>
                      {session.user.role === "admin" ? (
                        <div className="transaction-actions">
                          <ReopenTransactionButton
                            description={`${transaction.fromName} → ${transaction.toName} của ${event.name}`}
                            id={transaction._id.toString()}
                          />
                        </div>
                      ) : null}
                    </>
                  ) : (
                    <div className="settlement-actions">
                      <QrCard amount={transaction.amount} description={description} toUserId={transaction.toUserId.toString()} />
                      {session.user.role === "admin" && transaction.status === "unpaid" ? (
                      <div className="transaction-actions">
                        <TransactionStatusButton id={transaction._id.toString()} />
                        <VoidTransactionButton
                          description={`${transaction.fromName} → ${transaction.toName} của ${event.name}`}
                          id={transaction._id.toString()}
                        />
                      </div>
                      ) : null}
                      {session.user.role === "admin" && transaction.status === "paid" ? (
                        <div className="transaction-actions">
                          <ReopenTransactionButton
                            description={`${transaction.fromName} → ${transaction.toName} của ${event.name}`}
                            id={transaction._id.toString()}
                          />
                        </div>
                      ) : null}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}

function formatSignedCurrency(amount: number) {
  const sign = amount > 0 ? "+" : "";
  return `${sign}${formatCurrency(amount)}`;
}

function formatAudit(date?: Date, user?: string) {
  return [
    date ? new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" }).format(date) : null,
    user
  ].filter(Boolean).join(" · ");
}
