"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const formData = new FormData(event.currentTarget);
    const result = await signIn("credentials", {
      username: formData.get("username"),
      password: formData.get("password"),
      redirect: false
    });
    setLoading(false);

    if (result?.error) {
      setError("Sai tài khoản hoặc mật khẩu");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <Card className="self-center border-border bg-slate-900/75 shadow-2xl backdrop-blur-xl">
      <CardHeader>
        <p className="eyebrow">Đăng nhập</p>
        <CardTitle>Vào bảng chia tiền</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4" onSubmit={handleSubmit}>
          <div className="grid gap-2">
            <Label>Tên đăng nhập</Label>
            <Input autoComplete="username" name="username" required spellCheck={false} />
          </div>
          <div className="grid gap-2">
            <Label>Mật khẩu</Label>
            <Input autoComplete="current-password" name="password" required type="password" />
          </div>
          {error ? <p className="form-error">{error}</p> : null}
          <Button disabled={loading} type="submit">
            {loading ? "Đang kiểm tra…" : "Đăng nhập"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
