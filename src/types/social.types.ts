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

/**
 * Backend shakli bilan bir xil — faqat `platform` + `url` (custom label
 * yo'q, doim SOCIAL_PLATFORM_LABEL'dan ko'rsatiladi). Bitta platformadan
 * faqat bitta havola bo'lishi mumkin — shuning uchun `platform` ro'yxatda
 * tabiiy unique kalit vazifasini bajaradi (alohida `id` shart emas).
 */
export interface SocialLink {
  platform: SocialPlatform;
  url: string;
}

/**
 * Hozircha faqat frontendda (localStorage) — backend kontraktida
 * displayMode maydoni yo'q, shuning uchun bu haqiqiy tashrif buyuruvchiga
 * TA'SIR QILMAYDI (har bir brauzerda alohida). Backendga qo'shilsa,
 * ommaviy /socials sahifasi shu yerdan emas, klinika profilidan o'qishi
 * kerak bo'ladi.
 */
export type SocialDisplayMode = "list" | "circle";
