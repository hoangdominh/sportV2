import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
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
    status: event.status,
    participants: event.participants.map((participant) => ({
      userId: participant.userId.toString(),
      name: participant.name,
      paidAmount: participant.paidAmount,
      adjustmentAmount: participant.adjustmentAmount ?? 0,
      baseBalance: participant.baseBalance ?? participant.paidAmount - event.perPersonAmount,
      balance: participant.balance
    })),
    transactions: transactions.map((transaction) => ({
      id: transaction._id.toString(),
      fromName: transaction.fromName,
      toName: transaction.toName,
      amount: transaction.amount,
      status: transaction.status
    }))
  });
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  await requireAdmin();
  if (!ObjectId.isValid(params.id)) {
    return NextResponse.json({ message: "Event id không hợp lệ" }, { status: 400 });
  }

  const db = await getDb();
  const eventId = new ObjectId(params.id);
  const result = await db.collection<EventDoc>("events").deleteOne({ _id: eventId });
  if (result.deletedCount === 0) {
    return NextResponse.json({ message: "Không tìm thấy buổi" }, { status: 404 });
  }

  await db.collection<TransactionDoc>("transactions").deleteMany({ eventId });
  return NextResponse.json({ message: "Đã xoá buổi và các giao dịch liên quan" });
}
