"use client";

import { useEffect } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { NextIntlClientProvider } from "next-intl";
import { queryClient } from "../lib/react-query/client";
import { ToastContainer } from "../components/ui/Toastcontainer";
import DentalLoader from "../components/ui/DentalLoader";
import { useLocaleStore } from "../store/locale.store";
import { useUiStore } from "../store/ui.store";
import { MESSAGES } from "../lib/i18n/messages";

export default function Providers({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = useLocaleStore((state) => state.locale);
  const isHydrated = useLocaleStore((state) => state.isHydrated);
  const hydrateFromStorage = useLocaleStore(
    (state) => state.hydrateFromStorage
  );
  const hydrateUiFromStorage = useUiStore((state) => state.hydrateFromStorage);

  useEffect(() => {
    hydrateFromStorage();
    hydrateUiFromStorage();
  }, [hydrateFromStorage, hydrateUiFromStorage]);

  useEffect(() => {
    if (isHydrated) {
      document.documentElement.lang = locale;
    }
  }, [locale, isHydrated]);

  if (!isHydrated) {
    return <DentalLoader fullScreen text="Loading..." />;
  }

  return (
    <NextIntlClientProvider locale={locale} messages={MESSAGES[locale]}>
      <QueryClientProvider client={queryClient}>
        {children}
        <ReactQueryDevtools initialIsOpen={false} />
        <ToastContainer />
      </QueryClientProvider>
    </NextIntlClientProvider>
  );
}
