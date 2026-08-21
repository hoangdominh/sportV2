import { ObjectId } from "mongodb";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { AppNav } from "@/components/app-nav";
import { TransactionsBoard, type TransactionBoardItem } from "@/components/transactions-board";
import { authOptions } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";
import type { EventDoc, TransactionDoc } from "@/lib/types";

export default async function TransactionsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const db = await getDb();
  const transactions = await db.collection<TransactionDoc>("transactions").find({}).sort({ createdAt: -1 }).toArray();
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
      <AppNav role={session.user.role} userName={session.user.name} />
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
        transferPrefix={process.env.TRANSFER_PREFIX ?? "CHIA TIEN"}
      />
    </main>
  );
}
