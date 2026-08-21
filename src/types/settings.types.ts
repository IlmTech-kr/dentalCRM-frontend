export type ThemeMode = "SYSTEM" | "LIGHT" | "DARK";
export type AccentType = "DEFAULT" | "CUSTOM";

export interface AppearanceSettings {
  mode: ThemeMode;
  accentType: AccentType;
  customAccentColor: string | null;
  effectiveAccentColor: string;
}
export interface SmsEventSettings { enabled: boolean; template: string; }
export interface QuietHoursSettings { enabled: boolean; start: string; end: string; }
export interface ReminderRuleSettings { ruleId?: string | null; enabled: boolean; leadTimeMinutes: number; template: string; }
export interface ClinicSettings {
  timezone: string;
  sms: { enabled: boolean; quietHours: QuietHoursSettings; appointmentCreated: SmsEventSettings;
    paymentReceived: SmsEventSettings; appointmentReminders: ReminderRuleSettings[]; };
}
