import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, CreditCard, Landmark, Loader2, Wallet } from "lucide-react";

import { AppShell, SectionTitle } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useAccounts, usePinStatus } from "@/hooks/useMember";
import { currencySymbol, formatCents, parseAmountToCents } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/add-money")({
  head: () => ({
    meta: [
      { title: "Add money — Empower Credit Union" },
      {
        name: "description",
        content: "Top up your Empower Credit Union account instantly from a linked card or bank.",
      },
      { property: "og:title", content: "Add money — Empower Credit Union" },
      { property: "og:description", content: "Instantly increase your available balance." },
    ],
  }),
  component: AddMoneyPage,
});

const SOURCES = [
  { value: "Linked debit card", icon: CreditCard },
  { value: "External bank transfer", icon: Landmark },
  { value: "Cash at branch", icon: Wallet },
] as const;

const PRESETS = [2500, 10000, 25000, 50000];

function AddMoneyPage() {
  const navigate = useNavigate();
  const accounts = useAccounts();
  const pin = usePinStatus();
  const queryClient = useQueryClient();

  const [accountId, setAccountId] = useState("");
  const [amount, setAmount] = useState("");
  const [source, setSource] = useState<string>(SOURCES[0].value);
  const [note, setNote] = useState("");
  const [pinInput, setPinInput] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!accountId && accounts.data?.length) setAccountId(accounts.data[0]!.id);
  }, [accounts.data, accountId]);

  const cents = parseAmountToCents(amount);
  const account = accounts.data?.find((a) => a.id === accountId);

  const addMoney = useMutation({
    mutationFn: async () => {
      if (!cents) throw new Error("Enter an amount greater than zero");
      if (!accountId) throw new Error("Choose an account");
      if (pin.hasPin && !/^\d{4,6}$/.test(pinInput)) {
        throw new Error("Enter your 4-6 digit transaction PIN");
      }
      const { error } = await supabase.rpc("add_money_v2", {
        p_account: accountId,
        p_amount: cents,
        p_source: source,
        ...(note.trim() ? { p_note: note.trim().slice(0, 140) } : {}),
        ...(pin.hasPin ? { p_pin: pinInput } : {}),
      });
      if (error) throw error;
    },
    onSuccess: async () => {
      setPinInput("");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["accounts"] }),
        queryClient.invalidateQueries({ queryKey: ["transactions"] }),
      ]);
      setDone(true);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (done) {
    return (
      <AppShell title="Money added" subtitle="Add money">
        <div className="rounded-3xl border border-border bg-card p-7 text-center">
          <span className="mx-auto grid size-14 place-items-center rounded-full bg-positive/15 text-positive">
            <CheckCircle2 className="size-7" />
          </span>
          <p className="tnum mt-4 font-display text-3xl font-semibold">{formatCents(cents ?? 0)}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {note.trim() || `Added to ${account?.name} from ${source}`}
          </p>
          <p className="mt-4 text-sm text-muted-foreground">
            Your available balance is updated right away.
          </p>
          <Button className="mt-6 h-12 w-full rounded-xl" onClick={() => navigate({ to: "/home" })}>
            Back to home
          </Button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell back title="Add money" subtitle="Top up instantly">
      <div className="space-y-5">
        <div className="rounded-3xl border border-border bg-card p-5">
          <Label htmlFor="addAmount" className="text-xs uppercase tracking-widest text-muted-foreground">
            Amount
          </Label>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="font-display text-3xl text-muted-foreground">{currencySymbol()}</span>
            <input
              id="addAmount"
              inputMode="decimal"
              value={amount}
              maxLength={12}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="tnum w-full bg-transparent font-display text-4xl font-semibold outline-none placeholder:text-muted-foreground/40"
            />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() =>
                  setAmount(
                    formatCents(preset)
                      .replace(/[^0-9.]/g, "")
                      .replace(/\.00$/, ""),
                  )
                }
                className="rounded-full border border-border px-3.5 py-1.5 text-xs font-semibold text-muted-foreground transition-colors active:bg-muted"
              >
                {formatCents(preset)}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4">
          <Label htmlFor="addAccount" className="text-xs uppercase tracking-widest text-muted-foreground">
            Add to
          </Label>
          {accounts.isLoading ? (
            <Skeleton className="mt-2 h-6 w-40" />
          ) : (
            <select
              id="addAccount"
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="mt-1 w-full bg-transparent text-base font-semibold outline-none"
            >
              {(accounts.data ?? []).map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} · {formatCents(a.balance_cents)}
                </option>
              ))}
            </select>
          )}
        </div>

        <SectionTitle>Funding source</SectionTitle>
        <div className="space-y-2">
          {SOURCES.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => setSource(s.value)}
              className={`flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition-colors ${
                source === s.value ? "border-primary bg-primary/5" : "border-border bg-card"
              }`}
            >
              <s.icon className="size-5 shrink-0 text-muted-foreground" />
              <span className="flex-1 text-sm font-semibold">{s.value}</span>
              {source === s.value ? <CheckCircle2 className="size-4 text-primary" /> : null}
            </button>
          ))}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="addNote">Description (optional)</Label>
          <Input
            id="addNote"
            maxLength={140}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Payday top-up"
            className="h-11 rounded-xl"
          />
        </div>



        {pin.hasPin ? (
          <div className="space-y-1.5">
            <Label htmlFor="addPin">Transaction PIN</Label>
            <Input
              id="addPin"
              type="password"
              inputMode="numeric"
              autoComplete="off"
              maxLength={6}
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ""))}
              placeholder="••••"
              className="h-11 rounded-xl tracking-[0.5em]"
            />
          </div>
        ) : (
          <p className="rounded-2xl border border-dashed border-border bg-card/60 px-4 py-3 text-xs text-muted-foreground">
            Tip: set a transaction PIN in Profile &amp; Security to protect top-ups.
          </p>
        )}

        <Button
          disabled={addMoney.isPending}
          onClick={() => addMoney.mutate()}
          className="h-12 w-full rounded-xl text-base"
        >
          {addMoney.isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
          Add {cents ? formatCents(cents) : "money"}
        </Button>
      </div>
    </AppShell>
  );
}
