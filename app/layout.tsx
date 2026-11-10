import type { Metadata, Viewport } from "next";
import { SessionProvider } from "@/components/session-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sổ Sân — Quỹ đội",
  description: "Ghi chi phí, chia quỹ và chốt khoản chuyển sau mỗi buổi chơi."
};

export const viewport: Viewport = {
  themeColor: "#f1f1f1",
  colorScheme: "light"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" style={{ colorScheme: "light" }}>
      <body className="relative">
        <div className="relative z-10">
          <SessionProvider>{children}</SessionProvider>
        </div>
      </body>
    </html>
  );
}
