import { ObjectId } from "mongodb";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { AppNav } from "@/components/app-nav";
import { BulkTransactionStatusButton } from "@/components/bulk-transaction-status-button";
import { DeleteResourceButton } from "@/components/delete-resource-button";
import { TransactionStatusButton } from "@/components/transaction-status-button";
import { QrCard } from "@/components/qr-card";
import { authOptions } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";
import { formatCurrency } from "@/lib/settlement";
import { aggregateTransactions } from "@/lib/aggregate-transactions";
import type { EventDoc, TransactionDoc } from "@/lib/types";

export default async function TransactionsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const db = await getDb();
  const transactions = await db.collection<TransactionDoc>("transactions").find({}).sort({ status: -1, createdAt: -1 }).toArray();
  const eventIds = [...new Set(transactions.map((transaction) => transaction.eventId.toString()))].map((id) => new ObjectId(id));
  const events = eventIds.length > 0 ? await db.collection<EventDoc>("events").find({ _id: { $in: eventIds } }).toArray() : [];
  const eventMap = new Map(events.map((event) => [event._id.toString(), event]));
  const unpaidGroups = aggregateTransactions(transactions, events, "unpaid");

  return (
    <main className="app-shell">
      <AppNav role={session.user.role} userName={session.user.name} />
      <header className="topbar">
        <div>
          <p className="eyebrow">Giao dịch</p>
          <h1>Theo dõi thanh toán</h1>
        </div>
        {session.user.role === "admin" ? (
          <Link className="primary-button" href="/events/new">
            Tạo buổi mới
          </Link>
        ) : null}
      </header>

      <section className="transactions-layout">
        <div className="panel payment-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Tổng hợp</p>
              <h2>Khoản cần chuyển</h2>
            </div>
            <span>{unpaidGroups.length} khoản gộp</span>
          </div>
          <div className="aggregate-list">
            {unpaidGroups.length === 0 ? <p className="empty-state">Không còn khoản nào cần thanh toán.</p> : null}
            {unpaidGroups.map((group) => (
              <article className="aggregate-card" key={group.key}>
                <div className="aggregate-main">
                  <div>
                    <p>
                      <strong>{group.fromName}</strong> chuyển cho <strong>{group.toName}</strong>
                    </p>
                    <span>{group.items.length} giao dịch con</span>
                  </div>
                  <strong className="aggregate-amount">{formatCurrency(group.totalAmount)}</strong>
                </div>
                <div className="aggregate-details">
                  {group.items.map((item) => (
                    <Link href={`/events/${item.eventId}`} key={item.id}>
                      <span>{item.eventName}</span>
                      <b>{formatCurrency(item.amount)}</b>
                    </Link>
                  ))}
                </div>
                <div className="aggregate-actions">
                  <QrCard amount={group.totalAmount} description={`CHIA TIEN ${group.fromName} ${group.toName}`} toUserId={group.toUserId} />
                  {session.user.role === "admin" ? (
                    <BulkTransactionStatusButton
                      fromName={group.fromName}
                      fromUserId={group.fromUserId}
                      toName={group.toName}
                      toUserId={group.toUserId}
                    />
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Chi tiết</p>
              <h2>Tất cả giao dịch con</h2>
            </div>
            <span>{transactions.length} giao dịch</span>
          </div>
          <div className="transaction-table">
            {transactions.length === 0 ? <p className="empty-state">Chưa có giao dịch nào.</p> : null}
            {transactions.map((transaction) => {
              const event = eventMap.get(transaction.eventId.toString());
              return (
                <div className="transaction-row" key={transaction._id.toString()}>
                  <div>
                    <strong>
                      {transaction.fromName} → {transaction.toName}
                    </strong>
                    {event ? <Link href={`/events/${event._id.toString()}`}>{event.name}</Link> : <span>Buổi đã xoá</span>}
                  </div>
                  <b>{formatCurrency(transaction.amount)}</b>
                  <span className={transaction.status === "paid" ? "status-paid" : "status-unpaid"}>
                    {transaction.status === "paid" ? "Đã chuyển" : "Chưa chuyển"}
                  </span>
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
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}
