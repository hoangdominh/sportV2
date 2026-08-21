"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BANKS } from "@/lib/banks";

export function CreateUserForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [role, setRole] = useState("member");
  const [bankBin, setBankBin] = useState("");

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
        role,
        bankBin,
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
    setRole("member");
    setBankBin("");
    setMessage(body.message ?? "Đã tạo user");
    router.refresh();
  }

  return (
    <Card className="border-border bg-slate-900/65 shadow-xl backdrop-blur-xl">
      <CardHeader>
        <p className="eyebrow">User mới</p>
        <CardTitle>Tạo tài khoản đăng nhập</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4" onSubmit={handleSubmit}>
          <div className="grid gap-2">
            <Label>Tên hiển thị</Label>
            <Input name="name" required />
          </div>
          <div className="grid gap-2">
            <Label>Username</Label>
            <Input autoComplete="username" name="username" required spellCheck={false} />
          </div>
          <div className="grid gap-2">
            <Label>Mật khẩu</Label>
            <Input autoComplete="new-password" name="password" required type="password" />
          </div>
          <div className="grid gap-2">
            <Label>Quyền</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="member">member - chỉ xem</SelectItem>
                <SelectItem value="admin">admin - quản trị</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-4 border-t border-border pt-4">
            <p className="eyebrow">QR nhận tiền</p>
            <div className="grid gap-2">
              <Label>Ngân hàng</Label>
              <Select value={bankBin || "none"} onValueChange={(value) => setBankBin(value === "none" ? "" : value)}>
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
              <Input name="bankAccountNo" />
            </div>
            <div className="grid gap-2">
              <Label>Tên chủ tài khoản</Label>
              <Input name="bankAccountName" />
            </div>
          </div>
          {error ? <p className="form-error">{error}</p> : null}
          {message ? <p className="form-success">{message}</p> : null}
          <Button disabled={loading} type="submit">
            {loading ? "Đang tạo…" : "Tạo user"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
