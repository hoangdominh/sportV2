import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  const session = await getServerSession(authOptions);
  if (session) redirect("/dashboard");

  return (
    <main className="login-shell">
      <section className="brand-panel">
        <p className="eyebrow">SplitMates</p>
        <h1>Chia tiền nhóm gọn như một lượt chạm.</h1>
        <p>
          Ghi nhận ai đã ứng tiền, tự động cân bằng nợ và tạo QR chuyển khoản cho từng giao dịch.
        </p>
      </section>
      <LoginForm />
    </main>
  );
}
