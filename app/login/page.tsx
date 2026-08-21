import Image from "next/image";
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
        <div className="brand-panel-illustration" aria-hidden="true">
          <Image
            alt=""
            className="brand-panel-image"
            fill
            priority
            sizes="(min-width: 1024px) 55vw, 100vw"
            src="/hinh_che_doi_no_kheo_18_a2facc4820.jpg"
          />
        </div>
        <div className="brand-panel-copy">
          <p className="eyebrow">SplitMates</p>
          <h1>Trả tiền nhanhhh !!!!</h1>
          <p>
            Ghi nhận ai đã ứng tiền, tự động cân bằng nợ và tạo QR chuyển khoản cho từng giao dịch.
          </p>
        </div>
      </section>
      <LoginForm />
    </main>
  );
}
