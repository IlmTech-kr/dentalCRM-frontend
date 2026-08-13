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

  ai: {
    sessions: "/api/dental/ai/chat/sessions",
    history: (sessionId: string) =>
      `/api/dental/ai/chat/sessions/${sessionId}/messages`,
    stream: (sessionId: string) =>
      `/api/dental/ai/chat/sessions/${sessionId}/messages/stream`,
    confirmAction: (actionId: string) =>
      `/api/dental/ai/actions/${actionId}/confirm`,
    cancelAction: (actionId: string) =>
      `/api/dental/ai/actions/${actionId}/cancel`,
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
    /**
     * PUT /api/dental/doctor-schedules/by-day
     * Butun haftalik schedule'ni bir so'rovda to'liq belgilaydi/yangilaydi.
     * Body: { doctorId? (admin boshqa doctor uchun majburiy), days: [...] }
     */
    byDay: "/api/dental/doctor-schedules/by-day",
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

      payments: {
        // POST /api/dental/treatment-courses/{courseId}/payments
        create: (courseId: string) => `/api/dental/treatment-courses/${courseId}/payments`,
        // GET /api/dental/treatment-courses/{courseId}/payments — balance + payments[] in one call
        list: (courseId: string) => `/api/dental/treatment-courses/${courseId}/payments`,
        // POST /api/dental/treatment-courses/{courseId}/payments/{paymentId}/void
        void: (courseId: string, paymentId: string) =>
          `/api/dental/treatment-courses/${courseId}/payments/${paymentId}/void`,
      },
    },

    invoices: {
      // GET /api/dental/invoices/by-treatment-course/{courseId}
      byTreatmentCourse: (courseId: string) =>
        `/api/dental/invoices/by-treatment-course/${courseId}`,
      // GET /api/dental/invoices/{invoiceId}
      getById: (invoiceId: string) => `/api/dental/invoices/${invoiceId}`,
      // GET /api/dental/invoices/{invoiceId}/pdf
      pdf: (invoiceId: string) => `/api/dental/invoices/${invoiceId}/pdf`,
    },
  },

  /**
   * Klinika bo'yicha umumiy to'lovlar (barcha treatment course'lar
   * kesimida) — treatmentCourses.payments'dan farqli, bitta course bilan
   * cheklanmagan.
   */
  treatmentPayments: {
    /**
     * GET /api/dental/treatment-payments?page=0&limit=20&fromDate=&toDate=&voided=&sortBy=paidAt&sortDirection=DESC
     */
    list: (params: {
      page?: number;
      limit?: number;
      fromDate?: string;
      toDate?: string;
      voided?: boolean;
      sortBy?: string;
      sortDirection?: "ASC" | "DESC";
    }) => {
      const q = new URLSearchParams();
      q.set("page", String(params.page ?? 0));
      q.set("limit", String(params.limit ?? 20));
      if (params.fromDate) q.set("fromDate", params.fromDate);
      if (params.toDate) q.set("toDate", params.toDate);
      if (params.voided !== undefined) q.set("voided", String(params.voided));
      if (params.sortBy) q.set("sortBy", params.sortBy);
      if (params.sortDirection) q.set("sortDirection", params.sortDirection);
      return `/api/dental/treatment-payments?${q.toString()}`;
    },

    /**
     * GET /api/dental/treatment-payments/summary?fromDate=&toDate=
     */
    summary: (params: { fromDate?: string; toDate?: string }) => {
      const q = new URLSearchParams();
      if (params.fromDate) q.set("fromDate", params.fromDate);
      if (params.toDate) q.set("toDate", params.toDate);
      return `/api/dental/treatment-payments/summary?${q.toString()}`;
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

  expenseCategories: {
    // GET/POST /api/dental/expense-categories
    list: "/api/dental/expense-categories",
    create: "/api/dental/expense-categories",
    // PUT /api/dental/expense-categories/{id}
    update: (id: string) => `/api/dental/expense-categories/${id}`,
  },

  expenses: {
    create: "/api/dental/expenses",

    /**
     * GET /api/dental/expenses?page=0&limit=20&categoryId=&fromDate=&toDate=&status=&currency=
     */
    list: (params: {
      page?: number;
      limit?: number;
      categoryId?: string;
      fromDate?: string;
      toDate?: string;
      status?: string;
      currency?: string;
    }) => {
      const q = new URLSearchParams();
      q.set("page", String(params.page ?? 0));
      q.set("limit", String(params.limit ?? 20));
      if (params.categoryId) q.set("categoryId", params.categoryId);
      if (params.fromDate) q.set("fromDate", params.fromDate);
      if (params.toDate) q.set("toDate", params.toDate);
      if (params.status) q.set("status", params.status);
      if (params.currency) q.set("currency", params.currency);
      return `/api/dental/expenses?${q.toString()}`;
    },

    /**
     * GET /api/dental/expenses/summary?fromDate=&toDate=&currency=&status=
     */
    summary: (params: {
      fromDate?: string;
      toDate?: string;
      currency?: string;
      status?: string;
    }) => {
      const q = new URLSearchParams();
      if (params.fromDate) q.set("fromDate", params.fromDate);
      if (params.toDate) q.set("toDate", params.toDate);
      if (params.currency) q.set("currency", params.currency);
      if (params.status) q.set("status", params.status);
      return `/api/dental/expenses/summary?${q.toString()}`;
    },

    // POST /api/dental/expenses/{id}/pay
    pay: (id: string) => `/api/dental/expenses/${id}/pay`,
    // POST /api/dental/expenses/{id}/void
    void: (id: string) => `/api/dental/expenses/${id}/void`,
  },

  recurringExpenses: {
    // GET/POST /api/dental/recurring-expenses
    list: "/api/dental/recurring-expenses",
    create: "/api/dental/recurring-expenses",
    // PUT /api/dental/recurring-expenses/{id}
    update: (id: string) => `/api/dental/recurring-expenses/${id}`,
    // POST /api/dental/recurring-expenses/{id}/deactivate
    deactivate: (id: string) => `/api/dental/recurring-expenses/${id}/deactivate`,
  },

  storage: {
    upload: "/api/storage/upload",
    uploadBatch: "/api/storage/upload/batch",

    file: (bucket: string, storagePath: string) =>
      `/api/storage/${encodeURIComponent(bucket)}/${encodeStoragePath(
        storagePath
      )}`,

    files: (bucket: string) =>
      `/api/storage/${encodeURIComponent(bucket)}/files`,

    info: (storagePath: string) =>
      `/api/storage/info/${encodeStoragePath(storagePath)}`,
  },
};

function encodeStoragePath(path: string): string {
  return path
    .split("/")
    .filter(Boolean)
    .map((part) => encodeURIComponent(part))
    .join("/");
}
