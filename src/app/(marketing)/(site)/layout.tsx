"use client";

import LandingHeader from "./_components/LandingHeader";

export default function MarketingSiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <LandingHeader />
      {children}
    </>
  );
}
