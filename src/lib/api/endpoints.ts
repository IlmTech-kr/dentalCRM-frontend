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
    clinics: "/api/v1/super-admin/clinics",
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
  },
};

