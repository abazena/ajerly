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
      { src: "/logos/ajerly-icon.png", sizes: "269x250", type: "image/png", purpose: "any" },
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      // ponytail: add 192/512 maskable PNG variants before App Store / Play submission.
    ],
  };
}
