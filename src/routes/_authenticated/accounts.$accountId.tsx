import { createFileRoute, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import { AppShell, SectionTitle } from "@/components/AppShell";
import { EmptyState, TransactionRow } from "@/components/TransactionRow";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useAccounts, type Transaction } from "@/hooks/useMember";
import { CATEGORIES } from "@/lib/categories";
import { formatCents } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/accounts/$accountId")({
  head: () => ({
    meta: [
      { title: "Account activity — Empower Credit Union" },
      {
        name: "description",
        content: "Full transaction history for your Empower Credit Union account with search and filters.",
      },
      { property: "og:title", content: "Account activity — Empower Credit Union" },
      { property: "og:description", content: "Search and filter every transaction on your account." },
    ],
  }),
  component: AccountDetailPage,
});

const PAGE_SIZE = 25;

function AccountDetailPage() {
  const { accountId } = useParams({ from: "/_authenticated/accounts/$accountId" });
  const accounts = useAccounts();
  const account = (accounts.data ?? []).find((a) => a.id === accountId);

  const [search, setSearch] = useState("");
  const [cat, setCat] = useState("all");
  const [page, setPage] = useState(0);

  const history = useQuery({
    queryKey: ["transactions", accountId, cat, page],
    queryFn: async (): Promise<Transaction[]> => {
      let query = supabase
        .from("transactions")
        .select("id, account_id, description, merchant, category, amount_cents, status, occurred_at")
        .eq("account_id", accountId)
        .order("occurred_at", { ascending: false })
        .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);
      if (cat !== "all") query = query.eq("category", cat);
      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
  });

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return history.data ?? [];
    return (history.data ?? []).filter(
      (t) =>
        t.description.toLowerCase().includes(term) ||
        (t.merchant ?? "").toLowerCase().includes(term),
    );
  }, [history.data, search]);

  const pending = (history.data ?? [])
    .filter((t) => t.status === "pending")
    .reduce((s, t) => s + t.amount_cents, 0);

  return (
    <AppShell back title={account?.name ?? "Account"} subtitle="Account activity">
      <div className="rounded-3xl bg-primary p-6 text-primary-foreground">
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-primary-foreground/70">
          Current balance
        </p>
        {account ? (
          <p className="tnum mt-1 font-display text-4xl font-semibold">
            {formatCents(account.balance_cents)}
          </p>
        ) : (
          <Skeleton className="mt-2 h-10 w-40 bg-primary-foreground/20" />
        )}
        <div className="mt-4 flex justify-between text-xs text-primary-foreground/75">
          <span>
            {account?.kind} ···· {account?.mask}
          </span>
          <span className="tnum">Pending {formatCents(pending)}</span>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            maxLength={60}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search this account"
            className="h-11 rounded-xl pl-9"
            aria-label="Search transactions"
          />
        </div>
        <select
          aria-label="Filter by category"
          value={cat}
          onChange={(e) => {
            setCat(e.target.value);
            setPage(0);
          }}
          className="h-11 w-full rounded-xl border border-input bg-card px-3 text-sm font-medium"
        >
          <option value="all">All categories</option>
          {Object.entries(CATEGORIES).map(([key, value]) => (
            <option key={key} value={key}>
              {value.label}
            </option>
          ))}
        </select>
      </div>

      <section className="mt-6">
        <SectionTitle>History</SectionTitle>
        {history.isLoading ? (
          <div className="space-y-3">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full rounded-xl" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <EmptyState>No transactions match your filters.</EmptyState>
        ) : (
          <ul className="rounded-2xl border border-border bg-card px-4">
            {rows.map((txn) => (
              <TransactionRow key={txn.id} txn={txn} />
            ))}
          </ul>
        )}

        <div className="mt-4 flex items-center justify-between">
          <button
            type="button"
            disabled={page === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            className="rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold disabled:opacity-40"
          >
            Newer
          </button>
          <span className="text-xs text-muted-foreground">Page {page + 1}</span>
          <button
            type="button"
            disabled={(history.data ?? []).length < PAGE_SIZE}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold disabled:opacity-40"
          >
            Older
          </button>
        </div>
      </section>
    </AppShell>
  );
}
