// One-shot. `node scripts/gen-icons.mjs` regenerates PWA icons + favicon.ico
// from the brand PNG onto a brand-teal square canvas. Output sizes are what
// Chrome installability + iOS apple-touch + browser tabs want. Commit the output.
import sharp from "sharp";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const SRC = resolve(here, "../public/logos/ajerly-icon.png");
const OUT_DIR = resolve(here, "../public/icons");
const FAVICON = resolve(here, "../app/favicon.ico");
const BRAND = { r: 11, g: 79, b: 74, alpha: 1 }; // #0B4F4A

mkdirSync(OUT_DIR, { recursive: true });

const onBrandSquare = async (size, paddingPct = 0.28) => {
  const inner = Math.round(size * (1 - paddingPct));
  const logo = await sharp(SRC)
    .resize(inner, inner, { fit: "inside", kernel: "lanczos3" })
    .toBuffer();
  return sharp({
    create: { width: size, height: size, channels: 4, background: BRAND },
  })
    .composite([{ input: logo, gravity: "center" }])
    .png({ compressionLevel: 9 })
    .toBuffer();
};

// PWA + apple-touch
for (const size of [192, 512, 180]) {
  const buf = await onBrandSquare(size);
  writeFileSync(resolve(OUT_DIR, `icon-${size}.png`), buf);
  console.log(`wrote icon-${size}.png`);
}

// favicon.ico: 16/32/48 PNGs packed into a single ICO. Tiny sizes need less
// padding to stay legible in browser tabs.
const FAV_SIZES = [16, 32, 48];
const pngs = await Promise.all(
  FAV_SIZES.map((s) => onBrandSquare(s, s <= 32 ? 0.10 : 0.18))
);

const headerSize = 6 + 16 * pngs.length;
let offset = headerSize;
const dirEntries = pngs.map((png, i) => {
  const size = FAV_SIZES[i];
  const entry = Buffer.alloc(16);
  entry.writeUInt8(size === 256 ? 0 : size, 0); // width
  entry.writeUInt8(size === 256 ? 0 : size, 1); // height
  entry.writeUInt8(0, 2);                       // palette
  entry.writeUInt8(0, 3);                       // reserved
  entry.writeUInt16LE(1, 4);                    // planes
  entry.writeUInt16LE(32, 6);                   // bpp
  entry.writeUInt32LE(png.length, 8);           // bytes
  entry.writeUInt32LE(offset, 12);              // offset
  offset += png.length;
  return entry;
});

const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0); // reserved
header.writeUInt16LE(1, 2); // type=ICO
header.writeUInt16LE(pngs.length, 4);

writeFileSync(FAVICON, Buffer.concat([header, ...dirEntries, ...pngs]));
console.log(`wrote favicon.ico (${pngs.length} sizes: ${FAV_SIZES.join("/")})`);

// og.png: 1200x630 share card. Brand surface (cream) + wide logo + tagline.
// Cream bg is chosen because the brand logo is dark-on-light by design; on
// brand teal it disappears. Used by WhatsApp/iMessage/Twitter/FB on share.
const WIDE = resolve(here, "../public/logos/ajerly-ver-logo.png");
const OG = resolve(here, "../public/og.png");
const OG_W = 1200, OG_H = 630;
const OG_BG = { r: 243, g: 246, b: 245, alpha: 1 }; // #F3F6F5 (--app-bg)
const LOGO_W = 760;

const wideMeta = await sharp(WIDE).metadata();
const LOGO_H = Math.round(LOGO_W * (wideMeta.height / wideMeta.width));
const logoBuf = await sharp(WIDE)
  .resize(LOGO_W, LOGO_H, { fit: "inside", kernel: "lanczos3" })
  .toBuffer();

const tagline = Buffer.from(`
<svg width="${OG_W}" height="180" xmlns="http://www.w3.org/2000/svg">
  <line x1="540" y1="30" x2="660" y2="30" stroke="#0B4F4A" stroke-width="2" stroke-linecap="round" opacity="0.35"/>
  <text x="${OG_W / 2}" y="110" text-anchor="middle"
        font-family="Tajawal, Tahoma, 'Segoe UI', Arial, sans-serif"
        font-size="40" font-weight="500" fill="#13201D">
    إدارة مكتب تأجير السيارات
  </text>
</svg>`);

await sharp({ create: { width: OG_W, height: OG_H, channels: 4, background: OG_BG } })
  .composite([
    { input: logoBuf, left: Math.round((OG_W - LOGO_W) / 2), top: Math.round(OG_H / 2 - LOGO_H - 10) },
    { input: tagline, left: 0, top: Math.round(OG_H / 2 + 20) },
  ])
  .png({ compressionLevel: 9 })
  .toFile(OG);
console.log(`wrote og.png (${OG_W}x${OG_H})`);
