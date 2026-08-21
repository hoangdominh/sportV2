import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { AppNav } from "@/components/app-nav";
import { authOptions } from "@/lib/auth";
import { deriveEventStatus } from "@/lib/event-status";
import { getDb } from "@/lib/mongodb";
import { formatCurrency } from "@/lib/settlement";
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

  const eventMap = new Map(events.map((event) => [event._id.toString(), event]));
  const statusesByEvent = new Map<string, TransactionDoc["status"][]>();
  for (const transaction of transactions) {
    const eventId = transaction.eventId.toString();
    const statuses = statusesByEvent.get(eventId);
    if (statuses) statuses.push(transaction.status);
    else statusesByEvent.set(eventId, [transaction.status]);
  }
  const getEventStatus = (event: EventDoc) => deriveEventStatus(statusesByEvent.get(event._id.toString()) ?? []);
  const unpaidTransactions = transactions.filter((transaction) => transaction.status === "unpaid");
  const paidTransactions = transactions.filter((transaction) => transaction.status === "paid");
  const activeTransactions = transactions.filter((transaction) => transaction.status !== "void");
  const voidTransactions = transactions.filter((transaction) => transaction.status === "void");
  const totalSpend = events.reduce((sum, event) => sum + event.totalAmount, 0);
  const openEvents = events.filter((event) => getEventStatus(event) === "open").length;
  const reviewEvents = events.filter((event) => getEventStatus(event) === "needs_review").length;
  const debtTotal = unpaidTransactions.reduce((sum, transaction) => sum + transaction.amount, 0);
  const paidTotal = paidTransactions.reduce((sum, transaction) => sum + transaction.amount, 0);
  const participantTurns = events.reduce((sum, event) => sum + event.participants.length, 0);
  const settlementRate = activeTransactions.length > 0 ? Math.round((paidTransactions.length / activeTransactions.length) * 100) : 100;
  const recentEvents = events.slice(0, 5);

  return (
    <main className="app-shell dashboard-shell">
      <AppNav role={session.user.role} userName={session.user.name} />

      <section className="dashboard-hero compact-hero">
        <div className="dashboard-hero-copy">
          <p className="eyebrow">Tổng quan nhóm</p>
          <h1>Cần thu {formatCurrency(debtTotal)}</h1>
          <p>Tổng tham khảo từ các giao dịch chưa chuyển. Mỗi nghĩa vụ vẫn được thanh toán và xác nhận riêng theo đúng buổi phát sinh.</p>
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
          <small>{unpaidTransactions.length} giao dịch riêng theo từng buổi</small>
        </article>
        <article className="metric-card">
          <span>Tổng chi</span>
          <strong>{formatCurrency(totalSpend)}</strong>
          <small>{events.length} buổi / {participantTurns} lượt tham gia</small>
        </article>
        <article className="metric-card">
          <span>Buổi còn mở</span>
          <strong>{openEvents}</strong>
          <small>{reviewEvents > 0 ? `${reviewEvents} buổi cần kiểm tra giao dịch hủy` : "Admin cần xác nhận thanh toán"}</small>
        </article>
        <article className="metric-card">
          <span>Tỷ lệ xác nhận</span>
          <strong>{settlementRate}%</strong>
          <small>Đã chuyển {formatCurrency(paidTotal)}</small>
        </article>
      </section>

      <section className="dashboard-payment-grid">
        <div className="panel payment-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Cần thanh toán</p>
              <h2>Giao dịch riêng theo từng buổi</h2>
            </div>
            <span>{unpaidTransactions.length} khoản cần xử lý</span>
          </div>
          <div className="aggregate-list">
            {unpaidTransactions.length === 0 ? <p className="empty-state">Không còn khoản nào cần thanh toán.</p> : null}
            {unpaidTransactions.slice(0, 10).map((transaction) => {
              const event = eventMap.get(transaction.eventId.toString());
              return (
              <article className="aggregate-card dashboard-raw-card" key={transaction._id.toString()}>
                <div className="aggregate-main">
                  <div>
                    <p>
                      <strong>{transaction.fromName}</strong> chuyển cho <strong>{transaction.toName}</strong>
                    </p>
                    {event ? <Link href={`/events/${event._id.toString()}`}>{event.name} · {new Intl.DateTimeFormat("vi-VN").format(event.date)}</Link> : <span>Buổi đã xoá</span>}
                  </div>
                  <strong className="aggregate-amount">{formatCurrency(transaction.amount)}</strong>
                </div>
                <small>Thanh toán và xác nhận riêng tại trang giao dịch hoặc chi tiết buổi.</small>
              </article>
              );
            })}
            {unpaidTransactions.length > 10 ? <Link className="ghost-button" href="/transactions">Xem thêm {unpaidTransactions.length - 10} giao dịch</Link> : null}
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
                  <b className={getEventStatus(event) === "settled" ? "status-paid" : getEventStatus(event) === "needs_review" ? "status-void" : "status-unpaid"}>
                    {getEventStatus(event) === "settled" ? "Đã xong" : getEventStatus(event) === "needs_review" ? "Cần kiểm tra" : "Còn nợ"}
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
              <div><span>Giao dịch</span><strong>{activeTransactions.length}</strong><small>{unpaidTransactions.length} chưa chuyển · {voidTransactions.length} đã hủy</small></div>
              <div><span>Đã thanh toán</span><strong>{formatCurrency(paidTotal)}</strong><small>tiền đã xác nhận</small></div>
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
}
