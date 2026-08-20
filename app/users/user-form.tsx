"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { BANKS } from "@/lib/banks";

export function CreateUserForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    const form = event.currentTarget;
    const formData = new FormData(form);
    const response = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: formData.get("name"),
        username: formData.get("username"),
        password: formData.get("password"),
        role: formData.get("role"),
        bankBin: formData.get("bankBin"),
        bankAccountNo: formData.get("bankAccountNo"),
        bankAccountName: formData.get("bankAccountName")
      })
    });

    setLoading(false);
    const body = (await response.json()) as { message?: string };
    if (!response.ok) {
      setError(body.message ?? "Không tạo được user");
      return;
    }

    form.reset();
    setMessage(body.message ?? "Đã tạo user");
    router.refresh();
  }

  return (
    <form className="panel event-form" onSubmit={handleSubmit}>
      <div>
        <p className="eyebrow">User mới</p>
        <h2>Tạo tài khoản đăng nhập</h2>
      </div>
      <label>
        Tên hiển thị
        <input name="name" required />
      </label>
      <label>
        Username
        <input autoComplete="username" name="username" required spellCheck={false} />
      </label>
      <label>
        Mật khẩu
        <input autoComplete="new-password" name="password" required type="password" />
      </label>
      <label>
        Quyền
        <select defaultValue="member" name="role">
          <option value="member">member - chỉ xem</option>
          <option value="admin">admin - quản trị</option>
        </select>
      </label>
      <div className="bank-section">
        <p className="eyebrow">QR nhận tiền</p>
        <label>
          Ngân hàng
          <select defaultValue="" name="bankBin">
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
          <input name="bankAccountNo" />
        </label>
        <label>
          Tên chủ tài khoản
          <input name="bankAccountName" />
        </label>
      </div>
      {error ? <p className="form-error">{error}</p> : null}
      {message ? <p className="form-success">{message}</p> : null}
      <button className="primary-button" disabled={loading} type="submit">
        {loading ? "Đang tạo…" : "Tạo user"}
      </button>
    </form>
  );
}
