import type { Metadata } from "next";
import { AiWorkspace } from "@/src/features/ai/components/AiWorkspace";

export const metadata: Metadata = {
  title: "Dental Copilot",
  description: "Klinika xodimlari uchun xavfsiz AI yordamchi",
};

export default function AiPage() {
  return <AiWorkspace />;
}
