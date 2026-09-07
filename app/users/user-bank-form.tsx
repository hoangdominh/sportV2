"use client";

import { useRouter } from "next/navigation";
import { FormEvent, type ReactNode, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BANKS } from "@/lib/banks";

interface UserBankFormProps {
  userId: string;
  bankBin?: string;
  bankAccountNo?: string;
  bankAccountName?: string;
  children?: ReactNode;
  role: "admin" | "member";
}

export function UserBankForm({ children, userId, role, bankBin = "", bankAccountNo = "", bankAccountName = "" }: UserBankFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [selectedBankBin, setSelectedBankBin] = useState(bankBin);
  const [selectedRole, setSelectedRole] = useState(role);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    const formData = new FormData(event.currentTarget);
    const response = await fetch(`/api/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bankBin: selectedBankBin,
        bankAccountNo: formData.get("bankAccountNo"),
        bankAccountName: formData.get("bankAccountName"),
        role: selectedRole
      })
    });
    const body = (await response.json().catch(() => ({}))) as { message?: string };
    setLoading(false);

    if (!response.ok) {
      setError(body.message ?? "Không cập nhật được thông tin user");
      return;
    }

    setMessage(body.message ?? "Đã cập nhật thông tin user");
    router.refresh();
  }

  return (
    <form className="grid gap-3" onSubmit={handleSubmit}>
      <div className="bank-form">
        <div className="grid gap-2">
          <Label>Ngân hàng</Label>
          <Select value={selectedBankBin || "none"} onValueChange={(value) => setSelectedBankBin(value === "none" ? "" : value)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Chưa chọn</SelectItem>
              {BANKS.map((bank) => (
                <SelectItem key={bank.bin} value={bank.bin}>{bank.shortName} - {bank.bin}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label>Số tài khoản</Label>
          <Input defaultValue={bankAccountNo} name="bankAccountNo" />
        </div>
        <div className="grid gap-2">
          <Label>Tên chủ tài khoản</Label>
          <Input defaultValue={bankAccountName} name="bankAccountName" />
        </div>
        <div className="grid gap-2">
          <Label>Vai trò tài khoản</Label>
          <Select value={selectedRole} onValueChange={(value) => setSelectedRole(value as "admin" | "member")}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="member">Member - chỉ xem</SelectItem>
              <SelectItem value="admin">Admin - quản trị</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="user-action-row">
        <Button disabled={loading} type="submit" size="sm">
          {loading ? "Đang lưu…" : "Lưu thông tin"}
        </Button>
        {children}
      </div>
      {error ? <span className="form-error" aria-live="polite">{error}</span> : null}
    </form>
  );
}
