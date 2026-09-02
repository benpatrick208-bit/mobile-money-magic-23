import { useEffect, useSyncExternalStore, type ReactNode } from "react";
import {
  getCurrencyCode,
  hydrateCurrency,
  subscribeCurrency,
} from "@/lib/currency";

/**
 * Re-renders the whole app subtree whenever the display currency changes so
 * every formatted amount picks up the new rate.
 */
export function CurrencyProvider({ children }: { children: ReactNode }) {
  const code = useSyncExternalStore(
    subscribeCurrency,
    getCurrencyCode,
    () => "USD" as const,
  );

  useEffect(() => {
    hydrateCurrency();
  }, []);

  return <div key={code} className="contents">{children}</div>;
}
