import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";

import { AppShell, SectionTitle } from "@/components/AppShell";
import { Skeleton } from "@/components/ui/skeleton";
import { useAccounts } from "@/hooks/useMember";
import { formatCents } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/accounts/")({
  head: () => ({
    meta: [
      { title: "Accounts — Empower Credit Union" },
      {
        name: "description",
        content: "All your Empower Credit Union accounts with current balances in one list.",
      },
      { property: "og:title", content: "Accounts — Empower Credit Union" },
      { property: "og:description", content: "Checking and savings balances at a glance." },
    ],
  }),
  component: AccountsPage,
});

function AccountsPage() {
  const accounts = useAccounts();
  const total = (accounts.data ?? []).reduce((sum, a) => sum + a.balance_cents, 0);

  return (
    <AppShell title="Accounts" subtitle="Your money">
      <div className="rounded-3xl border border-border bg-card p-5">
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Combined balance
        </p>
        <p className="tnum mt-1 font-display text-3xl font-semibold">{formatCents(total)}</p>
      </div>

      <section className="mt-6">
        <SectionTitle>Deposit accounts</SectionTitle>
        <div className="space-y-3">
          {accounts.isLoading
            ? [0, 1].map((i) => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)
            : (accounts.data ?? []).map((account) => (
                <Link
                  key={account.id}
                  to="/accounts/$accountId"
                  params={{ accountId: account.id }}
                  className="block rounded-2xl border border-border bg-card p-5 transition-transform active:scale-[0.99]"
                >
                  <div className="flex items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{account.name}</p>
                      <p className="text-xs uppercase tracking-wider text-muted-foreground">
                        {account.kind} ···· {account.mask}
                      </p>
                    </div>
                    <ChevronRight className="size-4 text-muted-foreground" />
                  </div>
                  <p className="tnum mt-4 font-display text-2xl font-semibold">
                    {formatCents(account.balance_cents)}
                  </p>
                  <p className="text-xs text-muted-foreground">Available now</p>
                </Link>
              ))}
        </div>
      </section>
    </AppShell>
  );
}
