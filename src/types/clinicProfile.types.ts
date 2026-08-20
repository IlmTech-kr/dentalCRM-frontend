import type { SocialLink } from "./social.types";

/**
 * GET/PUT /api/v1/clinic/public-profile (CLINIC_ADMIN)
 * GET /api/public/clinics (autentifikatsiyasiz — /socials sahifasi)
 * Ikkalasi ham bir xil shaklni qaytaradi. Haqiqiy GET javobi:
 * {
 *   "clinicId": "...", "subDomain": "clinic11", "companyName": "Dental uz",
 *   "bio": null, "imageUrl": null, "phoneNumber": null, "email": null,
 *   "socials": [{ "platform": "FACEBOOK", "url": "https://123", "order": 1 }]
 * }
 * — bio/imageUrl/phoneNumber/email hali to'ldirilmagan bo'lsa `null`
 * bo'lib keladi (bo'sh satr emas).
 */
export interface ClinicPublicProfile {
  clinicId?: string;
  subDomain?: string;
  companyName: string;
  bio: string | null;
  imageUrl: string | null;
  phoneNumber: string | null;
  email: string | null;
  socials: SocialLink[];
}
