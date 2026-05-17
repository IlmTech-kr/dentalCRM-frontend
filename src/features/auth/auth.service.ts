import axios from "axios";
import { ENDPOINTS } from "@/src/lib/api/endpoints";
import { mainHttp, tenantHttp } from "@/src/lib/api/http";
import {
  ForgotPasswordDto,
  InviteUserDto,
  LoginDto,
  RegisterClinicDto,
  ResetPasswordDto,
} from "@/src/types/auth.types";

export async function registerClinic(data: RegisterClinicDto) {
  const res = await mainHttp.post(ENDPOINTS.auth.register, data);
  return res.data;
}

export async function login(data: LoginDto) {
  localStorage.clear();

  const res = await axios.post(
    `http://${data.subDomain}.localhost:9000/api/auth/login`,
    {
      email: data.email.trim(),
      password: data.password,
    },
    {
      withCredentials: true,
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  localStorage.setItem("subDomain", data.subDomain);

  if (res.data?.accessToken) {
    localStorage.setItem("accessToken", res.data.accessToken);
  }

  return res.data;
}

export async function refreshToken(subDomain: string) {
  const api = tenantHttp(subDomain);
  const res = await api.post(ENDPOINTS.auth.refresh);

  if (res.data?.accessToken) {
    localStorage.setItem("accessToken", res.data.accessToken);
  }

  return res.data;
}

export async function sendInvite(data: InviteUserDto) {
  const api = tenantHttp(data.subDomain);

  const res = await api.post(ENDPOINTS.auth.invites, {
    email: data.email,
    role: data.role,
  });

  return res.data;
}

export async function forgotPassword(data: ForgotPasswordDto) {
  const api = tenantHttp(data.subDomain);

  const res = await api.post(ENDPOINTS.auth.forgotPassword, {
    email: data.email,
  });

  return res.data;
}

export async function resetPassword(data: ResetPasswordDto) {
  const res = await mainHttp.post(ENDPOINTS.auth.resetPassword, data);
  return res.data;
}

export function logout() {
  localStorage.clear();

  window.location.href = "/login";
}