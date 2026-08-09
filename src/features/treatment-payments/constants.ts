import type { Currency, PaymentMethod } from "./types";

/** Backend'ning to'liq usul ro'yxati tasdiqlanmagan (ochiq savol) — ma'lum ikkitasi. */
export const PAYMENT_METHODS: PaymentMethod[] = ["CARD", "CASH"];

/** Spec misolida USD va UZS ikkalasi ham uchraydi — expenses moduli faqat UZS bilan cheklangan. */
export const CURRENCIES: Currency[] = ["USD", "UZS"];

export const DEFAULT_PAGE_SIZE = 20;
