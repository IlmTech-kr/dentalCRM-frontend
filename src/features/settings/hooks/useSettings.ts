"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as api from "../settings.service";
import type { AppearanceSettings, ClinicSettings } from "@/src/types/settings.types";

export const settingsKeys={appearance:["settings","appearance"] as const,clinic:["settings","clinic"] as const};
export function useAppearance(){return useQuery({queryKey:settingsKeys.appearance,queryFn:api.getAppearance,staleTime:300000,retry:false});}
export function useSaveAppearance(){const q=useQueryClient();return useMutation({mutationFn:api.updateAppearance,onSuccess:(d)=>q.setQueryData(settingsKeys.appearance,d)});}
export function useClinicSettings(enabled=true){return useQuery({queryKey:settingsKeys.clinic,queryFn:api.getClinicSettings,enabled,staleTime:60000,retry:false});}
export function useSaveClinicSettings(){const q=useQueryClient();return useMutation<ClinicSettings,Error,{timezone:string;sms:ClinicSettings["sms"]}>({mutationFn:async p=>{await api.updateClinicGeneral(p.timezone);return api.updateClinicSms(p.sms);},onSuccess:d=>q.setQueryData(settingsKeys.clinic,d)});}
