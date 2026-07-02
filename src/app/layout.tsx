import type { Metadata, Viewport } from "next";
import "./globals.css";
import Providers from "./providers";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://dental.ilmtech.uz";

export const viewport: Viewport = {
  themeColor: "#3498db",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),

  title: {
    default: "Dental CRM — Klinika boshqaruv tizimi",
    template: "%s | Dental CRM",
  },

  description:
    "Stomatologiya klinikalari uchun zamonaviy CRM tizimi. Bemorlar, shifokorlar, qabullar, dental chart, davolash kurslari va hisobotlar — barchasi bitta platformada.",

  keywords: [
    "dental crm",
    "stomatologiya crm",
    "klinika boshqaruv",
    "bemorlar bazasi",
    "qabul jadvali",
    "dental chart",
    "shifokor tizimi",
    "ilmtech",
  ],

  authors: [{ name: "IlmTech", url: "https://ilmtech.uz" }],
  creator: "IlmTech",
  publisher: "IlmTech",

  icons: {
    icon: [
      { url: "/favicon.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [
      { url: "/favicon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: "/favicon.png",
  },

  manifest: "/site.webmanifest",

  openGraph: {
    type: "website",
    locale: "uz_UZ",
    url: APP_URL,
    siteName: "Dental CRM",
    title: "Dental CRM — Klinika boshqaruv tizimi",
    description:
      "Stomatologiya klinikalari uchun zamonaviy CRM tizimi. Bemorlar, qabullar, dental chart va hisobotlar bitta platformada.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Dental CRM",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Dental CRM — Klinika boshqaruv tizimi",
    description:
      "Stomatologiya klinikalari uchun zamonaviy CRM tizimi.",
    images: ["/og-image.png"],
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="uz">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}