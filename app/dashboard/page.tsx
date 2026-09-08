import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { AppNav } from "@/components/app-nav";
import { authOptions } from "@/lib/auth";
import { deriveEventStatus } from "@/lib/event-status";
import { getDb } from "@/lib/mongodb";
import { formatCurrency } from "@/lib/settlement";
import type { EventDoc, TransactionDoc } from "@/lib/types";
import { ArrowRight, CheckCheck, Plus, AlertCircle } from "lucide-react";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const db = await getDb();
  const [events, transactionStats, recentUnpaidTransactions, statusesByEventRows] = await Promise.all([
    db.collection<EventDoc>("events").find({}).sort({ date: -1 }).toArray(),
    db
      .collection<TransactionDoc>("transactions")
      .aggregate<{ _id: TransactionDoc["status"]; count: number; total: number }>([
        { $group: { _id: "$status", count: { $sum: 1 }, total: { $sum: "$amount" } } }
      ])
      .toArray(),
    db.collection<TransactionDoc>("transactions").find({ status: "unpaid" }).sort({ createdAt: -1 }).limit(5).toArray(),
    db
      .collection<TransactionDoc>("transactions")
      .aggregate<{ _id: TransactionDoc["eventId"]; statuses: TransactionDoc["status"][] }>([
        { $group: { _id: "$eventId", statuses: { $push: "$status" } } }
      ])
      .toArray()
  ]);
  const eventMap = new Map(events.map((event) => [event._id.toString(), event]));
  const statusesByEvent = new Map(statusesByEventRows.map((row) => [row._id.toString(), row.statuses]));
  const transactionSummary = new Map(transactionStats.map((row) => [row._id, row]));
  const getTransactionCount = (status: TransactionDoc["status"]) => transactionSummary.get(status)?.count ?? 0;
  const getTransactionTotal = (status: TransactionDoc["status"]) => transactionSummary.get(status)?.total ?? 0;
  const getEventStatus = (event: EventDoc) => deriveEventStatus(statusesByEvent.get(event._id.toString()) ?? []);
  const unpaidCount = getTransactionCount("unpaid");
  const totalSpend = events.reduce((sum, event) => sum + event.totalAmount, 0);
  const openEvents = events.filter((event) => getEventStatus(event) === "open").length;
  const reviewEvents = events.filter((event) => getEventStatus(event) === "needs_review");
  const debtTotal = getTransactionTotal("unpaid");
  const recentEvents = events.slice(0, 4);
  const dateFormatter = new Intl.DateTimeFormat("vi-VN", { day: "numeric", month: "numeric" });

  return (
    <main className="app-shell dashboard-shell overview">
      <AppNav role={session.user.role} userName={session.user.name} />
      <header className="overview-heading">
        <div>
          <h1>Tổng quan</h1>
          <p>Chào {session.user.name}, cùng xem các khoản chi của nhóm.</p>
        </div>
        {session.user.role === "admin" ? (
          <Link className="overview-create" href="/events/new"><Plus size={18} aria-hidden="true" /> Tạo buổi mới</Link>
        ) : null}
      </header>

      <section className="overview-balance" aria-labelledby="balance-heading">
        <div className="overview-balance-main">
          <h2 id="balance-heading">{events.length === 0 ? "Bắt đầu chia tiền cùng nhóm" : unpaidCount > 0 ? "Chưa thanh toán · Toàn nhóm" : "Đã thanh toán hết"}</h2>
          {unpaidCount > 0 ? (
            <>
              <p className="overview-amount">{formatCurrency(debtTotal)}</p>
              <p className="overview-balance-note">{unpaidCount} khoản đang chờ xác nhận · {openEvents} buổi còn mở</p>
            </>
          ) : (
            <div className="overview-clear">
              <CheckCheck size={32} aria-hidden="true" />
              <p>{events.length === 0 ? "Buổi đầu tiên, mọi khoản chi đều rõ ràng." : "Gọn khoản nợ. Trọn cuộc vui."}</p>
            </div>
          )}
        </div>
        <Link className="overview-balance-action" href={unpaidCount > 0 ? "#pending-payments" : "/transactions"}>
          {unpaidCount > 0 ? "Xem khoản cần xử lý" : "Xem giao dịch"}<ArrowRight size={18} aria-hidden="true" />
        </Link>
      </section>

      {reviewEvents.length > 0 ? (
        <section className="overview-review" aria-label="Buổi cần kiểm tra">
          <AlertCircle size={19} aria-hidden="true" />
          <div>
            <h2>{reviewEvents.length} buổi cần kiểm tra giao dịch hủy</h2>
            <div className="overview-review-links">
              {reviewEvents.map((event) => <Link key={event._id.toString()} href={`/events/${event._id.toString()}`}>{event.name}<ArrowRight size={14} aria-hidden="true" /></Link>)}
            </div>
          </div>
        </section>
      ) : null}

      <div className="overview-columns">
        <section className="overview-section" id="pending-payments" aria-labelledby="pending-heading">
          <header className="overview-section-heading">
            <h2 id="pending-heading">Cần xử lý</h2>
            <Link href="/transactions">Tất cả giao dịch <ArrowRight size={15} aria-hidden="true" /></Link>
          </header>
          {recentUnpaidTransactions.length === 0 ? (
            <div className="overview-empty">
              <CheckCheck size={28} aria-hidden="true" />
              <h3>Không có khoản chờ thanh toán</h3>
              <p>{reviewEvents.length > 0 ? "Bạn vẫn còn buổi cần kiểm tra ở phía trên." : "Các khoản cần xử lý sẽ xuất hiện tại đây."}</p>
            </div>
          ) : (
            <div className="overview-payments">
              {recentUnpaidTransactions.map((transaction) => {
                const event = eventMap.get(transaction.eventId.toString());
                return (
                  <Link className="overview-payment" key={transaction._id.toString()} href={event ? `/events/${event._id.toString()}` : "/transactions"}>
                    <span className="overview-avatar" aria-hidden="true">{transaction.fromName.trim().charAt(0).toUpperCase()}</span>
                    <div className="overview-payment-copy">
                      <h3>{transaction.fromName} <span>→</span> {transaction.toName}</h3>
                      <p>{event ? `${event.name} · ${dateFormatter.format(event.date)}` : "Buổi đã xóa"}</p>
                    </div>
                    <div className="overview-payment-value">
                      <strong>{formatCurrency(transaction.amount)}</strong>
                      <span>Xem buổi <ArrowRight size={13} aria-hidden="true" /></span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
          {unpaidCount > 5 ? <Link className="overview-more" href="/transactions">Xem thêm {unpaidCount - 5} khoản <ArrowRight size={16} aria-hidden="true" /></Link> : null}
        </section>

        <section className="overview-section overview-recent" aria-labelledby="recent-heading">
          <header className="overview-section-heading"><h2 id="recent-heading">Buổi gần đây</h2><span>{recentEvents.length} buổi mới nhất</span></header>
          {recentEvents.length === 0 ? <div className="overview-empty"><h3>Chưa có buổi nào</h3><p>{session.user.role === "admin" ? "Tạo buổi mới để bắt đầu ghi nhận khoản chi." : "Các buổi do admin tạo sẽ xuất hiện tại đây."}</p></div> : null}
          {recentEvents.map((event) => {
            const status = getEventStatus(event);
            return (
              <Link className="overview-event" key={event._id.toString()} href={`/events/${event._id.toString()}`}>
                <div className="overview-event-title"><h3>{event.name}</h3><ArrowRight size={16} aria-hidden="true" /></div>
                <p>{dateFormatter.format(event.date)} · {formatCurrency(event.totalAmount)}</p>
                <span className={`overview-event-status ${status}`}>{status === "settled" ? "Hoàn tất" : status === "needs_review" ? "Cần kiểm tra" : "Còn nợ"}</span>
              </Link>
            );
          })}
        </section>
      </div>
      <footer className="overview-footnote">{events.length} buổi đã ghi nhận <span>·</span> Tổng chi {formatCurrency(totalSpend)}</footer>
    </main>
  );
}
