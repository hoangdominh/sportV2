import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { AppNav } from "@/components/app-nav";
import { DashboardNavigationTiming } from "@/components/dashboard-navigation-timing";
import { ActivityIcon } from "@/components/activity-icon";
import { MemberAvatar, ParticipantAvatars } from "@/components/member-avatar";
import { authOptions } from "@/lib/auth";
import { deriveEventStatus } from "@/lib/event-status";
import { getDb } from "@/lib/mongodb";
import { formatCurrency } from "@/lib/settlement";
import type { EventDoc, TransactionDoc } from "@/lib/types";
import { ArrowDownRight, ArrowRight, CheckCheck, Plus, AlertCircle, Activity, CircleDollarSign } from "lucide-react";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const dbStartedAt = performance.now();
  const db = await getDb();
  const dbReadyMs = performance.now() - dbStartedAt;
  const queriesStartedAt = performance.now();
  const queryPromise = Promise.all([
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
  ]).finally(() => {
    console.info("dashboard.data.timing", {
      dbReadyMs: Math.round(dbReadyMs),
      queriesMs: Math.round(performance.now() - queriesStartedAt)
    });
  });
  const [events, transactionStats, recentUnpaidTransactions, statusesByEventRows] = await queryPromise;
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
  const paidTotal = getTransactionTotal("paid");
  const totalOwed = debtTotal + paidTotal;
  const paidRate = totalOwed === 0 ? undefined : Math.round((paidTotal / totalOwed) * 100);
  const now = new Date();
  const monthlySpend = Array.from({ length: 6 }, (_, index) => {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - 5 + index, 1);
    const monthKey = `${monthDate.getFullYear()}-${monthDate.getMonth()}`;
    return {
      key: monthKey,
      label: new Intl.DateTimeFormat("vi-VN", { month: "short" }).format(monthDate).replace(".", ""),
      amount: events.reduce((sum, event) => {
        return event.date.getFullYear() === monthDate.getFullYear() && event.date.getMonth() === monthDate.getMonth()
          ? sum + event.totalAmount
          : sum;
      }, 0)
    };
  });
  const monthlyMax = Math.max(...monthlySpend.map((month) => month.amount), 1);

  return (
    <main className="app-shell dashboard-shell overview">
      <DashboardNavigationTiming />
      <AppNav role={session.user.role} userName={session.user.name} userId={session.user.id} />
      <header className="overview-heading">
        <div>
          <p className="eyebrow">SỔ ĐỘI · MÙA {now.getFullYear()}</p>
          <h1>Tổng quan</h1>
          <p>Chào {session.user.name}. Đây là bảng điểm chi tiêu của cả nhóm.</p>
        </div>
        {session.user.role === "admin" ? (
          <Link className="overview-create" href="/events/new"><Plus size={18} aria-hidden="true" /> Ghi buổi mới</Link>
        ) : null}
      </header>

      <section className="scoreboard-hero" aria-labelledby="balance-heading">
        <div className="scoreboard-copy">
          <p className="scoreboard-kicker"><CircleDollarSign size={16} aria-hidden="true" /> CÔNG NỢ ĐANG MỞ</p>
          <h2 id="balance-heading">{unpaidCount > 0 ? "Cần thu về" : events.length > 0 ? "Đội đã cân quỹ" : "Bắt đầu mùa chơi"}</h2>
          <p className="scoreboard-amount">{formatCurrency(debtTotal)}</p>
          <p className="scoreboard-note">{unpaidCount > 0 ? `${unpaidCount} khoản đang chờ xác nhận` : events.length > 0 ? "Không còn khoản chuyển nào đang chờ." : "Ghi lại buổi chơi đầu tiên của nhóm."}</p>
          <Link className="scoreboard-link" href={unpaidCount > 0 ? "#pending-payments" : "/transactions"}>
            {unpaidCount > 0 ? "Xử lý khoản đang chờ" : "Mở sổ giao dịch"}<ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
        <div className="scoreboard-art" role="img" aria-label={`Đã thanh toán ${paidRate === undefined ? "chưa có khoản" : `${paidRate}%`}`}>
          <span className="court-line court-line-horizontal" />
          <span className="court-line court-line-vertical" />
          <span className="court-circle" />
          <div className="scoreboard-stamp"><span>ĐÃ CHỐT</span><CheckCheck size={20} /><strong>{paidRate === undefined ? "—" : `${paidRate}%`}</strong><small>{paidRate === undefined ? "chưa có khoản" : "đã thanh toán"}</small></div>
          <span className="scoreboard-season">{now.getFullYear()} / LEAGUE</span>
        </div>
      </section>

      {reviewEvents.length > 0 ? (
        <section className="overview-review" aria-label="Buổi cần kiểm tra">
          <AlertCircle size={19} aria-hidden="true" />
          <div>
            <h2>{reviewEvents.length} buổi cần kiểm tra giao dịch hủy</h2>
            <div className="overview-review-links">
              {reviewEvents.map((event) => <Link key={event._id.toString()} href={`/events/${event._id.toString()}`}><ActivityIcon activityType={event.activityType} />{event.name}<ArrowRight size={14} aria-hidden="true" /></Link>)}
            </div>
          </div>
        </section>
      ) : null}

      <section className="score-metrics" aria-label="Chỉ số mùa chơi">
        <article className="score-metric"><span>TỔNG CHI</span><strong>{formatCurrency(totalSpend)}</strong><small><Activity size={13} /> {events.length} buổi đã ghi</small></article>
        <article className="score-metric"><span>BUỔI CÒN MỞ</span><strong>{openEvents}</strong><small>đang chờ chốt quỹ</small></article>
        <article className="score-metric"><span>KHOẢN CHỜ XỬ LÝ</span><strong>{unpaidCount}</strong><small>{formatCurrency(paidTotal)} đã xác nhận</small></article>
      </section>

      <div className="overview-columns">
        <section className="overview-section" id="pending-payments" aria-labelledby="pending-heading">
          <header className="overview-section-heading">
            <div><p className="section-overline">BẢNG CÔNG NỢ</p><h2 id="pending-heading">Cần xử lý</h2></div>
            <Link href="/transactions">Mở sổ <ArrowRight size={15} aria-hidden="true" /></Link>
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
                    <MemberAvatar userId={transaction.fromUserId.toString()} name={transaction.fromName} />
                    <div className="overview-payment-copy">
                      <h3>{transaction.fromName} <span>→</span> {transaction.toName}</h3>
                      <p><ActivityIcon activityType={event?.activityType} />{event ? `${event.name} · ${dateFormatter.format(event.date)}` : "Buổi đã xóa"}</p>
                      {event ? <ParticipantAvatars participants={event.participants.map((participant) => ({ userId: participant.userId.toString(), name: participant.name }))} /> : null}
                    </div>
                    <div className="overview-payment-value"><strong>{formatCurrency(transaction.amount)}</strong><span>CHƯA CHỐT</span></div>
                  </Link>
                );
              })}
            </div>
          )}
          {unpaidCount > 5 ? <Link className="overview-more" href="/transactions">Xem thêm {unpaidCount - 5} khoản <ArrowRight size={16} aria-hidden="true" /></Link> : null}
        </section>

        <section className="overview-section overview-recent" aria-labelledby="recent-heading">
          <header className="overview-section-heading"><div><p className="section-overline">CHI TIÊU THEO THÁNG</p><h2 id="trend-heading">Nhịp chi của đội</h2></div><span>6 tháng</span></header>
          <div className="monthly-chart" role="list" aria-label="Chi tiêu theo tháng, sáu tháng gần nhất">
            {monthlySpend.map((month) => <div className="monthly-bar-column" key={month.key} role="listitem" aria-label={`${month.label}: ${formatCurrency(month.amount)}`}><span className="monthly-bar-value" aria-hidden="true">{month.amount > 0 ? formatCurrency(month.amount) : "—"}</span><div className="monthly-bar-track" aria-hidden="true"><span className="monthly-bar" style={{ height: `${month.amount === 0 ? 3 : Math.max(8, (month.amount / monthlyMax) * 100)}%` }} /></div><span className="monthly-bar-label" aria-hidden="true">{month.label}</span></div>)}
          </div>
          <header className="overview-section-heading overview-history-heading"><div><p className="section-overline">LỊCH SỬ SÂN</p><h2 id="recent-heading">Buổi gần đây</h2></div><span>{recentEvents.length} mới nhất</span></header>
          {recentEvents.length === 0 ? <div className="overview-empty"><h3>Chưa có buổi nào</h3><p>{session.user.role === "admin" ? "Ghi buổi đầu tiên để bắt đầu sổ quỹ." : "Các buổi chơi sẽ xuất hiện tại đây."}</p></div> : null}
          {recentEvents.map((event) => {
            const status = getEventStatus(event);
            return (
              <Link className="overview-event" key={event._id.toString()} href={`/events/${event._id.toString()}`}>
                <div className="overview-event-title"><h3><ActivityIcon activityType={event.activityType} />{event.name}</h3><ArrowRight size={16} aria-hidden="true" /></div>
                <p>{dateFormatter.format(event.date)} · {formatCurrency(event.totalAmount)}</p>
                <ParticipantAvatars participants={event.participants.map((participant) => ({ userId: participant.userId.toString(), name: participant.name }))} />
                <span className={`overview-event-status ${status}`}>{status === "settled" ? "Đã chốt" : status === "needs_review" ? "Cần kiểm tra" : "Còn khoản nợ"}</span>
              </Link>
            );
          })}
        </section>
      </div>
      <footer className="overview-footnote"><ArrowDownRight size={14} /> Một mùa chơi vui hơn khi quỹ luôn rõ ràng.</footer>
    </main>
  );
}
