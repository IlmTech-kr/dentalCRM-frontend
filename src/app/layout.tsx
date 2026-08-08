import type { Metadata, Viewport } from "next";
import Script from "next/script";
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

/**
 * React hydratsiyasidan oldin, HTML parse bosqichida ishlaydi — shu bois
 * saqlangan accent rang (masalan, sidebar rangi) birinchi paint'dayoq
 * to'g'ri ko'rinadi, default ko'k rang "yaltirab" ketmaydi (FOUC).
 * Xato bo'lsa jim o'tkazib yuboriladi — default CSS qiymatlar ishlaydi.
 */
const ACCENT_COLOR_INIT_SCRIPT = `
(function () {
  try {
    var hex = localStorage.getItem("accent-color");
    if (!hex || !/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(hex)) return;
    var clean = hex.replace("#", "");
    if (clean.length === 3) clean = clean.split("").map(function (c) { return c + c; }).join("");
    var num = parseInt(clean, 16);
    var r = (num >> 16) & 255, g = (num >> 8) & 255, b = num & 255;

    // ensureUsableAccent (src/lib/theme/accentColor.ts) bilan bir xil qoida:
    // juda och/rangsiz tanlov (masalan oq) matnni oq fonda ko'rinmas qilib
    // qo'ymasligi uchun xavfsiz darajaga tushiriladi.
    var rf = r / 255, gf = g / 255, bf = b / 255;
    var max = Math.max(rf, gf, bf), min = Math.min(rf, gf, bf);
    var l = (max + min) / 2;
    var s = 0;
    if (max !== min) {
      var d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    }
    if (s < 0.12 && l > 0.5) {
      hex = "#334155";
      r = 0x33; g = 0x41; b = 0x55;
    } else if (s >= 0.12 && l > 0.68) {
      var scale = 0.68 / l;
      r = Math.round(r * scale);
      g = Math.round(g * scale);
      b = Math.round(b * scale);
      hex = "#" + [r, g, b].map(function (v) {
        return Math.max(0, Math.min(255, v)).toString(16).padStart(2, "0");
      }).join("");
    }

    var factor = 0.86;
    var dark = "#" + [r, g, b].map(function (v) {
      return Math.max(0, Math.min(255, Math.round(v * factor))).toString(16).padStart(2, "0");
    }).join("");
    var root = document.documentElement;
    root.style.setProperty("--primary-blue", hex);
    root.style.setProperty("--primary-blue-dark", dark);
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="uz" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
        <Script
          id="accent-color-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: ACCENT_COLOR_INIT_SCRIPT }}
        />
      </body>
    </html>
  );
}