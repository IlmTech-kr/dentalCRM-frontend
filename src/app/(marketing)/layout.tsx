"use client";

import MarketingTracking from "./_components/MarketingTracking";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <MarketingTracking />
      {children}
    </>
  );
}
