export type SocialPlatform =
  | "INSTAGRAM"
  | "FACEBOOK"
  | "TELEGRAM"
  | "WHATSAPP"
  | "YOUTUBE"
  | "TIKTOK"
  | "WEBSITE";

export const SOCIAL_PLATFORMS: SocialPlatform[] = [
  "INSTAGRAM",
  "FACEBOOK",
  "TELEGRAM",
  "WHATSAPP",
  "YOUTUBE",
  "TIKTOK",
  "WEBSITE",
];

export interface SocialLink {
  id: string;
  platform: SocialPlatform;
  url: string;
  /** Bo'sh bo'lsa platforma nomi ko'rsatiladi. */
  label?: string;
}

export type SocialDisplayMode = "list" | "circle";
