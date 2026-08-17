"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { useConfirmStore, type ConfirmOptions } from "@/src/store/confirm.store";

/**
 * window.confirm() o'rniga ishlatiladi — bir xil sinxron-ko'rinishdagi
 * usul: `if (!(await confirm({ title, message }))) return;`
 *
 * Usage:
 * const confirm = useConfirm();
 * const ok = await confirm({ title: t("..."), message: t("...") });
 * if (!ok) return;
 */
export function useConfirm() {
  const request = useConfirmStore((state) => state.request);
  const tCommon = useTranslations("common");

  return useMemo(
    () =>
      (options: ConfirmOptions) =>
        request({
          confirmLabel: tCommon("actions.confirm"),
          cancelLabel: tCommon("actions.cancel"),
          ...options,
        }),
    [request, tCommon]
  );
}
