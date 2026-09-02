export type CurrencyCode = "USD" | "EUR" | "GBP" | "NGN" | "CAD" | "JPY";

export type CurrencyInfo = {
  code: CurrencyCode;
  label: string;
  symbol: string;
  /** Units of this currency per 1 USD (indicative demo rates). */
  rate: number;
  fractionDigits: number;
};

export const CURRENCIES: Record<CurrencyCode, CurrencyInfo> = {
  USD: { code: "USD", label: "US Dollar", symbol: "$", rate: 1, fractionDigits: 2 },
  EUR: { code: "EUR", label: "Euro", symbol: "€", rate: 0.92, fractionDigits: 2 },
  GBP: { code: "GBP", label: "British Pound", symbol: "£", rate: 0.79, fractionDigits: 2 },
  CAD: { code: "CAD", label: "Canadian Dollar", symbol: "CA$", rate: 1.36, fractionDigits: 2 },
  NGN: { code: "NGN", label: "Nigerian Naira", symbol: "₦", rate: 1550, fractionDigits: 2 },
  JPY: { code: "JPY", label: "Japanese Yen", symbol: "¥", rate: 157, fractionDigits: 0 },
};

export const CURRENCY_LIST = Object.values(CURRENCIES);

const STORAGE_KEY = "ecu.currency";

function isCode(value: unknown): value is CurrencyCode {
  return typeof value === "string" && value in CURRENCIES;
}

let active: CurrencyCode = "USD";
const listeners = new Set<() => void>();

/** Hydrate from localStorage — safe to call in the browser only. */
export function hydrateCurrency() {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (isCode(stored) && stored !== active) {
      active = stored;
      listeners.forEach((l) => l());
    }
  } catch {
    /* storage unavailable */
  }
}

export function getCurrencyCode(): CurrencyCode {
  return active;
}

export function getCurrency(): CurrencyInfo {
  return CURRENCIES[active];
}

export function setCurrencyCode(code: string) {
  if (!isCode(code) || code === active) return;
  active = code;
  try {
    window.localStorage.setItem(STORAGE_KEY, code);
  } catch {
    /* storage unavailable */
  }
  listeners.forEach((l) => l());
}

export function subscribeCurrency(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
