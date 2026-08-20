"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

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
    <form className="login-card" onSubmit={handleSubmit}>
      <div>
        <p className="eyebrow">Đăng nhập</p>
        <h2>Vào bảng chia tiền</h2>
      </div>
      <label>
        Tên đăng nhập
        <input autoComplete="username" name="username" required spellCheck={false} />
      </label>
      <label>
        Mật khẩu
        <input autoComplete="current-password" name="password" required type="password" />
      </label>
      {error ? <p className="form-error">{error}</p> : null}
      <button className="primary-button" disabled={loading} type="submit">
        {loading ? "Đang kiểm tra…" : "Đăng nhập"}
      </button>
    </form>
  );
}
