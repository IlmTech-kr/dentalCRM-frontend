import { mainHttp } from "@/src/lib/api/http";
import { ENDPOINTS } from "@/src/lib/api/endpoints";

export type MarketingLeadStatus = "NEW" | "CONTACTED" | "CLOSED";

export interface MarketingLead {
  id: string;
  name: string;
  phone: string;
  status: MarketingLeadStatus;
  visitorId: string | null;
  sourcePath: string | null;
  locale: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MarketingLeadPage {
  items: MarketingLead[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface MarketingMonthlyStats {
  month: string;
  uniqueVisitors: number;
  pageViews: number;
  leads: number;
  conversionRate: number;
}

export interface MarketingStatistics {
  summary: Omit<MarketingMonthlyStats, "month">;
  monthly: MarketingMonthlyStats[];
}

export async function getMarketingStatistics(fromMonth: string, toMonth: string) {
  const { data } = await mainHttp.get<MarketingStatistics>(ENDPOINTS.marketing.statistics, {
    params: { fromMonth, toMonth },
  });
  return data;
}

export async function getMarketingLeads(params: {
  page: number;
  limit: number;
  status?: MarketingLeadStatus;
}): Promise<MarketingLeadPage> {
  const { data } = await mainHttp.get<MarketingLeadPage>(ENDPOINTS.marketing.leads, { params });
  return data;
}

export async function updateMarketingLeadStatus(id: string, status: MarketingLeadStatus) {
  const { data } = await mainHttp.patch<MarketingLead>(ENDPOINTS.marketing.leadStatus(id), { status });
  return data;
}
