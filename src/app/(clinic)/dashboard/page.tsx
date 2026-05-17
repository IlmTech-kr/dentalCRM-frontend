import {
  CalendarDays,
  Stethoscope,
  Users,
  Wallet,
} from "lucide-react";

const stats = [
  {
    title: "Total Patients",
    value: "1,248",
    icon: Users,
    note: "+12% this month",
  },
  {
    title: "Doctors",
    value: "24",
    icon: Stethoscope,
    note: "Active doctors",
  },
  {
    title: "Appointments",
    value: "86",
    icon: CalendarDays,
    note: "Today",
  },
  {
    title: "Revenue",
    value: "$12,450",
    icon: Wallet,
    note: "+8% this week",
  },
];

const appointments = [
  {
    patient: "Ali Karimov",
    doctor: "Dr. Aziz",
    time: "09:30",
    status: "Confirmed",
  },
  {
    patient: "Madina Sobirova",
    doctor: "Dr. Malika",
    time: "10:15",
    status: "Pending",
  },
  {
    patient: "Jasur Rahimov",
    doctor: "Dr. Aziz",
    time: "11:00",
    status: "Confirmed",
  },
];

export default function DashboardPage() {
  return (
    <div>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.title}
              className="rounded-3xl border border-border-color bg-white p-6 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-soft-blue text-primary-blue">
                  <Icon size={24} />
                </div>

                <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-500">
                  Live
                </span>
              </div>

              <p className="mt-5 text-sm font-semibold text-text-light">
                {item.title}
              </p>

              <h3 className="mt-2 text-3xl font-extrabold text-dark-navy">
                {item.value}
              </h3>

              <p className="mt-2 text-sm text-text-light">{item.note}</p>
            </div>
          );
        })}
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-[2fr_1fr]">
        <section className="rounded-3xl border border-border-color bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-xl font-extrabold text-dark-navy">
              Today&apos;s Appointments
            </h3>

            <button className="rounded-2xl bg-primary-blue px-4 py-2 text-sm font-bold text-white">
              View All
            </button>
          </div>

          <div className="overflow-hidden rounded-2xl border border-border-color">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-5 py-4">Patient</th>
                  <th className="px-5 py-4">Doctor</th>
                  <th className="px-5 py-4">Time</th>
                  <th className="px-5 py-4">Status</th>
                </tr>
              </thead>

              <tbody>
                {appointments.map((item) => (
                  <tr key={item.patient} className="border-t border-border-color">
                    <td className="px-5 py-4 font-bold text-dark-navy">
                      {item.patient}
                    </td>
                    <td className="px-5 py-4 text-slate-600">{item.doctor}</td>
                    <td className="px-5 py-4 text-slate-600">{item.time}</td>
                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${
                          item.status === "Confirmed"
                            ? "bg-green-50 text-green-500"
                            : "bg-yellow-50 text-yellow-500"
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-3xl border border-border-color bg-white p-6 shadow-sm">
          <h3 className="text-xl font-extrabold text-dark-navy">
            Clinic Activity
          </h3>

          <div className="mt-6 space-y-5">
            <ActivityItem title="New patient registered" time="10 min ago" />
            <ActivityItem title="Appointment confirmed" time="25 min ago" />
            <ActivityItem title="Doctor schedule updated" time="1 hour ago" />
            <ActivityItem title="Payment completed" time="2 hours ago" />
          </div>
        </section>
      </div>
    </div>
  );
}

function ActivityItem({
  title,
  time,
}: {
  title: string;
  time: string;
}) {
  return (
    <div className="flex gap-3">
      <div className="mt-1 h-3 w-3 rounded-full bg-primary-blue" />
      <div>
        <p className="font-bold text-dark-navy">{title}</p>
        <p className="text-sm text-text-light">{time}</p>
      </div>
    </div>
  );
}