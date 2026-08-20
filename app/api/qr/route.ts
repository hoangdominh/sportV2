import QRCode from "qrcode";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { requireSession } from "@/lib/permissions";
import { buildVietQrPayload } from "@/lib/vietqr";
import type { UserDoc } from "@/lib/types";

export async function GET(request: Request) {
  await requireSession();
  const { searchParams } = new URL(request.url);
  const amount = Number(searchParams.get("amount") ?? 0);
  const description = searchParams.get("description") ?? "CHIA TIEN";
  const toUserId = searchParams.get("toUserId");

  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ message: "Số tiền không hợp lệ" }, { status: 400 });
  }

  let account;
  if (toUserId && ObjectId.isValid(toUserId)) {
    const db = await getDb();
    const user = await db.collection<UserDoc>("users").findOne({ _id: new ObjectId(toUserId) });
    if (user?.bankBin && user.bankAccountNo) {
      account = {
        bankBin: user.bankBin,
        accountNo: user.bankAccountNo,
        accountName: user.bankAccountName || user.name
      };
    }
  }

  const payload = buildVietQrPayload(Math.round(amount), description, account);
  const qrDataUrl = payload.startsWith("https://")
    ? payload
    : await QRCode.toDataURL(payload, { width: 320, margin: 2 });

  return NextResponse.json({ qrDataUrl, payload });
}
