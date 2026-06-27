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

const TITLE = "أجرلي. إدارة مكتب تأجير السيارات";
const DESCRIPTION =
  "أجرلي يستبدل دفتر مكتب تأجير السيارات. نقديتك، تسديد سياراتك، وديون شركاتك في مكان واحد.";

export const metadata: Metadata = {
  metadataBase: new URL("https://ajer.ly"),
  title: TITLE,
  description: DESCRIPTION,
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "أجرلي", statusBarStyle: "default" },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: { url: "/icons/icon-180.png", sizes: "180x180" },
  },
  openGraph: {
    type: "website",
    url: "https://ajer.ly",
    siteName: "أجرلي",
    locale: "ar_LY",
    title: TITLE,
    description: DESCRIPTION,
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "أجرلي" }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/og.png"],
  },
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
