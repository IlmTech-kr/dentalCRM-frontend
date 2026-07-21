"use client";

import { useMutation } from "@tanstack/react-query";
import { superAdminLogin, SuperAdminLoginPayload } from "../service/superadmin.auth.service";

export function useSuperAdminLogin() {
  return useMutation({
    mutationFn: (payload: SuperAdminLoginPayload) => superAdminLogin(payload),
  });
}