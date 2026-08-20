import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { requireAdmin, requireSession } from "@/lib/permissions";
import { calculateSettlement } from "@/lib/settlement";
import type { EventDoc, TransactionDoc, UserDoc } from "@/lib/types";

interface CreateEventPayload {
  name: string;
  date: string;
  participants: Array<{ userId: string; paidAmount: number; adjustmentAmount?: number }>; 
}

export async function GET() {
  await requireSession();
  const db = await getDb();
  const events = await db.collection<EventDoc>("events").find({}).sort({ date: -1 }).toArray();
  return NextResponse.json(
    events.map((event) => ({
      id: event._id.toString(),
      name: event.name,
      date: event.date,
      totalAmount: event.totalAmount,
      perPersonAmount: event.perPersonAmount,
      status: event.status,
      participants: event.participants.length
    }))
  );
}

export async function POST(request: Request) {
  await requireAdmin();
  const payload = (await request.json()) as CreateEventPayload;

  if (!payload.name?.trim() || !payload.date || !payload.participants?.length) {
    return NextResponse.json({ message: "Thiếu tên buổi, ngày hoặc người tham gia" }, { status: 400 });
  }

  if (payload.participants.length < 2) {
    return NextResponse.json({ message: "Chọn ít nhất 2 người tham gia buổi này" }, { status: 400 });
  }

  if (
    payload.participants.some(
      (participant) =>
        !ObjectId.isValid(participant.userId) ||
        !Number.isFinite(Number(participant.paidAmount)) ||
        Number(participant.paidAmount) < 0 ||
        !Number.isFinite(Number(participant.adjustmentAmount ?? 0))
    )
  ) {
    return NextResponse.json({ message: "Dữ liệu người tham gia không hợp lệ" }, { status: 400 });
  }

  const adjustmentTotal = payload.participants.reduce(
    (sum, participant) => sum + Math.round(Number(participant.adjustmentAmount ?? 0)),
    0
  );
  if (adjustmentTotal !== 0) {
    return NextResponse.json({ message: "Tổng tiền kèo phải bằng 0: người thua nhập số âm, người thắng nhập số dương" }, { status: 400 });
  }

  const db = await getDb();
  const selectedIds = payload.participants.map((participant) => new ObjectId(participant.userId));
  const users = await db.collection<UserDoc>("users").find({ _id: { $in: selectedIds } }).toArray();
  const userMap = new Map(users.map((user) => [user._id.toString(), user]));

  const settlement = calculateSettlement(
    payload.participants.map((participant) => {
      const user = userMap.get(participant.userId);
      if (!user) throw new Error("Người tham gia không tồn tại");
      return {
        userId: participant.userId,
        name: user.name,
        paidAmount: Number(participant.paidAmount) || 0,
        adjustmentAmount: Number(participant.adjustmentAmount ?? 0) || 0
      };
    })
  );

  const now = new Date();
  const eventDoc: Omit<EventDoc, "_id"> = {
    name: payload.name.trim(),
    date: new Date(payload.date),
    participants: settlement.participants.map((participant) => ({
      userId: new ObjectId(participant.userId),
      name: participant.name,
      paidAmount: participant.paidAmount,
      adjustmentAmount: participant.adjustmentAmount,
      baseBalance: participant.baseBalance,
      balance: participant.balance
    })),
    totalAmount: settlement.totalAmount,
    perPersonAmount: settlement.perPersonAmount,
    status: settlement.transactions.length === 0 ? "settled" : "open",
    createdAt: now,
    updatedAt: now
  };

  const eventResult = await db.collection<Omit<EventDoc, "_id">>("events").insertOne(eventDoc);
  const transactions: Array<Omit<TransactionDoc, "_id">> = settlement.transactions.map((transaction) => ({
    eventId: eventResult.insertedId,
    fromUserId: new ObjectId(transaction.fromUserId),
    fromName: transaction.fromName,
    toUserId: new ObjectId(transaction.toUserId),
    toName: transaction.toName,
    amount: transaction.amount,
    status: "unpaid",
    createdAt: now,
    updatedAt: now
  }));

  if (transactions.length > 0) {
    await db.collection<Omit<TransactionDoc, "_id">>("transactions").insertMany(transactions);
  }

  return NextResponse.json({ id: eventResult.insertedId.toString() }, { status: 201 });
}
