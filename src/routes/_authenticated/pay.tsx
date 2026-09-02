import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";

import { AppShell, SectionTitle } from "@/components/AppShell";
import { EmptyState } from "@/components/TransactionRow";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useAccounts } from "@/hooks/useMember";
import { category, SPEND_CATEGORIES } from "@/lib/categories";
import { formatCents, formatLongDate, parseAmountToCents } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/pay")({
  head: () => ({
    meta: [
      { title: "Bill pay — Empower Credit Union" },
      {
        name: "description",
        content: "Add payees, schedule one-time or monthly bill payments, and review your payment history.",
      },
      { property: "og:title", content: "Bill pay — Empower Credit Union" },
      { property: "og:description", content: "Schedule and track bill payments from your accounts." },
    ],
  }),
  component: PayPage,
});

type Payee = { id: string; name: string; category: string; account_mask: string | null };

function PayPage() {
  const accounts = useAccounts();
  const queryClient = useQueryClient();

  const payees = useQuery({
    queryKey: ["payees"],
    queryFn: async (): Promise<Payee[]> => {
      const { data, error } = await supabase
        .from("payees")
        .select("id, name, category, account_mask")
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

  const bills = useQuery({
    queryKey: ["bill_payments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bill_payments")
        .select("id, amount_cents, due_date, frequency, status, payee_id, account_id")
        .order("due_date", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const [payeeId, setPayeeId] = useState("");
  const [accountId, setAccountId] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [frequency, setFrequency] = useState<"once" | "monthly">("once");
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState("utilities");
  const [newMask, setNewMask] = useState("");

  useEffect(() => {
    if (!payeeId && payees.data?.length) setPayeeId(payees.data[0]!.id);
  }, [payees.data, payeeId]);
  useEffect(() => {
    if (!accountId && accounts.data?.length) setAccountId(accounts.data[0]!.id);
  }, [accounts.data, accountId]);

  const addPayee = useMutation({
    mutationFn: async () => {
      const name = newName.trim();
      if (name.length < 2) throw new Error("Enter the payee's name");
      const { data: userData } = await supabase.auth.getUser();
      const { error } = await supabase.from("payees").insert({
        user_id: userData.user!.id,
        name: name.slice(0, 80),
        category: newCategory,
        account_mask: newMask.replace(/\D/g, "").slice(-4) || null,
      });
      if (error) throw error;
    },
    onSuccess: async () => {
      setNewName("");
      setNewMask("");
      setShowAdd(false);
      toast.success("Payee added");
      await queryClient.invalidateQueries({ queryKey: ["payees"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const schedule = useMutation({
    mutationFn: async () => {
      const cents = parseAmountToCents(amount);
      if (!cents) throw new Error("Enter an amount greater than zero");
      if (!payeeId) throw new Error("Add a payee first");
      const { error } = await supabase.rpc("schedule_bill_payment", {
        p_payee: payeeId,
        p_account: accountId,
        p_amount: cents,
        p_due: dueDate,
        p_frequency: frequency,
      });
      if (error) throw error;
    },
    onSuccess: async () => {
      setAmount("");
      toast.success("Payment scheduled");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["bill_payments"] }),
        queryClient.invalidateQueries({ queryKey: ["accounts"] }),
        queryClient.invalidateQueries({ queryKey: ["transactions"] }),
      ]);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const payeeName = (id: string) => payees.data?.find((p) => p.id === id)?.name ?? "Payee";
  const upcoming = (bills.data ?? []).filter((b) => b.status === "scheduled");
  const history = (bills.data ?? []).filter((b) => b.status !== "scheduled");

  return (
    <AppShell title="Bill pay" subtitle="Payments">
      <section className="rounded-3xl border border-border bg-card p-5">
        <SectionTitle
          action={
            <button
              type="button"
              onClick={() => setShowAdd((v) => !v)}
              className="flex items-center gap-1 text-xs font-semibold text-primary"
            >
              <Plus className="size-3.5" /> Add payee
            </button>
          }
        >
          Schedule a payment
        </SectionTitle>

        {showAdd ? (
          <div className="mb-5 space-y-3 rounded-2xl bg-muted/60 p-4">
            <div className="space-y-1.5">
              <Label htmlFor="newName">Payee name</Label>
              <Input
                id="newName"
                maxLength={80}
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Riverline Power"
                className="h-11 rounded-xl bg-card"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="newCategory">Category</Label>
                <select
                  id="newCategory"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="h-11 w-full rounded-xl border border-input bg-card px-3 text-sm font-medium"
                >
                  {SPEND_CATEGORIES.map((key) => (
                    <option key={key} value={key}>
                      {category(key).label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="newMask">Account last 4</Label>
                <Input
                  id="newMask"
                  inputMode="numeric"
                  maxLength={4}
                  value={newMask}
                  onChange={(e) => setNewMask(e.target.value)}
                  placeholder="2210"
                  className="h-11 rounded-xl bg-card"
                />
              </div>
            </div>
            <Button
              onClick={() => addPayee.mutate()}
              disabled={addPayee.isPending}
              className="h-11 w-full rounded-xl"
            >
              {addPayee.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              Save payee
            </Button>
          </div>
        ) : null}

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="payee">Payee</Label>
            <select
              id="payee"
              value={payeeId}
              onChange={(e) => setPayeeId(e.target.value)}
              className="h-11 w-full rounded-xl border border-input bg-card px-3 text-sm font-medium"
            >
              {(payees.data ?? []).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                  {p.account_mask ? ` ···· ${p.account_mask}` : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="billAmount">Amount</Label>
              <Input
                id="billAmount"
                inputMode="decimal"
                maxLength={12}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="tnum h-11 rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="due">Due date</Label>
              <Input
                id="due"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="h-11 rounded-xl"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="fund">Pay from</Label>
            <select
              id="fund"
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="h-11 w-full rounded-xl border border-input bg-card px-3 text-sm font-medium"
            >
              {(accounts.data ?? []).map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} · {formatCents(a.balance_cents)}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-1 rounded-full bg-muted p-1">
            {(["once", "monthly"] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setFrequency(value)}
                className={`rounded-full py-2 text-sm font-semibold transition-colors ${
                  frequency === value ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                }`}
              >
                {value === "once" ? "One time" : "Every month"}
              </button>
            ))}
          </div>

          <Button
            onClick={() => schedule.mutate()}
            disabled={schedule.isPending}
            className="h-12 w-full rounded-xl text-base"
          >
            {schedule.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
            Schedule payment
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            Payments dated today are sent immediately.
          </p>
        </div>
      </section>

      <section className="mt-7">
        <SectionTitle>Upcoming</SectionTitle>
        {bills.isLoading ? (
          <Skeleton className="h-16 w-full rounded-2xl" />
        ) : upcoming.length === 0 ? (
          <EmptyState>Nothing scheduled right now.</EmptyState>
        ) : (
          <ul className="rounded-2xl border border-border bg-card px-4">
            {upcoming.map((bill) => (
              <li
                key={bill.id}
                className="flex items-center justify-between border-b border-border/60 py-3.5 last:border-0"
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold">{payeeName(bill.payee_id)}</p>
                  <p className="text-xs text-muted-foreground">
                    Due {formatLongDate(bill.due_date)} ·{" "}
                    {bill.frequency === "monthly" ? "Monthly" : "One time"}
                  </p>
                </div>
                <span className="tnum font-semibold">{formatCents(bill.amount_cents)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-7">
        <SectionTitle>Payment history</SectionTitle>
        {history.length === 0 ? (
          <EmptyState>No payments made yet.</EmptyState>
        ) : (
          <ul className="rounded-2xl border border-border bg-card px-4">
            {history.map((bill) => (
              <li
                key={bill.id}
                className="flex items-center justify-between border-b border-border/60 py-3.5 last:border-0"
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold">{payeeName(bill.payee_id)}</p>
                  <p className="text-xs capitalize text-muted-foreground">
                    {bill.status} · {formatLongDate(bill.due_date)}
                  </p>
                </div>
                <span className="tnum font-semibold">{formatCents(bill.amount_cents)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </AppShell>
  );
}
