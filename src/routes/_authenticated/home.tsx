import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeftRight, Camera, ChevronRight, PlusCircle, Receipt } from "lucide-react";

import { AppShell, SectionTitle } from "@/components/AppShell";
import { EmptyState, TransactionRow } from "@/components/TransactionRow";
import { Skeleton } from "@/components/ui/skeleton";
import { useAccounts, useProfile, useRecentTransactions } from "@/hooks/useMember";
import { currencySymbol, formatCents, splitCents } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/home")({
  head: () => ({
    meta: [
      { title: "Your accounts — Empower Credit Union" },
      {
        name: "description",
        content: "See your total balance, account activity and quick actions at Empower Credit Union.",
      },
      { property: "og:title", content: "Your accounts — Empower Credit Union" },
      { property: "og:description", content: "Balances, recent activity and quick actions." },
    ],
  }),
  component: HomePage,
});

const QUICK_ACTIONS = [
  { to: "/add-money", label: "Add money", icon: PlusCircle },
  { to: "/transfer", label: "Transfer", icon: ArrowLeftRight },
  { to: "/pay", label: "Pay a bill", icon: Receipt },
  { to: "/deposit", label: "Deposit", icon: Camera },
] as const;

function HomePage() {
  const profile = useProfile();
  const accounts = useAccounts();
  const transactions = useRecentTransactions(6);

  const total = (accounts.data ?? []).reduce((sum, a) => sum + a.balance_cents, 0);
  const money = splitCents(total);
  const fullName =
    profile.data?.full_name?.trim() ||
    (profile.data?.email ? profile.data.email.split("@")[0] : "") ||
    "member";

  return (
    <AppShell
      title={`Good day, ${fullName}`}
      subtitle="Empower Credit Union"
    >
      <section className="overflow-hidden rounded-xl bg-primary p-6 text-primary-foreground shadow-lg shadow-primary/10">
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-primary-foreground/70">
          Total balance
        </p>
        {accounts.isLoading ? (
          <Skeleton className="mt-3 h-11 w-48 bg-primary-foreground/20" />
        ) : (
           <p className="tnum mt-2 font-display text-[3.15rem] font-normal leading-none">
            {currencySymbol()}
            {money.whole}
            <span className="text-2xl text-primary-foreground/70">.{money.fraction}</span>
          </p>
        )}
        <p className="mt-3 text-xs text-primary-foreground/70">
          Across {accounts.data?.length ?? 0} account{(accounts.data?.length ?? 0) === 1 ? "" : "s"} ·
          Federally insured
        </p>
      </section>

      <div className="mt-4 grid grid-cols-4 gap-2">
        {QUICK_ACTIONS.map((action) => (
          <Link
            key={action.to}
            to={action.to}
            className="flex flex-col items-center gap-2 rounded-lg border border-border bg-card px-2 py-4 text-center shadow-sm transition-[transform,border-color] active:scale-[0.97]"
          >
            <span className="grid size-10 place-items-center rounded-full bg-accent/25 text-accent-foreground">
              <action.icon className="size-[1.1rem]" />
            </span>
            <span className="text-xs font-semibold leading-tight">{action.label}</span>
          </Link>
        ))}
      </div>

      <section className="mt-7">
        <SectionTitle
          action={
            <Link to="/accounts" className="text-xs font-semibold text-primary">
              All accounts
            </Link>
          }
        >
          Accounts
        </SectionTitle>
        <div className="space-y-3">
          {accounts.isLoading
            ? [0, 1].map((i) => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)
            : (accounts.data ?? []).map((account) => (
                <Link
                  key={account.id}
                  to="/accounts/$accountId"
                  params={{ accountId: account.id }}
                   className="flex items-center gap-3 rounded-lg border border-border bg-card p-4 shadow-sm transition-[transform,border-color] active:scale-[0.99]"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{account.name}</p>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">
                      {account.kind} ···· {account.mask}
                    </p>
                  </div>
                  <span className="tnum font-display text-lg font-semibold">
                    {formatCents(account.balance_cents)}
                  </span>
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                </Link>
              ))}
        </div>
      </section>

      <section className="mt-7">
        <SectionTitle>Recent activity</SectionTitle>
        {transactions.isLoading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-12 w-full rounded-xl" />
            ))}
          </div>
        ) : (transactions.data ?? []).length === 0 ? (
          <EmptyState>No activity yet.</EmptyState>
        ) : (
           <ul className="rounded-lg border border-border bg-card px-4 shadow-sm">
            {(transactions.data ?? []).map((txn) => (
              <TransactionRow key={txn.id} txn={txn} />
            ))}
          </ul>
        )}
      </section>
    </AppShell>
  );
}
