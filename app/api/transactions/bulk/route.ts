import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/permissions";
import type { EventDoc, TransactionDoc, TransactionStatus } from "@/lib/types";

interface BulkPatchPayload {
  fromUserId?: string;
  toUserId?: string;
  status?: TransactionStatus;
}

export async function PATCH(request: Request) {
  await requireAdmin();
  const body = (await request.json()) as BulkPatchPayload;

  if (!body.fromUserId || !body.toUserId || !ObjectId.isValid(body.fromUserId) || !ObjectId.isValid(body.toUserId)) {
    return NextResponse.json({ message: "Thông tin người chuyển/người nhận không hợp lệ" }, { status: 400 });
  }

  if (body.status !== "paid" && body.status !== "unpaid") {
    return NextResponse.json({ message: "Trạng thái không hợp lệ" }, { status: 400 });
  }

  const db = await getDb();
  const fromUserId = new ObjectId(body.fromUserId);
  const toUserId = new ObjectId(body.toUserId);
  const transactions = await db
    .collection<TransactionDoc>("transactions")
    .find({ fromUserId, toUserId, status: body.status === "paid" ? "unpaid" : "paid" })
    .toArray();

  if (transactions.length === 0) {
    return NextResponse.json({ message: "Không có giao dịch phù hợp để cập nhật" }, { status: 404 });
  }

  const transactionIds = transactions.map((transaction) => transaction._id);
  const eventIds = [...new Set(transactions.map((transaction) => transaction.eventId.toString()))].map((id) => new ObjectId(id));
  const now = new Date();

  await db.collection<TransactionDoc>("transactions").updateMany(
    { _id: { $in: transactionIds } },
    { $set: { status: body.status, updatedAt: now } }
  );

  await Promise.all(
    eventIds.map(async (eventId) => {
      const unpaidCount = await db.collection<TransactionDoc>("transactions").countDocuments({ eventId, status: "unpaid" });
      await db.collection<EventDoc>("events").updateOne(
        { _id: eventId },
        { $set: { status: unpaidCount === 0 ? "settled" : "open", updatedAt: now } }
      );
    })
  );

  return NextResponse.json({ message: "Đã cập nhật giao dịch tổng hợp", updatedCount: transactions.length });
}
