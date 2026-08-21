import { tenantHttp, getApiErrorMessage } from "@/src/lib/api/http";
import type { AppearanceSettings, ClinicSettings } from "@/src/types/settings.types";

export async function getAppearance(): Promise<AppearanceSettings> {
  try { return (await tenantHttp().get("/api/v1/users/me/settings/appearance")).data; }
  catch (e) { throw new Error(getApiErrorMessage(e, "Tema sozlamalarini yuklab bo'lmadi")); }
}
export async function updateAppearance(payload: Pick<AppearanceSettings,"mode"|"accentType"|"customAccentColor">): Promise<AppearanceSettings> {
  try { return (await tenantHttp().put("/api/v1/users/me/settings/appearance", payload)).data; }
  catch (e) { throw new Error(getApiErrorMessage(e, "Tema sozlamalarini saqlab bo'lmadi")); }
}
export async function getClinicSettings(): Promise<ClinicSettings> {
  try { return (await tenantHttp().get("/api/v1/clinic/settings")).data; }
  catch (e) { throw new Error(getApiErrorMessage(e, "Klinika sozlamalarini yuklab bo'lmadi")); }
}
export async function updateClinicGeneral(timezone: string): Promise<ClinicSettings> {
  try { return (await tenantHttp().put("/api/v1/clinic/settings/general", { timezone })).data; }
  catch (e) { throw new Error(getApiErrorMessage(e, "Vaqt mintaqasini saqlab bo'lmadi")); }
}
export async function updateClinicSms(sms: ClinicSettings["sms"]): Promise<ClinicSettings> {
  try { return (await tenantHttp().put("/api/v1/clinic/settings/sms", sms)).data; }
  catch (e) { throw new Error(getApiErrorMessage(e, "SMS sozlamalarini saqlab bo'lmadi")); }
}
