import { category } from "@/lib/categories";
import { formatCents, formatDay } from "@/lib/format";
import type { Transaction } from "@/hooks/useMember";

export function TransactionRow({ txn }: { txn: Transaction }) {
  const meta = category(txn.category);
  const credit = txn.amount_cents > 0;

  return (
    <li className="flex items-center gap-3 border-b border-border/60 py-3 last:border-0">
      <span
        className={`grid size-10 shrink-0 place-items-center rounded-full ${
          credit ? "bg-positive/12 text-positive" : "bg-secondary text-secondary-foreground"
        }`}
      >
        <meta.icon className="size-[1.05rem]" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[0.94rem] font-semibold leading-tight">{txn.description}</p>
        <p className="truncate text-xs text-muted-foreground">
          {txn.merchant ?? meta.label} · {formatDay(txn.occurred_at)}
          {txn.status === "pending" ? " · Pending" : ""}
        </p>
      </div>
      <span
        className={`tnum shrink-0 text-[0.94rem] font-semibold ${
          credit ? "text-positive" : "text-foreground"
        }`}
      >
        {formatCents(txn.amount_cents, { signed: true })}
      </span>
    </li>
  );
}

export function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-2xl border border-dashed border-border bg-card/60 px-4 py-8 text-center text-sm text-muted-foreground">
      {children}
    </p>
  );
}
