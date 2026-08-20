"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
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
        bankBin: formData.get("bankBin"),
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
    <form className="bank-form" onSubmit={handleSubmit}>
      <label>
        Ngân hàng
        <select defaultValue={bankBin} name="bankBin">
          <option value="">Chưa chọn</option>
          {BANKS.map((bank) => (
            <option key={bank.bin} value={bank.bin}>
              {bank.shortName} - {bank.bin}
            </option>
          ))}
        </select>
      </label>
      <label>
        Số tài khoản
        <input defaultValue={bankAccountNo} name="bankAccountNo" />
      </label>
      <label>
        Tên chủ tài khoản
        <input defaultValue={bankAccountName} name="bankAccountName" />
      </label>
      <button className="small-button" disabled={loading} type="submit">
        {loading ? "Đang lưu…" : "Lưu QR"}
      </button>
      {error ? <span className="form-error" aria-live="polite">{error}</span> : null}
      {message ? <span className="form-success" aria-live="polite">{message}</span> : null}
    </form>
  );
}
