import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "أجرلي. إدارة مكتب تأجير السيارات",
    short_name: "أجرلي",
    description: "أجرلي يستبدل دفتر مكتب تأجير السيارات.",
    lang: "ar",
    dir: "rtl",
    start_url: "/app",
    display: "standalone",
    background_color: "#F3F6F5",
    theme_color: "#0B4F4A",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
    ],
  };
}
