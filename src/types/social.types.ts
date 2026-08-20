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
 * Backend hozirgi kontrakti — `platform` + `url` + `order` (custom label
 * yo'q, doim SOCIAL_PLATFORM_LABEL'dan ko'rsatiladi). Bitta platformadan
 * faqat bitta havola bo'lishi mumkin — shuning uchun `platform` ro'yxatda
 * tabiiy unique kalit vazifasini bajaradi. `order` — backend qaytaradigan
 * ko'rsatish tartibi (1-dan boshlab); frontend ro'yxatni shu bo'yicha
 * saralaydi va saqlashda joriy tartibga mos ravishda qayta hisoblab
 * yuboradi.
 */
export interface SocialLink {
  platform: SocialPlatform;
  url: string;
  order?: number;

  /**
   * Linktree uslubidagi qayta qurish (Socials → Linktree-style link
   * cards spec, §1) uchun qo'shilgan maydonlar — HALI BACKEND TOMONIDAN
   * SAQLANMAYDI (§1b: PUT faqat platform/url/order'ni qabul qiladi,
   * probe natijalari kelmaguncha). Shu sababli hozircha faqat
   * komponentlarni oldindan shu shaklga moslab yozish uchun bor;
   * settings/socials va public /socials sahifalari hali platform-driven
   * eski mantiqda ishlaydi. Ko'chirish (migration) qoidasi: `platform`
   * bo'lib boshqa maydon yo'q qatorlar uchun
   * title = SOCIAL_PLATFORM_LABEL[platform],
   * color = SOCIAL_PLATFORM_COLOR[platform], icon = platform,
   * id = crypto.randomUUID().
   */
  id?: string;
  title?: string;
  subtitle?: string;
  icon?: SocialIcon;
  color?: string;
}

/**
 * Linktree kartochkasi uchun glif tanlovi — SocialPlatform bilan qisman
 * mos keladi (brend ikonkalari), qolgani umumiy glif (telefon, email,
 * joylashuv, oddiy havola). Bkz. src/features/socials/linkCard.tsx.
 */
export type SocialIcon =
  | "TELEGRAM"
  | "INSTAGRAM"
  | "FACEBOOK"
  | "YOUTUBE"
  | "TIKTOK"
  | "WHATSAPP"
  | "PHONE"
  | "MAIL"
  | "MAP_PIN"
  | "LINK";

/**
 * Sahifa darajasidagi mavzu (fon rangi, ko'rinish rejimi, tasdiqlangan
 * belgi) — HALI BACKEND KONTRAKTIDA YO'Q (§1b), shuning uchun hozircha
 * hech qayerda ishlatilmaydi; backend qo'shilgach klinika profilidan
 * o'qiladigan bo'ladi (bkz. useSocialsStore izohi).
 */
export interface SocialTheme {
  backgroundColor: string;
  displayMode: SocialDisplayMode;
  isVerified: boolean;
}

/**
 * Hozircha faqat frontendda (localStorage) — backend kontraktida
 * displayMode maydoni yo'q, shuning uchun bu haqiqiy tashrif buyuruvchiga
 * TA'SIR QILMAYDI (har bir brauzerda alohida). Backendga qo'shilsa,
 * ommaviy /socials sahifasi shu yerdan emas, klinika profilidan o'qishi
 * kerak bo'ladi.
 */
export type SocialDisplayMode = "list" | "circle";
