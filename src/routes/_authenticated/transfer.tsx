import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowDown, CheckCircle2, Loader2 } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAccounts } from "@/hooks/useMember";
import { formatCents, parseAmountToCents } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/transfer")({
  head: () => ({
    meta: [
      { title: "Transfer money — Empower Credit Union" },
      {
        name: "description",
        content: "Move money instantly between your Empower Credit Union checking and savings accounts.",
      },
      { property: "og:title", content: "Transfer money — Empower Credit Union" },
      { property: "og:description", content: "Instant transfers between your own accounts." },
    ],
  }),
  component: TransferPage,
});

function TransferPage() {
  const accounts = useAccounts();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("");
  const [step, setStep] = useState<"form" | "review" | "done">("form");

  useEffect(() => {
    const list = accounts.data ?? [];
    if (list.length >= 2 && !from && !to) {
      setFrom(list[0]!.id);
      setTo(list[1]!.id);
    }
  }, [accounts.data, from, to]);

  const list = accounts.data ?? [];
  const fromAccount = list.find((a) => a.id === from);
  const toAccount = list.find((a) => a.id === to);
  const cents = parseAmountToCents(amount);

  const transfer = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc("perform_transfer", {
        p_from: from,
        p_to: to,
        p_amount: cents!,
        ...(memo.trim() ? { p_memo: memo.trim().slice(0, 140) } : {}),
      });
      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["accounts"] });
      await queryClient.invalidateQueries({ queryKey: ["transactions"] });
      setStep("done");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  function onReview() {
    if (!cents) {
      toast.error("Enter an amount greater than zero");
      return;
    }
    if (from === to) {
      toast.error("Choose two different accounts");
      return;
    }
    if (fromAccount && fromAccount.balance_cents < cents) {
      toast.error("That's more than the available balance");
      return;
    }
    setStep("review");
  }

  if (step === "done") {
    return (
      <AppShell title="Transfer complete" subtitle="Confirmation">
        <div className="rounded-3xl border border-border bg-card p-7 text-center">
          <span className="mx-auto grid size-14 place-items-center rounded-full bg-positive/15 text-positive">
            <CheckCircle2 className="size-7" />
          </span>
          <p className="tnum mt-4 font-display text-3xl font-semibold">
            {formatCents(cents ?? 0)}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {fromAccount?.name} → {toAccount?.name}
          </p>
          <div className="mt-6 grid gap-2">
            <Button className="h-12 rounded-xl" onClick={() => navigate({ to: "/home" })}>
              Back to home
            </Button>
            <Button
              variant="outline"
              className="h-12 rounded-xl"
              onClick={() => {
                setAmount("");
                setMemo("");
                setStep("form");
              }}
            >
              Make another transfer
            </Button>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell back title="Transfer" subtitle="Move money">
      {step === "form" ? (
        <div className="space-y-5">
          <div className="rounded-3xl border border-border bg-card p-5">
            <Label htmlFor="amount" className="text-xs uppercase tracking-widest text-muted-foreground">
              Amount
            </Label>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="font-display text-3xl text-muted-foreground">$</span>
              <input
                id="amount"
                inputMode="decimal"
                value={amount}
                maxLength={12}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="tnum w-full bg-transparent font-display text-4xl font-semibold outline-none placeholder:text-muted-foreground/40"
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="rounded-2xl border border-border bg-card p-4">
              <Label htmlFor="from" className="text-xs uppercase tracking-widest text-muted-foreground">
                From
              </Label>
              <select
                id="from"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="mt-1 w-full bg-transparent text-base font-semibold outline-none"
              >
                {list.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ···· {a.mask} · {formatCents(a.balance_cents)}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-center">
              <span className="grid size-9 place-items-center rounded-full bg-primary text-primary-foreground">
                <ArrowDown className="size-4" />
              </span>
            </div>
            <div className="rounded-2xl border border-border bg-card p-4">
              <Label htmlFor="to" className="text-xs uppercase tracking-widest text-muted-foreground">
                To
              </Label>
              <select
                id="to"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="mt-1 w-full bg-transparent text-base font-semibold outline-none"
              >
                {list.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ···· {a.mask} · {formatCents(a.balance_cents)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="memo">Description (optional)</Label>
            <Input
              id="memo"
              maxLength={140}
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="Rainy day fund"
              className="h-11 rounded-xl"
            />
          </div>

          <Button onClick={onReview} className="h-12 w-full rounded-xl text-base">
            Review transfer
          </Button>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="rounded-3xl bg-primary p-6 text-primary-foreground">
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-primary-foreground/70">
              You're sending
            </p>
            <p className="tnum mt-1 font-display text-4xl font-semibold">{formatCents(cents ?? 0)}</p>
          </div>
          <dl className="divide-y divide-border rounded-2xl border border-border bg-card px-5">
            {[
              ["From", `${fromAccount?.name} ···· ${fromAccount?.mask}`],
              ["To", `${toAccount?.name} ···· ${toAccount?.mask}`],
              ["Description", memo.trim() || "—"],
              ["Arrives", "Immediately"],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between py-3.5">
                <dt className="text-sm text-muted-foreground">{label}</dt>
                <dd className="max-w-[60%] truncate text-sm font-semibold">{value}</dd>
              </div>
            ))}
          </dl>
          <Button
            disabled={transfer.isPending}
            onClick={() => transfer.mutate()}
            className="h-12 w-full rounded-xl text-base"
          >
            {transfer.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
            Confirm transfer
          </Button>
          <Button
            variant="ghost"
            className="h-11 w-full rounded-xl"
            onClick={() => setStep("form")}
          >
            Edit details
          </Button>
        </div>
      )}
    </AppShell>
  );
}
