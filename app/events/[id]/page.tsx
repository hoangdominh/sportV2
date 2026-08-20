import Link from "next/link";
import { ObjectId } from "mongodb";
import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";
import { AppNav } from "@/components/app-nav";
import { DeleteResourceButton } from "@/components/delete-resource-button";
import { QrCard } from "@/components/qr-card";
import { TransactionStatusButton } from "@/components/transaction-status-button";
import { authOptions } from "@/lib/auth";
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
              confirmText={`Xoá buổi "${event.name}"? Tất cả giao dịch liên quan cũng sẽ bị xoá.`}
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
          <small>Chia đều theo đầu người</small>
        </article>
        <article className="metric-card">
          <span>Trạng thái</span>
          <strong>{event.status === "settled" ? "Đã xong" : "Còn nợ"}</strong>
          <small>{bettingPool > 0 ? `Kèo thắng ${formatCurrency(bettingPool)}` : `${transactions.filter((transaction) => transaction.status === "unpaid").length} giao dịch chưa chuyển`}</small>
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
                  <span>Tiền bàn: {formatSignedCurrency(participant.baseBalance ?? participant.paidAmount - event.perPersonAmount)}</span>
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
            <h2>Settlement tối ưu</h2>
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
                    <b className={transaction.status === "paid" ? "status-paid" : "status-unpaid"}>
                      {transaction.status === "paid" ? "Đã chuyển" : "Chưa chuyển"}
                    </b>
                  </div>
                  <div className="settlement-actions">
                    <QrCard amount={transaction.amount} description={description} toUserId={transaction.toUserId.toString()} />
                    {session.user.role === "admin" ? (
                      <div className="transaction-actions">
                        <TransactionStatusButton id={transaction._id.toString()} status={transaction.status} />
                        <DeleteResourceButton
                          confirmText={`Xoá giao dịch ${transaction.fromName} chuyển cho ${transaction.toName}?`}
                          endpoint={`/api/transactions/${transaction._id.toString()}`}
                        />
                      </div>
                    ) : null}
                  </div>
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
