"use client";

import { useMemo, useState } from "react";
import { BarChart3, Eye, Percent, Users, UserRound } from "lucide-react";
import DentalLoader from "@/src/components/ui/DentalLoader";
import { useMarketingLeads, useMarketingStatistics, useUpdateMarketingLeadStatus } from "@/src/features/superadmin/marketing/UseMarketingAdmin";
import type { MarketingLeadStatus } from "@/src/features/superadmin/marketing/marketing.admin.service";

const STATUSES: MarketingLeadStatus[] = ["NEW", "CONTACTED", "CLOSED"];

function monthValue(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function formatDate(value: string) {
  return new Date(value).toLocaleString("uz-UZ", { dateStyle: "medium", timeStyle: "short" });
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("uz-UZ").format(value);
}

export default function MarketingLeadsPage() {
  const now = useMemo(() => new Date(), []);
  const [fromMonth, setFromMonth] = useState(monthValue(new Date(now.getFullYear(), now.getMonth() - 5, 1)));
  const [toMonth, setToMonth] = useState(monthValue(now));
  const [status, setStatus] = useState<MarketingLeadStatus | undefined>();
  const statistics = useMarketingStatistics(fromMonth, toMonth);
  const leads = useMarketingLeads(status);
  const updateStatus = useUpdateMarketingLeadStatus();
  const summary = statistics.data?.summary;

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="flex flex-wrap items-end gap-3 rounded-3xl border border-border-color bg-white p-4 shadow-sm sm:p-6">
        <label className="text-xs font-bold uppercase text-slate-500">Dan boshlanishi<input type="month" value={fromMonth} onChange={(event) => setFromMonth(event.target.value)} className="mt-1 block h-10 rounded-xl border border-border-color bg-slate-50 px-3 text-sm" /></label>
        <label className="text-xs font-bold uppercase text-slate-500">Dan tugashi<input type="month" value={toMonth} onChange={(event) => setToMonth(event.target.value)} className="mt-1 block h-10 rounded-xl border border-border-color bg-slate-50 px-3 text-sm" /></label>
        <label className="text-xs font-bold uppercase text-slate-500">Lead status<select value={status ?? "ALL"} onChange={(event) => setStatus(event.target.value === "ALL" ? undefined : event.target.value as MarketingLeadStatus)} className="mt-1 block h-10 rounded-xl border border-border-color bg-slate-50 px-3 text-sm"><option value="ALL">Barchasi</option>{STATUSES.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
      </div>

      {statistics.isLoading ? <DentalLoader fullScreen={false} text="Yuklanmoqda..." /> : statistics.isError ? <p className="rounded-2xl bg-red-50 p-5 text-sm text-red-600">Marketing statistikasini yuklab bo‘lmadi.</p> : (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Metric icon={Users} label="Unique visitor" value={formatNumber(summary?.uniqueVisitors ?? 0)} />
          <Metric icon={Eye} label="Page views" value={formatNumber(summary?.pageViews ?? 0)} />
          <Metric icon={UserRound} label="Leadlar" value={formatNumber(summary?.leads ?? 0)} />
          <Metric icon={Percent} label="Conversion" value={`${summary?.conversionRate ?? 0}%`} />
        </div>
      )}

      {statistics.data?.monthly.length ? <div className="overflow-x-auto rounded-3xl border border-border-color bg-white shadow-sm"><div className="flex min-w-[620px] items-end gap-3 p-5 sm:p-6">{statistics.data.monthly.map((item) => { const max = Math.max(1, ...statistics.data!.monthly.map((month) => month.uniqueVisitors)); return <div key={item.month} className="flex min-w-20 flex-1 flex-col items-center gap-2"><div className="flex h-32 w-full items-end justify-center rounded-xl bg-slate-50"><div className="w-8 rounded-t-lg bg-gradient-to-t from-sky-500 via-violet-600 to-rose-500" style={{ height: `${Math.max(8, item.uniqueVisitors / max * 100)}%` }} title={`${item.uniqueVisitors} visitor`} /></div><span className="text-xs font-bold text-slate-500">{item.month}</span><span className="text-xs text-slate-400">{item.leads} lead</span></div>; })}</div></div> : null}

      <div className="overflow-hidden rounded-3xl border border-border-color bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-border-color px-4 py-4 sm:px-6"><BarChart3 size={18} className="text-violet-600" /><h2 className="font-bold text-dark-navy">Marketing leadlar</h2></div>
        {leads.isLoading ? <div className="p-8"><DentalLoader fullScreen={false} text="Yuklanmoqda..." /></div> : leads.isError ? <p className="p-8 text-center text-sm text-red-500">Leadlarni yuklab bo‘lmadi.</p> : !leads.data?.items.length ? <p className="p-8 text-center text-sm text-slate-400">Leadlar topilmadi.</p> : <div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left text-sm"><thead><tr className="border-b border-border-color text-xs uppercase text-slate-400"><th className="px-5 py-3">Ism</th><th className="px-5 py-3">Telefon</th><th className="px-5 py-3">Manba</th><th className="px-5 py-3">Sana</th><th className="px-5 py-3">Status</th></tr></thead><tbody>{leads.data.items.map((lead) => <tr key={lead.id} className="border-b border-slate-50 last:border-0"><td className="px-5 py-4 font-semibold text-dark-navy">{lead.name}</td><td className="px-5 py-4 text-slate-600">{lead.phone}</td><td className="px-5 py-4 text-slate-500">{lead.sourcePath ?? "—"}</td><td className="px-5 py-4 whitespace-nowrap text-slate-500">{formatDate(lead.createdAt)}</td><td className="px-5 py-4"><select value={lead.status} disabled={updateStatus.isPending} onChange={(event) => updateStatus.mutate({ id: lead.id, status: event.target.value as MarketingLeadStatus })} className="rounded-lg border border-border-color bg-slate-50 px-2 py-1.5 text-xs font-bold"><option value="NEW">NEW</option><option value="CONTACTED">CONTACTED</option><option value="CLOSED">CLOSED</option></select></td></tr>)}</tbody></table></div>}
      </div>
    </div>
  );
}

function Metric({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: string }) {
  return <div className="rounded-3xl border border-border-color bg-white p-4 shadow-sm sm:p-5"><Icon size={18} className="text-violet-600" /><p className="mt-3 text-xs font-bold uppercase text-slate-400">{label}</p><p className="mt-1 text-xl font-extrabold text-dark-navy sm:text-2xl">{value}</p></div>;
}
