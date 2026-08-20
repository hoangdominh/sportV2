import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/permissions";
import type { EventDoc, TransactionDoc, TransactionStatus } from "@/lib/types";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  await requireAdmin();
  if (!ObjectId.isValid(params.id)) {
    return NextResponse.json({ message: "Transaction id không hợp lệ" }, { status: 400 });
  }

  const body = (await request.json()) as { status?: TransactionStatus };
  if (body.status !== "paid" && body.status !== "unpaid") {
    return NextResponse.json({ message: "Trạng thái không hợp lệ" }, { status: 400 });
  }

  const db = await getDb();
  const transaction = await db.collection<TransactionDoc>("transactions").findOneAndUpdate(
    { _id: new ObjectId(params.id) },
    { $set: { status: body.status, updatedAt: new Date() } },
    { returnDocument: "after" }
  );

  if (!transaction) return NextResponse.json({ message: "Không tìm thấy giao dịch" }, { status: 404 });

  const unpaidCount = await db
    .collection<TransactionDoc>("transactions")
    .countDocuments({ eventId: transaction.eventId, status: "unpaid" });

  await db.collection<EventDoc>("events").updateOne(
    { _id: transaction.eventId },
    { $set: { status: unpaidCount === 0 ? "settled" : "open", updatedAt: new Date() } }
  );

  return NextResponse.json({ status: transaction.status });
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  await requireAdmin();
  if (!ObjectId.isValid(params.id)) {
    return NextResponse.json({ message: "Transaction id không hợp lệ" }, { status: 400 });
  }

  const db = await getDb();
  const transaction = await db.collection<TransactionDoc>("transactions").findOneAndDelete({ _id: new ObjectId(params.id) });
  if (!transaction) {
    return NextResponse.json({ message: "Không tìm thấy giao dịch" }, { status: 404 });
  }

  const unpaidCount = await db
    .collection<TransactionDoc>("transactions")
    .countDocuments({ eventId: transaction.eventId, status: "unpaid" });
  await db.collection<EventDoc>("events").updateOne(
    { _id: transaction.eventId },
    { $set: { status: unpaidCount === 0 ? "settled" : "open", updatedAt: new Date() } }
  );

  return NextResponse.json({ message: "Đã xoá giao dịch" });
}
