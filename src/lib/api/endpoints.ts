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

};