import { ObjectId, type Filter } from "mongodb";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { AppNav } from "@/components/app-nav";
import { TransactionsBoard, type TransactionBoardItem } from "@/components/transactions-board";
import { authOptions } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";
import type { EventDoc, TransactionDoc } from "@/lib/types";
import { getActivityType } from "@/lib/activity";
import { boundTransactionPage, parseTransactionFilters, transactionsHref, TRANSACTIONS_PAGE_SIZE, type TransactionSearchParams, type TransactionCounts, type TransactionFilterOptions } from "@/lib/transaction-filters";

export default async function TransactionsPage({ searchParams }: { searchParams: TransactionSearchParams }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const db = await getDb();
  const filters = parseTransactionFilters(searchParams);
  const collection = db.collection<TransactionDoc>("transactions");
  const match: Filter<TransactionDoc> = {};
  if (filters.from !== "all") match.fromUserId = new ObjectId(filters.from);
  if (filters.to !== "all") match.toUserId = new ObjectId(filters.to);
  if (filters.event !== "all") match.eventId = new ObjectId(filters.event);

  // Counts cover all matching obligations, not just the current page. Status
  // shortcuts share the same from/to/event scope and never intersect each other.
  const [stats, fromRows, toRows, eventRows] = await Promise.all([
    collection.aggregate<{ _id: TransactionDoc["status"]; count: number; amount: number }>([
      { $match: match },
      { $group: { _id: "$status", count: { $sum: 1 }, amount: { $sum: "$amount" } } }
    ]).toArray(),
    collection.aggregate<{ _id: ObjectId; name: string }>([
      { $group: { _id: "$fromUserId", name: { $min: "$fromName" } } }
    ]).toArray(),
    collection.aggregate<{ _id: ObjectId; name: string }>([
      { $group: { _id: "$toUserId", name: { $min: "$toName" } } }
    ]).toArray(),
    collection.aggregate<{ _id: ObjectId; name?: string }>([
      { $group: { _id: "$eventId" } },
      { $lookup: { from: "events", localField: "_id", foreignField: "_id", as: "event" } },
      { $project: { name: { $arrayElemAt: ["$event.name", 0] } } }
    ]).toArray()
  ]);
  const counts: TransactionCounts = { unpaid: 0, paid: 0, void: 0 };
  let totalAmount = 0;
  for (const row of stats) {
    counts[row._id] = row.count;
    if (filters.status === "all" || filters.status === row._id) totalAmount += row.amount;
  }
  const total = filters.status === "all" ? counts.unpaid + counts.paid + counts.void : counts[filters.status];
  filters.page = boundTransactionPage(filters.page, total);
  const canonicalHref = transactionsHref(filters);
  const suppliedParams = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (Array.isArray(value)) value.forEach((entry) => suppliedParams.append(key, entry));
    else if (value !== undefined) suppliedParams.set(key, value);
  }
  suppliedParams.sort();
  const canonicalParams = new URLSearchParams(canonicalHref.split("?")[1]);
  canonicalParams.sort();
  if (suppliedParams.toString() !== canonicalParams.toString()) redirect(canonicalHref);

  const options: TransactionFilterOptions = {
    from: fromRows.map((row) => ({ id: row._id.toString(), name: row.name })),
    to: toRows.map((row) => ({ id: row._id.toString(), name: row.name })),
    event: eventRows.map((row) => ({ id: row._id.toString(), name: row.name ?? "Buổi đã xoá" }))
  };
  for (const key of ["from", "to", "event"] as const) {
    if (filters[key] !== "all" && !options[key].some((option) => option.id === filters[key])) {
      options[key].push({ id: filters[key], name: key === "event" ? "Buổi không còn giao dịch" : "Người không còn giao dịch" });
    }
    options[key].sort((a, b) => a.name.localeCompare(b.name, "vi") || a.id.localeCompare(b.id));
  }
  const transactions = await collection.find({ ...match, ...(filters.status === "all" ? {} : { status: filters.status }) })
    .sort({ createdAt: -1, _id: -1 }).skip((filters.page - 1) * TRANSACTIONS_PAGE_SIZE).limit(TRANSACTIONS_PAGE_SIZE).toArray();
  const eventIds = [...new Set(transactions.map((transaction) => transaction.eventId.toString()))].map((id) => new ObjectId(id));
  const events = eventIds.length > 0 ? await db.collection<EventDoc>("events").find({ _id: { $in: eventIds } }).toArray() : [];
  const eventMap = new Map(events.map((event) => [event._id.toString(), event]));
  const boardItems: TransactionBoardItem[] = transactions.map((transaction) => {
    const event = eventMap.get(transaction.eventId.toString());
    return {
      id: transaction._id.toString(),
      eventId: transaction.eventId.toString(),
      eventName: event?.name ?? "Buổi đã xoá",
      eventDate: event?.date.toISOString() ?? null,
      eventExists: Boolean(event),
      activityType: getActivityType(event?.activityType),
      participants: event?.participants.map((participant) => ({ userId: participant.userId.toString(), name: participant.name })) ?? [],
      fromUserId: transaction.fromUserId.toString(),
      fromName: transaction.fromName,
      toUserId: transaction.toUserId.toString(),
      toName: transaction.toName,
      amount: transaction.amount,
      status: transaction.status,
      paidAt: transaction.paidAt?.toISOString(),
      paidBy: transaction.paidBy,
      paidByName: transaction.paidByName,
      reopenedAt: transaction.reopenedAt?.toISOString(),
      reopenedBy: transaction.reopenedBy,
      reopenedByName: transaction.reopenedByName,
      reopenReason: transaction.reopenReason,
      voidedAt: transaction.voidedAt?.toISOString(),
      voidedBy: transaction.voidedBy,
      voidedByName: transaction.voidedByName,
      voidReason: transaction.voidReason
    };
  });

  return (
    <main className="app-shell transactions-shell">
      <AppNav role={session.user.role} userName={session.user.name} userId={session.user.id} />
      <header className="topbar transactions-topbar">
        <div>
          <p className="eyebrow">Giao dịch</p>
          <h1>Từng khoản, đúng từng buổi</h1>
          <p className="page-intro">Mỗi thẻ là một nghĩa vụ độc lập. QR và xác nhận thanh toán không được gộp giữa các buổi.</p>
        </div>
        {session.user.role === "admin" ? <Link className="primary-button" href="/events/new">Tạo buổi mới</Link> : null}
      </header>
      <TransactionsBoard
        isAdmin={session.user.role === "admin"}
        transactions={boardItems}
        filters={filters}
        options={options}
        counts={counts}
        total={total}
        totalAmount={totalAmount}
        transferPrefix={process.env.TRANSFER_PREFIX ?? "CHIA TIEN"}
      />
    </main>
  );
}
