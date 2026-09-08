"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, Eye, EyeOff, LockKeyhole, ShieldCheck, UserRound } from "lucide-react";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
    <Card className="login-card">
      <CardHeader className="login-card-header">
        <p className="eyebrow">Chào mừng trở lại</p>
        <CardTitle>Đăng nhập</CardTitle>
        <p className="login-card-description">
          Tiếp tục quản lý các khoản chi và thanh toán của nhóm.
        </p>
      </CardHeader>
      <CardContent className="login-card-content">
        <form className="login-form" onSubmit={handleSubmit}>
          <div className="login-field">
            <Label htmlFor="username">Tên đăng nhập</Label>
            <div className="login-input-wrap">
              <UserRound aria-hidden="true" size={18} />
              <Input
                autoComplete="username"
                id="username"
                name="username"
                placeholder="Nhập tên đăng nhập"
                required
                spellCheck={false}
              />
            </div>
          </div>
          <div className="login-field">
            <Label htmlFor="password">Mật khẩu</Label>
            <div className="login-input-wrap">
              <LockKeyhole aria-hidden="true" size={18} />
              <Input
                autoComplete="current-password"
                id="password"
                name="password"
                placeholder="Nhập mật khẩu"
                required
                type={showPassword ? "text" : "password"}
              />
              <button
                aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                className="password-toggle"
                onClick={() => setShowPassword((visible) => !visible)}
                type="button"
              >
                {showPassword ? <EyeOff aria-hidden="true" size={18} /> : <Eye aria-hidden="true" size={18} />}
              </button>
            </div>
          </div>
          {error ? <p className="form-error" role="alert">{error}</p> : null}
          <Button className="login-submit" disabled={loading} type="submit">
            <span>{loading ? "Đang kiểm tra…" : "Đăng nhập"}</span>
            {!loading ? <ArrowRight aria-hidden="true" size={18} /> : null}
          </Button>
          <p className="login-security-note">
            <ShieldCheck aria-hidden="true" size={16} />
            Phiên đăng nhập của bạn được bảo mật
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
