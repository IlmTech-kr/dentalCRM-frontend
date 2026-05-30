import { Doctor } from "@/src/types/doctor.types";

export const ENDPOINTS = {
  auth: {
    register: "/api/auth/register",
    login: "/api/auth/login",
    refresh: "/api/auth/refresh",
    invites: "/api/auth/invites",
    // ✅ FIXED: Consistent endpoint paths
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
  byId: (id: string) => `/api/dental/doctor-schedules/${id}`,
  create: "/api/dental/doctor-schedules",
},

appointments: {
  list: "/api/dental/appointments",
  byId: (appointmentId: string) =>
    `/api/dental/appointments/${appointmentId}`,
  byDate: "/api/dental/appointments/by-date",
},

dental: {
    charts: {
      create: "/api/dental/charts",
      getById: (chartId: string) => `/api/dental/charts/${chartId}`,
      getByPatient: (patientId: string) =>
        `/api/dental/charts/patient/${patientId}`,
      update: (chartId: string) => `/api/dental/charts/${chartId}`,
      delete: (chartId: string) => `/api/dental/charts/${chartId}`,
    },

    procedures: {
      create: "/api/dental/procedures",
      getById: (procedureId: string) =>
        `/api/dental/procedures/${procedureId}`,
      getAll: (search?: string) =>
        search
          ? `/api/dental/procedures?search=${encodeURIComponent(search)}`
          : "/api/dental/procedures",
      update: (procedureId: string) =>
        `/api/dental/procedures/${procedureId}`,
      delete: (procedureId: string) =>
        `/api/dental/procedures/${procedureId}`,
    },
  },

  dentalCharts: {
    create: "/api/dental/charts",
    getById: (chartId: string) => `/api/dental/charts/${chartId}`,
    getByPatientId: (patientId: string) =>
      `/api/dental/charts/patient/${patientId}`,
    update: (chartId: string) => `/api/dental/charts/${chartId}`,
    delete: (chartId: string) => `/api/dental/charts/${chartId}`,
  },

};