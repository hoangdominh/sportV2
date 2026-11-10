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
      <section className="login-brand-panel">
        <Image
          alt="Minh họa vui nhắc nhau chia tiền sau buổi chơi"
          className="login-brand-image"
          fill
          priority
          sizes="(max-width: 600px) 100vw, 58vw"
          src="/hinh_che_doi_no_kheo_18_a2facc4820.jpg"
        />
        <div className="login-brand-lockup">
          <span className="site-brand-mark" aria-hidden="true">S</span>
          <span><strong>SỔ SÂN</strong><small>QUỸ ĐỘI · MÙA NÀY</small></span>
        </div>
        <p className="login-brand-caption">Chơi hết mình. Chia tiền rõ ràng.</p>
      </section>
      <section className="login-form-panel">
        <LoginForm />
      </section>
    </main>
  );
}
