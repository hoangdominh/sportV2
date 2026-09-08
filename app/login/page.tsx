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
      <div className="login-background" aria-hidden="true">
        <Image
          alt=""
          className="login-background-image"
          fill
          priority
          sizes="100vw"
          src="/hinh_che_doi_no_kheo_18_a2facc4820.jpg"
        />
      </div>

      <section className="login-hero-copy">
        <p className="eyebrow">Chia tiền nhóm</p>
        <h1>Chia tiền,<br />ngại nhắc.</h1>
        <p>Gọn khoản chi. Rõ khoản nợ. Vui trọn cuộc chơi.</p>
      </section>

      <section className="login-form-panel">
        <LoginForm />
      </section>
    </main>
  );
}
