"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
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
}

export function UserBankForm({ userId, bankBin = "", bankAccountNo = "", bankAccountName = "" }: UserBankFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [selectedBankBin, setSelectedBankBin] = useState(bankBin);

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
        bankAccountName: formData.get("bankAccountName")
      })
    });
    const body = (await response.json().catch(() => ({}))) as { message?: string };
    setLoading(false);

    if (!response.ok) {
      setError(body.message ?? "Không cập nhật được QR");
      return;
    }

    setMessage(body.message ?? "Đã cập nhật QR");
    router.refresh();
  }

  return (
    <form className="grid gap-3 lg:grid-cols-4" onSubmit={handleSubmit}>
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
      <div className="grid content-end gap-2">
        <Button disabled={loading} type="submit" variant="outline">
          {loading ? "Đang lưu…" : "Lưu QR"}
        </Button>
      </div>
      {error ? <span className="form-error lg:col-span-4" aria-live="polite">{error}</span> : null}
      {message ? <span className="form-success lg:col-span-4" aria-live="polite">{message}</span> : null}
    </form>
  );
}
