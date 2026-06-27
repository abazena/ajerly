import type { Metadata, Viewport } from "next";
import { Tajawal } from "next/font/google";
import "./globals.css";
import ServiceWorker from "@/components/ServiceWorker";

const tajawal = Tajawal({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "700", "800"],
  variable: "--font-tajawal",
  display: "swap",
});

export const metadata: Metadata = {
  title: "أجرلي. إدارة مكتب تأجير السيارات",
  description: "أجرلي يستبدل دفتر مكتب تأجير السيارات: نقدية، سيارات، ديون، وكشوف حساب.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "أجرلي", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0B4F4A",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={tajawal.variable}>
      <body>
        {children}
        <ServiceWorker />
      </body>
    </html>
  );
}
