import { ObjectId, type UpdateFilter } from "mongodb";
import { NextResponse } from "next/server";
import { deriveEventStatus } from "@/lib/event-status";
import { getMongoClient } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/permissions";
import type { EventDoc, TransactionDoc, TransactionStatus } from "@/lib/types";

interface TransactionPatchPayload {
  status?: TransactionStatus;
  reason?: unknown;
}

interface AuditActor {
  userId: ObjectId;
  name: string;
}

interface UpdateOutcome {
  httpStatus: number;
  message?: string;
  status?: TransactionStatus;
}

function parseAuditReason(value: unknown) {
  if (typeof value !== "string") {
    return { error: "Lý do thay đổi giao dịch không hợp lệ" } as const;
  }
  const reason = value.trim();
  if (!reason) return { error: "Cần nhập lý do thay đổi giao dịch" } as const;
  if (reason.length > 500) return { error: "Lý do không được dài quá 500 ký tự" } as const;
  return { reason } as const;
}

async function updateTransactionAtomically(
  transactionId: ObjectId,
  payload: { status: "paid" } | { status: "unpaid"; reason: string } | { status: "void"; reason: string },
  actor: AuditActor
): Promise<UpdateOutcome> {
  const client = await getMongoClient();
  const db = client.db();
  const mongoSession = client.startSession();
  let outcome: UpdateOutcome = { httpStatus: 409, message: "Không cập nhật được giao dịch" };

  try {
    await mongoSession.withTransaction(async () => {
      const transactions = db.collection<TransactionDoc>("transactions");
      const existing = await transactions.findOne({ _id: transactionId }, { session: mongoSession });
      if (!existing) {
        outcome = { httpStatus: 404, message: "Không tìm thấy giao dịch" };
        return;
      }

      if (payload.status === "void") {
        if (existing.status === "paid") {
          outcome = { httpStatus: 409, message: "Giao dịch đã thanh toán không thể hủy" };
          return;
        }
        if (existing.status === "void") {
          outcome = { httpStatus: 409, message: "Giao dịch đã được hủy trước đó" };
          return;
        }

        const now = new Date();
        const transaction = await transactions.findOneAndUpdate(
          { _id: transactionId, status: "unpaid" },
          {
            $set: {
              status: "void",
              voidedAt: now,
              voidedBy: actor.name,
              voidedByUserId: actor.userId,
              voidedByName: actor.name,
              voidReason: payload.reason,
              updatedAt: now
            }
          },
          { returnDocument: "after", session: mongoSession }
        );
        if (!transaction) {
          outcome = { httpStatus: 409, message: "Trạng thái giao dịch đã thay đổi, vui lòng thử lại" };
          return;
        }
        outcome = { httpStatus: 200, status: transaction.status, message: "Đã hủy giao dịch" };
      } else {
        if (existing.status === "void" && payload.status !== "unpaid") {
          outcome = { httpStatus: 409, message: "Giao dịch đã hủy chỉ có thể mở lại về trạng thái chưa chuyển" };
          return;
        }
        const now = new Date();
        let update: UpdateFilter<TransactionDoc>;
        if (payload.status === "paid") {
          update = existing.status === "paid"
            ? { $set: { status: "paid", updatedAt: now } }
            : {
                $set: {
                  status: "paid",
                  paidAt: now,
                  paidBy: actor.name,
                  paidByUserId: actor.userId,
                  paidByName: actor.name,
                  updatedAt: now
                }
              };
        } else {
          if (existing.status === "unpaid") {
            update = { $set: { status: "unpaid", updatedAt: now } };
          } else {
            update = {
              $set: {
                status: "unpaid",
                reopenedAt: now,
                reopenedBy: actor.name,
                reopenedByUserId: actor.userId,
                reopenedByName: actor.name,
                reopenReason: payload.reason,
                updatedAt: now
              }
            };
          }
        }

        const transaction = await transactions.findOneAndUpdate(
          { _id: transactionId, status: existing.status },
          update,
          { returnDocument: "after", session: mongoSession }
        );
        if (!transaction) {
          outcome = { httpStatus: 409, message: "Trạng thái giao dịch đã thay đổi, vui lòng thử lại" };
          return;
        }
        outcome = { httpStatus: 200, status: transaction.status };
      }

      const statuses = await transactions
        .find({ eventId: existing.eventId }, { session: mongoSession, projection: { status: 1 } })
        .map((transaction) => transaction.status)
        .toArray();
      await db.collection<EventDoc>("events").updateOne(
        { _id: existing.eventId },
        { $set: { status: deriveEventStatus(statuses), updatedAt: new Date() } },
        { session: mongoSession }
      );
    });
  } finally {
    await mongoSession.endSession();
  }

  return outcome;
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const adminSession = await requireAdmin();
  if (!ObjectId.isValid(params.id)) {
    return NextResponse.json({ message: "Transaction id không hợp lệ" }, { status: 400 });
  }

  const body = (await request.json().catch(() => null)) as TransactionPatchPayload | null;
  if (!body || (body.status !== "paid" && body.status !== "unpaid" && body.status !== "void")) {
    return NextResponse.json({ message: "Trạng thái không hợp lệ" }, { status: 400 });
  }

  let payload: { status: "paid" } | { status: "unpaid"; reason: string } | { status: "void"; reason: string };
  if (body.status === "void") {
    const parsedReason = parseAuditReason(body.reason);
    if ("error" in parsedReason) {
      return NextResponse.json({ message: parsedReason.error }, { status: 400 });
    }
    payload = { status: "void", reason: parsedReason.reason };
  } else if (body.status === "unpaid") {
    const parsedReason = parseAuditReason(body.reason);
    if ("error" in parsedReason) {
      return NextResponse.json({ message: parsedReason.error }, { status: 400 });
    }
    payload = { status: "unpaid", reason: parsedReason.reason };
  } else {
    payload = { status: "paid" };
  }

  const outcome = await updateTransactionAtomically(
    new ObjectId(params.id),
    payload,
    { userId: new ObjectId(adminSession.user.id), name: adminSession.user.name }
  );
  return NextResponse.json(
    { status: outcome.status, message: outcome.message },
    { status: outcome.httpStatus }
  );
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const adminSession = await requireAdmin();
  if (!ObjectId.isValid(params.id)) {
    return NextResponse.json({ message: "Transaction id không hợp lệ" }, { status: 400 });
  }

  const body = (await request.json().catch(() => null)) as { reason?: unknown } | null;
  const parsedReason = parseAuditReason(body?.reason);
  if ("error" in parsedReason) {
    return NextResponse.json({ message: parsedReason.error }, { status: 400 });
  }

  const outcome = await updateTransactionAtomically(
    new ObjectId(params.id),
    { status: "void", reason: parsedReason.reason },
    { userId: new ObjectId(adminSession.user.id), name: adminSession.user.name }
  );
  return NextResponse.json(
    { status: outcome.status, message: outcome.message },
    { status: outcome.httpStatus }
  );
}
