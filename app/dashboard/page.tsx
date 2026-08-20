import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { AppNav } from "@/components/app-nav";
import { BulkTransactionStatusButton } from "@/components/bulk-transaction-status-button";
import { DeleteResourceButton } from "@/components/delete-resource-button";
import { QrCard } from "@/components/qr-card";
import { authOptions } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";
import { formatCurrency } from "@/lib/settlement";
import { aggregateTransactions } from "@/lib/aggregate-transactions";
import type { EventDoc, TransactionDoc, UserDoc } from "@/lib/types";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const db = await getDb();
  const [events, transactions, userCount] = await Promise.all([
    db.collection<EventDoc>("events").find({}).sort({ date: -1 }).toArray(),
    db.collection<TransactionDoc>("transactions").find({}).sort({ createdAt: -1 }).toArray(),
    db.collection<UserDoc>("users").countDocuments()
  ]);

  const eventIds = [...new Set(transactions.map((transaction) => transaction.eventId.toString()))];
  const eventMapDocs = events.filter((event) => eventIds.includes(event._id.toString()));
  const unpaidGroups = aggregateTransactions(transactions, eventMapDocs, "unpaid");
  const unpaidTransactions = transactions.filter((transaction) => transaction.status === "unpaid");
  const paidTransactions = transactions.filter((transaction) => transaction.status === "paid");
  const totalSpend = events.reduce((sum, event) => sum + event.totalAmount, 0);
  const openEvents = events.filter((event) => event.status === "open").length;
  const debtTotal = unpaidGroups.reduce((sum, group) => sum + group.totalAmount, 0);
  const paidTotal = paidTransactions.reduce((sum, transaction) => sum + transaction.amount, 0);
  const participantTurns = events.reduce((sum, event) => sum + event.participants.length, 0);
  const settlementRate = transactions.length > 0 ? Math.round((paidTransactions.length / transactions.length) * 100) : 100;
  const recentEvents = events.slice(0, 5);

  return (
    <main className="app-shell dashboard-shell">
      <AppNav role={session.user.role} userName={session.user.name} />

      <section className="dashboard-hero compact-hero">
        <div className="dashboard-hero-copy">
          <p className="eyebrow">Tổng quan nhóm</p>
          <h1>Cần thu {formatCurrency(debtTotal)}</h1>
          <p>Gộp các khoản chưa thanh toán theo từng cặp người. Một người tham gia nhiều buổi chỉ cần chuyển một lần, chi tiết buổi nằm ngay bên dưới.</p>
        </div>
        <div className="hero-actions">
          {session.user.role === "admin" ? (
            <Link className="primary-button" href="/events/new">
              Tạo buổi mới
            </Link>
          ) : null}
          <Link className="ghost-button" href="/transactions">
            Xem tất cả giao dịch
          </Link>
        </div>
      </section>

      <section className="metric-strip dashboard-summary-strip">
        <article className="metric-card accent">
          <span>Cần thanh toán</span>
          <strong>{formatCurrency(debtTotal)}</strong>
          <small>{unpaidGroups.length} khoản gộp từ {unpaidTransactions.length} giao dịch</small>
        </article>
        <article className="metric-card">
          <span>Tổng chi</span>
          <strong>{formatCurrency(totalSpend)}</strong>
          <small>{events.length} buổi / {participantTurns} lượt tham gia</small>
        </article>
        <article className="metric-card">
          <span>Buổi còn mở</span>
          <strong>{openEvents}</strong>
          <small>Admin cần xác nhận thanh toán</small>
        </article>
        <article className="metric-card">
          <span>Tất toán</span>
          <strong>{settlementRate}%</strong>
          <small>Đã chuyển {formatCurrency(paidTotal)}</small>
        </article>
      </section>

      <section className="dashboard-payment-grid">
        <div className="panel payment-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Cần thanh toán</p>
              <h2>Giao dịch gộp theo người</h2>
            </div>
            <span>{unpaidGroups.length} khoản cần xử lý</span>
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
                    <span>{group.items.length} buổi liên quan</span>
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

        <aside className="dashboard-side-stack">
          <div className="panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Buổi gần đây</p>
                <h2>Lịch sử buổi</h2>
              </div>
              <span>{recentEvents.length}/{events.length}</span>
            </div>
            <div className="event-list compact-events">
              {recentEvents.length === 0 ? <p className="empty-state">Chưa có buổi nào.</p> : null}
              {recentEvents.map((event) => (
                <article className="event-row compact-row" key={event._id.toString()}>
                  <Link className="row-main-link" href={`/events/${event._id.toString()}`}>
                    <div className="event-icon">{event.participants.length}</div>
                    <div>
                      <strong>{event.name}</strong>
                      <span>{new Intl.DateTimeFormat("vi-VN").format(event.date)} · {formatCurrency(event.totalAmount)}</span>
                    </div>
                  </Link>
                  <b className={event.status === "settled" ? "status-paid" : "status-unpaid"}>
                    {event.status === "settled" ? "Đã xong" : "Còn nợ"}
                  </b>
                </article>
              ))}
            </div>
          </div>

          <div className="panel signal-panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Signals</p>
                <h2>Tóm tắt</h2>
              </div>
            </div>
            <div className="signal-grid">
              <div><span>User</span><strong>{userCount}</strong><small>thành viên</small></div>
              <div><span>Giao dịch con</span><strong>{transactions.length}</strong><small>{unpaidTransactions.length} chưa chuyển</small></div>
              <div><span>Đã thanh toán</span><strong>{formatCurrency(paidTotal)}</strong><small>tiền đã xác nhận</small></div>
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
}
