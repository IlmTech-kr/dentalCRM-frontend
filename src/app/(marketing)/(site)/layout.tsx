"use client";

import { Geologica } from "next/font/google";
import LandingHeader from "./_components/LandingHeader";

/* One family for the whole marketing site; it covers Uzbek, Russian and English. */
const geologica = Geologica({
  subsets: ["latin", "latin-ext", "cyrillic"],
  display: "swap",
});

export default function MarketingSiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={geologica.className}>
      <LandingHeader />
      {children}
    </div>
  );
}
