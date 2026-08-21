import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { deriveEventStatus } from "@/lib/event-status";
import { getDb, getMongoClient } from "@/lib/mongodb";
import { requireAdmin, requireSession } from "@/lib/permissions";
import type { EventDoc, TransactionDoc } from "@/lib/types";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  await requireSession();
  if (!ObjectId.isValid(params.id)) {
    return NextResponse.json({ message: "Event id không hợp lệ" }, { status: 400 });
  }

  const db = await getDb();
  const event = await db.collection<EventDoc>("events").findOne({ _id: new ObjectId(params.id) });
  if (!event) return NextResponse.json({ message: "Không tìm thấy buổi" }, { status: 404 });

  const transactions = await db
    .collection<TransactionDoc>("transactions")
    .find({ eventId: event._id })
    .sort({ status: -1, amount: -1 })
    .toArray();

  return NextResponse.json({
    id: event._id.toString(),
    name: event.name,
    date: event.date,
    totalAmount: event.totalAmount,
    perPersonAmount: event.perPersonAmount,
    status: deriveEventStatus(transactions.map((transaction) => transaction.status)),
    participants: event.participants.map((participant) => ({
      userId: participant.userId.toString(),
      name: participant.name,
      paidAmount: participant.paidAmount,
      shareAmount: participant.shareAmount ?? event.perPersonAmount,
      adjustmentAmount: participant.adjustmentAmount ?? 0,
      baseBalance:
        participant.baseBalance ?? participant.paidAmount - (participant.shareAmount ?? event.perPersonAmount),
      balance: participant.balance
    })),
    transactions: transactions.map((transaction) => ({
      id: transaction._id.toString(),
      fromName: transaction.fromName,
      toName: transaction.toName,
      amount: transaction.amount,
      status: transaction.status,
      paidAt: transaction.paidAt,
      paidBy: transaction.paidBy,
      paidByUserId: transaction.paidByUserId?.toString(),
      paidByName: transaction.paidByName,
      reopenedAt: transaction.reopenedAt,
      reopenedBy: transaction.reopenedBy,
      reopenedByUserId: transaction.reopenedByUserId?.toString(),
      reopenedByName: transaction.reopenedByName,
      reopenReason: transaction.reopenReason,
      voidedAt: transaction.voidedAt,
      voidedBy: transaction.voidedBy,
      voidedByUserId: transaction.voidedByUserId?.toString(),
      voidedByName: transaction.voidedByName,
      voidReason: transaction.voidReason
    }))
  });
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const adminSession = await requireAdmin();
  if (!ObjectId.isValid(params.id)) {
    return NextResponse.json({ message: "Event id không hợp lệ" }, { status: 400 });
  }

  const client = await getMongoClient();
  const db = client.db();
  const eventId = new ObjectId(params.id);
  const mongoSession = client.startSession();
  let outcome: "deleted" | "not_found" | "has_paid" = "not_found";
  try {
    await mongoSession.withTransaction(async () => {
      const event = await db.collection<EventDoc>("events").findOne(
        { _id: eventId },
        { session: mongoSession }
      );
      if (!event) {
        outcome = "not_found";
        return;
      }

      const paidTransaction = await db.collection<TransactionDoc>("transactions").findOne(
        { eventId, paidAt: { $exists: true } },
        { session: mongoSession, projection: { _id: 1 } }
      );
      if (paidTransaction) {
        outcome = "has_paid";
        return;
      }

      const now = new Date();
      await db.collection<TransactionDoc>("transactions").updateMany(
        { eventId, status: "unpaid" },
        {
          $set: {
            status: "void",
            voidedAt: now,
            voidedBy: adminSession.user.name,
            voidedByUserId: new ObjectId(adminSession.user.id),
            voidedByName: adminSession.user.name,
            voidReason: `Buổi đã bị xoá: ${event.name}`,
            updatedAt: now
          }
        },
        { session: mongoSession }
      );
      await db.collection<EventDoc>("events").deleteOne({ _id: eventId }, { session: mongoSession });
      outcome = "deleted";
    });
  } finally {
    await mongoSession.endSession();
  }

  if (outcome === "not_found") {
    return NextResponse.json({ message: "Không tìm thấy buổi" }, { status: 404 });
  }
  if (outcome === "has_paid") {
    return NextResponse.json(
      { message: "Không thể xoá buổi đã có giao dịch được xác nhận thanh toán" },
      { status: 409 }
    );
  }
  return NextResponse.json({ message: "Đã xoá buổi; giao dịch liên quan được lưu dưới trạng thái hủy" });
}
