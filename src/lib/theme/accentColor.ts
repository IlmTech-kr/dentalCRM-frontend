export interface AccentPreset {
  name: string;
  value: string;
}

export const ACCENT_PRESETS: AccentPreset[] = [
  { name: "Blue", value: "#3ba5f6" },
  { name: "Indigo", value: "#6366f1" },
  { name: "Violet", value: "#8b5cf6" },
  { name: "Emerald", value: "#10b981" },
  { name: "Teal", value: "#14b8a6" },
  { name: "Rose", value: "#f43f5e" },
  { name: "Amber", value: "#f59e0b" },
  { name: "Slate", value: "#475569" },
];

export const DEFAULT_ACCENT_COLOR = ACCENT_PRESETS[0].value;

const HEX_PATTERN = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

export function isValidHexColor(value: string): value is string {
  return HEX_PATTERN.test(value);
}

function normalizeHex(hex: string): string {
  const clean = hex.replace("#", "");
  return clean.length === 3
    ? clean.split("").map((c) => c + c).join("")
    : clean;
}

/** amount 0..1 — 0.14 ≈ Tailwind bir "shade" qorong'iroq */
export function darkenHex(hex: string, amount = 0.14): string {
  if (!isValidHexColor(hex)) return hex;

  const normalized = normalizeHex(hex);
  const num = parseInt(normalized, 16);
  const factor = 1 - amount;

  const r = Math.round(((num >> 16) & 255) * factor);
  const g = Math.round(((num >> 8) & 255) * factor);
  const b = Math.round((num & 255) * factor);

  return (
    "#" +
    [r, g, b]
      .map((v) => Math.max(0, Math.min(255, v)).toString(16).padStart(2, "0"))
      .join("")
  );
}

function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const normalized = normalizeHex(hex);
  const num = parseInt(normalized, 16);
  const r = ((num >> 16) & 255) / 255;
  const g = ((num >> 8) & 255) / 255;
  const b = (num & 255) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      default:
        h = ((r - g) / d + 4) / 6;
    }
  }

  return { h, s, l };
}

function hslToHex(h: number, s: number, l: number): string {
  const hue2rgb = (p: number, q: number, t: number) => {
    let tt = t;
    if (tt < 0) tt += 1;
    if (tt > 1) tt -= 1;
    if (tt < 1 / 6) return p + (q - p) * 6 * tt;
    if (tt < 1 / 2) return q;
    if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
    return p;
  };

  let r: number;
  let g: number;
  let b: number;

  if (s === 0) {
    r = g = b = l;
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  const toHex = (v: number) => Math.round(v * 255).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

const MAX_ACCENT_LIGHTNESS = 0.68;
const NEUTRAL_FALLBACK = "#334155"; // slate-700

/**
 * text-primary-blue oq fonlarda va bg-primary-blue ustidagi oq matn
 * ko'plab joyda ishlatiladi — juda och rang (masalan oq yoki kulrang)
 * tanlansa, ular ko'rinmay qoladi. Shuning uchun tanlangan rang doim
 * "ishlatsa bo'ladigan" darajaga tushiriladi:
 * - deyarli rangsiz + och (oq, kulrang) -> neytral to'q slate rangga
 * - boshqa juda och ranglar -> saturatsiya saqlanib, yorqinlik pasaytiriladi
 */
export function ensureUsableAccent(hex: string): string {
  if (!isValidHexColor(hex)) return hex;

  const { h, s, l } = hexToHsl(hex);

  if (s < 0.12) {
    return l > 0.5 ? NEUTRAL_FALLBACK : hex;
  }

  if (l <= MAX_ACCENT_LIGHTNESS) return hex;
  return hslToHex(h, s, MAX_ACCENT_LIGHTNESS);
}
