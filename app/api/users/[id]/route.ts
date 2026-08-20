import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { BANKS } from "@/lib/banks";
import { requireAdmin } from "@/lib/permissions";
import type { UserDoc } from "@/lib/types";

interface UpdateUserPayload {
  bankBin?: string;
  bankAccountNo?: string;
  bankAccountName?: string;
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  await requireAdmin();
  if (!ObjectId.isValid(params.id)) {
    return NextResponse.json({ message: "User id không hợp lệ" }, { status: 400 });
  }

  const payload = (await request.json()) as UpdateUserPayload;
  const bankBin = payload.bankBin?.trim() ?? "";
  const bank = BANKS.find((item) => item.bin === bankBin);
  const bankAccountNo = payload.bankAccountNo?.trim() ?? "";
  const bankAccountName = payload.bankAccountName?.trim() ?? "";

  if ((bankAccountNo || bankAccountName) && !bank) {
    return NextResponse.json({ message: "Vui lòng chọn ngân hàng hợp lệ" }, { status: 400 });
  }

  const db = await getDb();
  const result = await db.collection<UserDoc>("users").updateOne(
    { _id: new ObjectId(params.id) },
    {
      $set: {
        bankBin: bank?.bin ?? "",
        bankName: bank?.shortName ?? "",
        bankAccountNo,
        bankAccountName
      }
    }
  );

  if (result.matchedCount === 0) {
    return NextResponse.json({ message: "Không tìm thấy user" }, { status: 404 });
  }

  return NextResponse.json({ message: "Đã cập nhật thông tin QR" });
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const session = await requireAdmin();
  if (!ObjectId.isValid(params.id)) {
    return NextResponse.json({ message: "User id không hợp lệ" }, { status: 400 });
  }

  if (session.user.id === params.id) {
    return NextResponse.json({ message: "Không thể xoá chính tài khoản đang đăng nhập" }, { status: 400 });
  }

  const db = await getDb();
  const user = await db.collection<UserDoc>("users").findOne({ _id: new ObjectId(params.id) });
  if (!user) {
    return NextResponse.json({ message: "Không tìm thấy user" }, { status: 404 });
  }

  if (user.role === "admin") {
    const adminCount = await db.collection<UserDoc>("users").countDocuments({ role: "admin" });
    if (adminCount <= 1) {
      return NextResponse.json({ message: "Không thể xoá admin cuối cùng" }, { status: 400 });
    }
  }

  await db.collection<UserDoc>("users").deleteOne({ _id: user._id });
  return NextResponse.json({ message: "Đã xoá user" });
}
