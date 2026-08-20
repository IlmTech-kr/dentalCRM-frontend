import { Link as LinkIcon, Mail, MapPin, Phone } from "lucide-react";
import type { SocialIcon, SocialPlatform } from "@/src/types/social.types";
import { PlatformIcon } from "./platformConfig";

/**
 * Linktree uslubidagi karta dizayni (Socials → Linktree-style link cards
 * spec) uchun — icon registry, taklif etilgan palitra va fon rangiga
 * qarab matn rangini tanlash. Bu fayl HALI qaysi joyda ham ishlatilmaydi:
 * backend kontrakti (title/subtitle/color/icon) hali yo'q (bkz.
 * social.types.ts dagi SocialLink izohi) — shuning uchun bu shunchaki
 * tayyorlab qo'yilgan qurilish bloki, settings/socials va public
 * /socials sahifalari hali eski platform-driven render'ni ishlatadi.
 */

const BRAND_ICON_PLATFORMS = new Set<SocialIcon>([
  "TELEGRAM",
  "INSTAGRAM",
  "FACEBOOK",
  "YOUTUBE",
  "TIKTOK",
  "WHATSAPP",
]);

/** `icon` — SocialPlatform bilan mos keladigan brend glifi bo'lsa PlatformIcon'dan, aks holda umumiy lucide glifidan foydalanadi. */
export function LinkCardIcon({ icon, size = 20 }: { icon: SocialIcon; size?: number }) {
  if (BRAND_ICON_PLATFORMS.has(icon)) {
    // SocialIcon va SocialPlatform shu olti qiymatda bir xil satr — xavfsiz cast.
    return <PlatformIcon platform={icon as SocialPlatform} size={size} />;
  }

  switch (icon) {
    case "PHONE":
      return <Phone size={size} aria-hidden="true" />;
    case "MAIL":
      return <Mail size={size} aria-hidden="true" />;
    case "MAP_PIN":
      return <MapPin size={size} aria-hidden="true" />;
    case "LINK":
    default:
      return <LinkIcon size={size} aria-hidden="true" />;
  }
}

/** Taklif etilgan karta ranglari (spec §4) — sahifa foni #E0711E bilan sinab ko'rilgan. */
export const LINK_CARD_COLOR_PRESETS: { name: string; hex: string }[] = [
  { name: "Blue", hex: "#5A94CB" },
  { name: "Green", hex: "#5AA553" },
  { name: "Cream", hex: "#F6EFE6" },
  { name: "Teal", hex: "#5F9E9A" },
  { name: "Purple", hex: "#6C5085" },
  { name: "Near-black", hex: "#212020" },
];

export const DEFAULT_PAGE_BACKGROUND = "#E0711E";

/**
 * Fon rangining nisbiy yorqinligidan (relative luminance) kelib chiqib,
 * qora yoki oq matn — qaysi biri o'qilishi osonroq bo'lsa — tanlanadi.
 * Masalan Cream (#F6EFE6) fonida qora matn, qolgan (to'qroq) fonlarda oq.
 */
export function readableTextColor(hex: string): string {
  const clean = hex.replace("#", "");
  const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return "#FFFFFF";

  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? "#1A1A1A" : "#FFFFFF";
}
