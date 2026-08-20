import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { requireAdmin, requireSession } from "@/lib/permissions";
import { BANKS } from "@/lib/banks";
import type { UserDoc } from "@/lib/types";

export async function GET() {
  await requireSession();
  const db = await getDb();
  const users = await db
    .collection<UserDoc>("users")
    .find({}, { projection: { passwordHash: 0 } })
    .sort({ role: 1, name: 1 })
    .toArray();

  return NextResponse.json(
    users.map((user) => ({
      id: user._id.toString(),
      name: user.name,
      username: user.username,
      role: user.role,
      bankBin: user.bankBin ?? "",
      bankName: user.bankName ?? "",
      bankAccountNo: user.bankAccountNo ?? "",
      bankAccountName: user.bankAccountName ?? ""
    }))
  );
}

interface CreateUserPayload {
  name?: string;
  username?: string;
  password?: string;
  role?: "admin" | "member";
  bankBin?: string;
  bankAccountNo?: string;
  bankAccountName?: string;
}

function normalizeUsername(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 32);
}

export async function POST(request: Request) {
  await requireAdmin();
  const payload = (await request.json()) as CreateUserPayload;
  const name = payload.name?.trim();
  const username = payload.username ? normalizeUsername(payload.username) : undefined;
  const password = payload.password;
  const role = payload.role ?? "member";
  const bankBin = payload.bankBin?.trim();
  const bank = BANKS.find((item) => item.bin === bankBin);
  const bankAccountNo = payload.bankAccountNo?.trim();
  const bankAccountName = payload.bankAccountName?.trim();

  if (!name || !username || !password) {
    return NextResponse.json({ message: "Thiếu tên, username hoặc mật khẩu" }, { status: 400 });
  }

  if (!/^[a-z0-9._-]{3,32}$/.test(username)) {
    return NextResponse.json({ message: "Username sau chuẩn hoá cần từ 3-32 ký tự, chỉ gồm a-z, 0-9, '.', '_' hoặc '-'" }, { status: 400 });
  }


  if (role !== "admin" && role !== "member") {
    return NextResponse.json({ message: "Role không hợp lệ" }, { status: 400 });
  }

  const db = await getDb();
  const existing = await db.collection<UserDoc>("users").findOne({ username });
  if (existing) {
    return NextResponse.json({ message: "Username đã tồn tại" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await db.collection<Omit<UserDoc, "_id">>("users").insertOne({
    name,
    username,
    passwordHash,
    role,
    bankBin: bank?.bin ?? "",
    bankName: bank?.shortName ?? "",
    bankAccountNo: bankAccountNo ?? "",
    bankAccountName: bankAccountName ?? name,
    createdAt: new Date()
  });

  return NextResponse.json({ message: `Đã tạo user với username '${username}'`, username }, { status: 201 });
}
