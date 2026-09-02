import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Check, Loader2, Pencil, Plus } from "lucide-react";

import { AppShell, SectionTitle } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { category, SPEND_CATEGORIES, type CategoryKey } from "@/lib/categories";
import { formatCents, parseAmountToCents, currentMonthStart } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/budgets")({
  head: () => ({
    meta: [
      { title: "Budgets — Empower Credit Union" },
      {
        name: "description",
        content: "Set monthly category budgets and track your spending with Empower Credit Union.",
      },
      { property: "og:title", content: "Budgets — Empower Credit Union" },
      { property: "og:description", content: "Track monthly spending against your budgets." },
    ],
  }),
  component: BudgetsPage,
});

type Budget = {
  id: string;
  category: CategoryKey;
  limit_cents: number;
  month: string;
};

function BudgetsPage() {
  const queryClient = useQueryClient();
  const month = currentMonthStart();

  const budgets = useQuery({
    queryKey: ["budgets", month],
    queryFn: async (): Promise<Budget[]> => {
      const { data, error } = await supabase
        .from("budgets")
        .select("id, category, limit_cents, month")
        .eq("month", month)
        .order("category");
      if (error) throw error;
      return (data ?? []) as Budget[];
    },
  });

  const spending = useQuery({
    queryKey: ["transactions", "spending", month],
    queryFn: async (): Promise<Record<string, number>> => {
      const start = new Date(month).toISOString();
      const { data, error } = await supabase
        .from("transactions")
        .select("category, amount_cents")
        .lt("amount_cents", 0)
        .gte("occurred_at", start)
        .not("category", "in", "(\"transfer\",\"deposit\",\"income\")");
      if (error) throw error;
      const totals: Record<string, number> = {};
      for (const row of data ?? []) {
        totals[row.category] = (totals[row.category] ?? 0) + Math.abs(row.amount_cents);
      }
      return totals;
    },
  });

  const upsert = useMutation({
    mutationFn: async ({ category, limit }: { category: CategoryKey; limit: number }) => {
      const { data: userData } = await supabase.auth.getUser();
      const { error } = await supabase.from("budgets").upsert(
        {
          user_id: userData.user!.id,
          category,
          month,
          limit_cents: limit,
        },
        { onConflict: "user_id,category,month" },
      );
      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["budgets", month] });
      toast.success("Budget updated");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const categories = useMemo(() => {
    const map = new Map<string, Budget>();
    for (const b of budgets.data ?? []) map.set(b.category, b);
    return SPEND_CATEGORIES.map((key) => ({
      key,
      meta: category(key),
      budget: map.get(key) as Budget | undefined,
      spent: spending.data?.[key] ?? 0,
    }));
  }, [budgets.data, spending.data]);

  const totalSpent = categories.reduce((s, c) => s + c.spent, 0);
  const totalBudget = categories.reduce((s, c) => s + (c.budget?.limit_cents ?? 0), 0);

  return (
    <AppShell title="Budgets" subtitle="Spending plan">
      <div className="rounded-3xl border border-border bg-card p-5">
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          {new Date(month).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
        </p>
        <div className="mt-2 flex items-baseline gap-3">
          <span className="tnum font-display text-3xl font-semibold">{formatCents(totalSpent)}</span>
          <span className="text-sm text-muted-foreground">
            of {formatCents(totalBudget)} budgeted
          </span>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{
              width: `${totalBudget > 0 ? Math.min(100, (totalSpent / totalBudget) * 100) : 0}%`,
            }}
          />
        </div>
      </div>

      <section className="mt-7">
        <SectionTitle>By category</SectionTitle>
        {budgets.isLoading || spending.isLoading ? (
          <div className="space-y-3">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 w-full rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {categories.map((item) => (
              <BudgetCard
                key={item.key}
                item={item}
                onSave={(limit) => upsert.mutate({ category: item.key, limit })}
                saving={upsert.isPending}
              />
            ))}
          </div>
        )}
      </section>
    </AppShell>
  );
}

function BudgetCard({
  item,
  onSave,
  saving,
}: {
  item: { key: CategoryKey; meta: ReturnType<typeof category>; budget: Budget | undefined; spent: number };
  onSave: (limit: number) => void;
  saving: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [raw, setRaw] = useState("");
  const limit = item.budget?.limit_cents ?? 0;
  const pct = limit > 0 ? Math.min(100, (item.spent / limit) * 100) : 0;
  const over = limit > 0 && item.spent > limit;

  function startEdit() {
    setRaw(limit > 0 ? (limit / 100).toFixed(2) : "");
    setEditing(true);
  }

  function save() {
    const cents = parseAmountToCents(raw);
    if (!cents) {
      toast.error("Enter a budget amount greater than zero");
      return;
    }
    onSave(cents);
    setEditing(false);
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-secondary text-secondary-foreground">
          <item.meta.icon className="size-[1.05rem]" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold">{item.meta.label}</p>
          <p className="tnum text-sm text-muted-foreground">
            {formatCents(item.spent)} spent
            {limit > 0 ? ` · ${formatCents(limit)} budget` : " · No budget set"}
          </p>
        </div>
        {editing ? (
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="grid size-9 place-items-center rounded-full bg-primary text-primary-foreground disabled:opacity-50"
          >
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
          </button>
        ) : (
          <button
            type="button"
            onClick={startEdit}
            className="grid size-9 place-items-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-muted"
          >
            {limit > 0 ? <Pencil className="size-4" /> : <Plus className="size-4" />}
          </button>
        )}
      </div>

      {editing ? (
        <div className="mt-4 flex items-center gap-2">
          <Label htmlFor={`budget-${item.key}`} className="sr-only">
            Budget amount
          </Label>
          <div className="relative flex-1">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              $
            </span>
            <Input
              id={`budget-${item.key}`}
              inputMode="decimal"
              value={raw}
              onChange={(e) => setRaw(e.target.value)}
              placeholder="0.00"
              className="tnum h-11 rounded-xl pl-7"
            />
          </div>
          <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>
            Cancel
          </Button>
        </div>
      ) : (
        <div className="mt-4">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{limit > 0 ? `${pct.toFixed(0)}% used` : "No budget"}</span>
            <span>{limit > 0 ? (over ? "Over budget" : "On track") : "—"}</span>
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full rounded-full transition-all ${over ? "bg-destructive" : "bg-primary"}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
