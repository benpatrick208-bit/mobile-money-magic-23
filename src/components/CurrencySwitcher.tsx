import { useSyncExternalStore } from "react";
import { Globe } from "lucide-react";

import {
  CURRENCY_LIST,
  getCurrencyCode,
  setCurrencyCode,
  subscribeCurrency,
} from "@/lib/currency";

export function CurrencySwitcher({
  onChange,
  label = "Display currency",
}: {
  onChange?: (code: string) => void;
  label?: string;
}) {
  const code = useSyncExternalStore(
    subscribeCurrency,
    getCurrencyCode,
    () => "USD" as const,
  );

  return (
    <div className="flex items-center gap-3 rounded-2xl bg-muted/60 p-4">
      <Globe className="size-5 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <label htmlFor="currency" className="text-sm font-medium">
          {label}
        </label>
        <p className="text-xs text-muted-foreground">
          Balances are converted at indicative rates.
        </p>
      </div>
      <select
        id="currency"
        value={code}
        onChange={(e) => {
          setCurrencyCode(e.target.value);
          onChange?.(e.target.value);
        }}
        className="rounded-xl border border-border bg-card px-3 py-2 text-sm font-semibold outline-none"
      >
        {CURRENCY_LIST.map((c) => (
          <option key={c.code} value={c.code}>
            {c.symbol} {c.code}
          </option>
        ))}
      </select>
    </div>
  );
}
