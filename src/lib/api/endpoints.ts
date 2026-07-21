export const ENDPOINTS = {
  auth: {
    register: "/api/auth/register",
    login: "/api/auth/login",
    refresh: "/api/auth/refresh",
    invites: "/api/auth/invites",
    forgotPassword: "/api/v1/auth/forgot-password",
    resetPassword: "/api/v1/auth/reset-password",
  },

  users: {
    me: "/api/v1/users/me",
    changePassword: "/api/v1/users/me/change-password",
  },

  patients: {
    list: "/api/dental/patients",
    byId: (id: string) => `/api/dental/patients/${id}`,
  },

  doctors: {
    list: "/api/v1/admin/users",
    byId: (id: string) => `/api/v1/admin/users/${id}`,
  },

  superAdmin: {
    login: "/api/v1/super-admin/login",

    clinics: {
      /**
       * GET /api/v1/super-admin/clinics?page=0&limit=10&status=ACTIVE
       */
      list: (params: { page?: number; limit?: number; status?: string }) => {
        const q = new URLSearchParams();
        q.set("page", String(params.page ?? 0));
        q.set("limit", String(params.limit ?? 10));
        if (params.status) q.set("status", params.status);
        return `/api/v1/super-admin/clinics?${q.toString()}`;
      },
      // GET /api/v1/super-admin/clinics/{id}
      byId: (id: string) => `/api/v1/super-admin/clinics/${id}`,
    },
  },

  doctorSchedules: {
    list: "/api/dental/doctor-schedules",
    detail: (id: string) => `/api/dental/doctor-schedules/${id}`,
    create: "/api/dental/doctor-schedules",
    createWeekly: "/api/dental/doctor-schedules/weekly",
    update: (id: string) => `/api/dental/doctor-schedules/${id}`,
    delete: (id: string) => `/api/dental/doctor-schedules/${id}`,
  },

  appointments: {
    list: "/api/dental/appointments",
    create: "/api/dental/appointments",
    detail: (id: string) => `/api/dental/appointments/${id}`,
    update: (id: string) => `/api/dental/appointments/${id}`,
    delete: (id: string) => `/api/dental/appointments/${id}`,
    byDate: "/api/dental/appointments/by-date",
  },

  dental: {
    charts: {
      create: "/api/dental/charts",
      getById: (chartId: string) => `/api/dental/charts/${chartId}`,
      getByPatient: (patientId: string) => `/api/dental/charts/patient/${patientId}`,
      update: (chartId: string) => `/api/dental/charts/${chartId}`,
      delete: (chartId: string) => `/api/dental/charts/${chartId}`,
    },

    procedures: {
      create: "/api/dental/procedures",
      getById: (procedureId: string) => `/api/dental/procedures/${procedureId}`,
      getAll: (search?: string) =>
        search
          ? `/api/dental/procedures?search=${encodeURIComponent(search)}`
          : "/api/dental/procedures",
      update: (procedureId: string) => `/api/dental/procedures/${procedureId}`,
      delete: (procedureId: string) => `/api/dental/procedures/${procedureId}`,
    },

    treatmentCourses: {
      create: "/api/dental/treatment-courses",
      addVisit: (courseId: string) => `/api/dental/treatment-courses/${courseId}/visits`,
      complete: (courseId: string) => `/api/dental/treatment-courses/${courseId}/complete`,
      getById: (courseId: string) => `/api/dental/treatment-courses/${courseId}`,
      listByPatient: (patientId: string) => `/api/dental/treatment-courses/patient/${patientId}`,
    },
  },

  dentalCharts: {
    create: "/api/dental/charts",
    getById: (chartId: string) => `/api/dental/charts/${chartId}`,
    getByPatientId: (patientId: string) => `/api/dental/charts/patient/${patientId}`,
    update: (chartId: string) => `/api/dental/charts/${chartId}`,
    delete: (chartId: string) => `/api/dental/charts/${chartId}`,
  },

  payment: {
    orders: "/api/payment/orders",
    checkout: "/api/payment/checkout",
  },

  subscriptions: {
    current: "/api/dental/subscriptions/current",
    plans: "/api/dental/subscriptions/plans",
    cancel: "/api/dental/subscriptions/cancel",

    /**
     * SUPER_ADMIN — istalgan tenant uchun obunani faollashtirish.
     * POST /api/dental/subscriptions/activate
     * body: { tenantId, planCode, ... }
     */
    activate: "/api/dental/subscriptions/activate",

    /**
     * SUPER_ADMIN paneli — tariflar va tenantlarni boshqarish.
     * mainHttp (root domain, dental.api.ilmtech.uz) orqali chaqiriladi.
     */
    admin: {
      plans: {
        // GET /api/dental/subscriptions/admin/plans
        list: "/api/dental/subscriptions/admin/plans",
        // GET /api/dental/subscriptions/admin/plans/PRO
        byCode: (code: string) => `/api/dental/subscriptions/admin/plans/${code}`,
      },

      tenants: {
        /**
         * GET /api/dental/subscriptions/admin/tenants?status=ACTIVE&page=0&limit=10
         */
        list: (params: { status?: string; page?: number; limit?: number }) => {
          const q = new URLSearchParams();
          if (params.status) q.set("status", params.status);
          q.set("page", String(params.page ?? 0));
          q.set("limit", String(params.limit ?? 10));
          return `/api/dental/subscriptions/admin/tenants?${q.toString()}`;
        },
        // POST /api/dental/subscriptions/admin/tenants/{id}/suspend
        suspend: (tenantId: string) =>
          `/api/dental/subscriptions/admin/tenants/${tenantId}/suspend`,
        // GET/PUT /api/dental/subscriptions/admin/tenants/{id}/limits
        limits: (tenantId: string) =>
          `/api/dental/subscriptions/admin/tenants/${tenantId}/limits`,
      },
    },
  },

  statistics: {
    /**
     * CLINIC_ADMIN & SUPER_ADMIN
     * GET /api/dental/statistics/revenue?fromDate=&toDate=&filter=DAY&sort=REVENUE&direction=DESC
     * filter: DAY | MONTH | YEAR
     * sort: PERIOD | REVENUE | CLINIC
     * direction: ASC | DESC
     */
    revenue: (params: {
      fromDate: string;
      toDate: string;
      filter?: "DAY" | "MONTH" | "YEAR";
      sort?: "PERIOD" | "REVENUE" | "CLINIC";
      direction?: "ASC" | "DESC";
    }) => {
      const q = new URLSearchParams({
        fromDate: params.fromDate,
        toDate: params.toDate,
        filter: params.filter ?? "DAY",
        sort: params.sort ?? "REVENUE",
        direction: params.direction ?? "DESC",
      });
      return `/api/dental/statistics/revenue?${q.toString()}`;
    },

    /**
     * SUPER_ADMIN only — mainHttp (root domain)
     * GET /api/dental/statistics/revenue/clinics?fromDate=&toDate=&sort=REVENUE&direction=DESC
     */
    revenueByClinic: (params: {
      fromDate: string;
      toDate: string;
      sort?: "PERIOD" | "REVENUE" | "CLINIC";
      direction?: "ASC" | "DESC";
    }) => {
      const q = new URLSearchParams({
        fromDate: params.fromDate,
        toDate: params.toDate,
        sort: params.sort ?? "REVENUE",
        direction: params.direction ?? "DESC",
      });
      return `/api/dental/statistics/revenue/clinics?${q.toString()}`;
    },

    /**
     * CLINIC_ADMIN — barcha doctorlarni yoki bitta doctorni ko'radi.
     * DOCTOR — faqat o'zinikini ko'radi (doctorId berilmasa backend token orqali aniqlaydi).
     * GET /api/dental/statistics/revenue/doctors?doctorId=&fromDate=&toDate=
     */
    doctorRevenue: (params: { fromDate: string; toDate: string; doctorId?: string }) => {
      const q = new URLSearchParams({
        fromDate: params.fromDate,
        toDate: params.toDate,
      });
      if (params.doctorId) q.set("doctorId", params.doctorId);
      return `/api/dental/statistics/revenue/doctors?${q.toString()}`;
    },

    /**
     * CLINIC_ADMIN only — klinikaning umumiy daromad/chiqim (payroll) hisoboti.
     * GET /api/dental/statistics/payroll?fromDate=&toDate=
     */
    payroll: (params: { fromDate: string; toDate: string }) => {
      const q = new URLSearchParams({
        fromDate: params.fromDate,
        toDate: params.toDate,
      });
      return `/api/dental/statistics/payroll?${q.toString()}`;
    },
  },
};