import type { Metadata, Viewport } from "next";
import { SessionProvider } from "@/components/session-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "SplitMates | Quản lý chia tiền nhóm",
  description: "Theo dõi chi tiêu nhóm, tối ưu thanh toán và QR chuyển khoản."
};

export const viewport: Viewport = {
  themeColor: "#050608",
  colorScheme: "dark"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" style={{ colorScheme: "dark" }}>
      <body>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
