import { randomInt } from "node:crypto";

// Avoid ambiguous chars (0/O, 1/I/L).
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const GROUP = 4;
const GROUPS = 3;

export function generateCode(): string {
  const parts: string[] = [];
  for (let g = 0; g < GROUPS; g++) {
    let p = "";
    for (let i = 0; i < GROUP; i++) {
      p += ALPHABET[randomInt(0, ALPHABET.length)];
    }
    parts.push(p);
  }
  return parts.join("-");
}

export function normalize(code: string): string {
  return code.replace(/\s+/g, "").replace(/[-_]/g, "").toUpperCase();
}

// Re-format a 12-char code into XXXX-XXXX-XXXX.
export function format(raw: string): string {
  const s = normalize(raw);
  if (s.length !== GROUP * GROUPS) return s;
  return [s.slice(0, 4), s.slice(4, 8), s.slice(8, 12)].join("-");
}
