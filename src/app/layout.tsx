import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import "./globals.css";
import Providers from "./providers";

export const metadata = {
  title: "DentalCRM",
  description: "Smart Clinic Management System",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {/* ✅ Providers wrapper (includes QueryClientProvider) */}
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}