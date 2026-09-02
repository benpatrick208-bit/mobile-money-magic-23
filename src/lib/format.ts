import { getCurrency } from "./currency";

/** Converts USD cents into a displayed amount in the active currency. */
function toDisplay(cents: number) {
  const { rate } = getCurrency();
  return (Math.abs(cents) / 100) * rate;
}

export function formatCents(cents: number, opts: { signed?: boolean } = {}) {
  const { code, fractionDigits } = getCurrency();
  const formatted = toDisplay(cents).toLocaleString("en-US", {
    style: "currency",
    currency: code,
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
  if (!opts.signed) return formatted;
  return `${cents < 0 ? "-" : "+"}${formatted}`;
}

export function currencySymbol() {
  return getCurrency().symbol;
}

export function splitCents(cents: number) {
  const { fractionDigits } = getCurrency();
  const value = toDisplay(cents);
  const [whole, fraction] = value.toFixed(Math.max(fractionDigits, 2)).split(".");
  return {
    whole: Number(whole).toLocaleString("en-US"),
    fraction: fraction ?? "00",
    negative: cents < 0,
  };
}

/** Parses an amount typed in the active currency and returns USD cents. */
export function parseAmountToCents(input: string): number | null {
  const cleaned = input.replace(/[^0-9.]/g, "");
  if (!cleaned) return null;
  const parts = cleaned.split(".");
  if (parts.length > 2) return null;
  const value = Number(cleaned);
  if (!Number.isFinite(value) || value <= 0) return null;
  const { rate } = getCurrency();
  const cents = Math.round((value / rate) * 100);
  return cents > 0 ? cents : null;
}

export function formatDay(iso: string) {
  const date = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today.getTime() - 86400000);
  const same = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  if (same(date, today)) return "Today";
  if (same(date, yesterday)) return "Yesterday";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function formatLongDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function currentMonthStart() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
}

export function previousMonthStart() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().slice(0, 10);
}
