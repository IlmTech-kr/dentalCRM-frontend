import type { SocialLink } from "./social.types";

/**
 * GET/PUT /api/v1/clinic/public-profile (CLINIC_ADMIN)
 * GET /api/public/clinics (autentifikatsiyasiz — /socials sahifasi)
 * Ikkalasi ham bir xil shaklni qaytaradi.
 */
export interface ClinicPublicProfile {
  companyName: string;
  bio: string;
  imageUrl: string;
  phoneNumber: string;
  email: string;
  socials: SocialLink[];
}
