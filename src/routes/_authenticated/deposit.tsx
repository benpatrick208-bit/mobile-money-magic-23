import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Camera, CheckCircle2, ChevronRight, Loader2, Upload } from "lucide-react";

import { AppShell, SectionTitle } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useAccounts } from "@/hooks/useMember";
import { formatCents, parseAmountToCents } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/deposit")({
  head: () => ({
    meta: [
      { title: "Mobile deposit — Empower Credit Union" },
      {
        name: "description",
        content: "Deposit checks securely from your phone with Empower Credit Union.",
      },
      { property: "og:title", content: "Mobile deposit — Empower Credit Union" },
      { property: "og:description", content: "Snap or upload check photos and deposit to your account." },
    ],
  }),
  component: DepositPage,
});

type Deposit = {
  id: string;
  amount_cents: number;
  status: string;
  created_at: string;
};

const CHECK_BUCKET = "check-deposits";

function DepositPage() {
  const navigate = useNavigate();
  const accounts = useAccounts();
  const queryClient = useQueryClient();

  const [accountId, setAccountId] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [frontFile, setFrontFile] = useState<File | null>(null);
  const [backFile, setBackFile] = useState<File | null>(null);
  const [frontPreview, setFrontPreview] = useState<string | null>(null);
  const [backPreview, setBackPreview] = useState<string | null>(null);
  const [step, setStep] = useState<"form" | "review" | "done">("form");

  useEffect(() => {
    if (!accountId && accounts.data?.length) setAccountId(accounts.data[0]!.id);
  }, [accounts.data, accountId]);

  const history = useQuery({
    queryKey: ["check_deposits"],
    queryFn: async (): Promise<Deposit[]> => {
      const { data, error } = await supabase
        .from("check_deposits")
        .select("id, amount_cents, status, created_at")
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return (data ?? []) as Deposit[];
    },
  });

  const submit = useMutation({
    mutationFn: async () => {
      const cents = parseAmountToCents(amount);
      if (!cents) throw new Error("Enter an amount greater than zero");
      if (!accountId) throw new Error("Choose a deposit account");
      if (!frontFile || !backFile) throw new Error("Add front and back check photos");

      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user!.id;
      const timestamp = Date.now();

      const frontPath = `${userId}/${timestamp}-front.jpg`;
      const backPath = `${userId}/${timestamp}-back.jpg`;

      const { error: frontError } = await supabase.storage
        .from(CHECK_BUCKET)
        .upload(frontPath, frontFile, { upsert: false });
      if (frontError) throw frontError;

      const { error: backError } = await supabase.storage
        .from(CHECK_BUCKET)
        .upload(backPath, backFile, { upsert: false });
      if (backError) throw backError;

      const { error } = await supabase.rpc("submit_check_deposit", {
        p_account: accountId,
        p_amount: cents,
        p_front: frontPath,
        p_back: backPath,
        ...(note.trim() ? { p_note: note.trim().slice(0, 140) } : {}),
      });
      if (error) throw error;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["accounts"] }),
        queryClient.invalidateQueries({ queryKey: ["transactions"] }),
        queryClient.invalidateQueries({ queryKey: ["check_deposits"] }),
      ]);
      setStep("done");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  function onReview() {
    const cents = parseAmountToCents(amount);
    if (!cents || !accountId || !frontFile || !backFile) {
      toast.error("Enter amount, account, and both check photos");
      return;
    }
    setStep("review");
  }

  function pickFile(side: "front" | "back") {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.capture = "environment";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0] ?? null;
      if (!file) return;
      const url = URL.createObjectURL(file);
      if (side === "front") {
        setFrontFile(file);
        setFrontPreview(url);
      } else {
        setBackFile(file);
        setBackPreview(url);
      }
    };
    input.click();
  }

  const account = accounts.data?.find((a) => a.id === accountId);
  const cents = parseAmountToCents(amount);

  if (step === "done") {
    return (
      <AppShell title="Deposit submitted" subtitle="Mobile deposit">
        <div className="rounded-3xl border border-border bg-card p-7 text-center">
          <span className="mx-auto grid size-14 place-items-center rounded-full bg-positive/15 text-positive">
            <CheckCircle2 className="size-7" />
          </span>
          <p className="tnum mt-4 font-display text-3xl font-semibold">
            {formatCents(cents ?? 0)}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">Deposit to {account?.name}</p>
          <p className="mt-4 text-sm text-muted-foreground">
            We received your check images. Funds usually appear within one business day after review.
          </p>
          <Button className="mt-6 h-12 w-full rounded-xl" onClick={() => navigate({ to: "/home" })}>
            Back to home
          </Button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell back title="Mobile deposit" subtitle="Deposit a check">
      {step === "form" ? (
        <div className="space-y-5">
          <div className="rounded-3xl border border-border bg-card p-5">
            <Label htmlFor="depositAmount" className="text-xs uppercase tracking-widest text-muted-foreground">
              Amount
            </Label>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="font-display text-3xl text-muted-foreground">$</span>
              <input
                id="depositAmount"
                inputMode="decimal"
                value={amount}
                maxLength={12}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="tnum w-full bg-transparent font-display text-4xl font-semibold outline-none placeholder:text-muted-foreground/40"
              />
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4">
            <Label htmlFor="depositAccount" className="text-xs uppercase tracking-widest text-muted-foreground">
              Deposit to
            </Label>
            {accounts.isLoading ? (
              <Skeleton className="mt-2 h-6 w-40" />
            ) : (
              <select
                id="depositAccount"
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

          <SectionTitle>Check photos</SectionTitle>
          <div className="grid grid-cols-2 gap-3">
            <PhotoSlot
              label="Front"
              preview={frontPreview}
              onClick={() => pickFile("front")}
              done={!!frontFile}
            />
            <PhotoSlot
              label="Back"
              preview={backPreview}
              onClick={() => pickFile("back")}
              done={!!backFile}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="depositNote">Description (optional)</Label>
            <Input
              id="depositNote"
              maxLength={140}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Paycheck #1024"
              className="h-11 rounded-xl"
            />
          </div>

          <Button onClick={onReview} className="h-12 w-full rounded-xl text-base">
            Review deposit
            <ChevronRight className="ml-1 size-4" />
          </Button>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="rounded-3xl bg-primary p-6 text-primary-foreground">
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-primary-foreground/70">
              You're depositing
            </p>
            <p className="tnum mt-1 font-display text-4xl font-semibold">{formatCents(cents ?? 0)}</p>
          </div>

          <dl className="divide-y divide-border rounded-2xl border border-border bg-card px-5">
            {[
              ["To account", `${account?.name} ···· ${account?.mask}`],
              ["Description", note.trim() || "—"],
              ["Status after submit", "Pending review"],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between py-3.5">
                <dt className="text-sm text-muted-foreground">{label}</dt>
                <dd className="max-w-[60%] truncate text-sm font-semibold">{value}</dd>
              </div>
            ))}
          </dl>

          <div className="grid grid-cols-2 gap-3">
            {frontPreview && (
              <img
                src={frontPreview}
                alt="Check front preview"
                className="aspect-[4/3] rounded-xl border border-border object-cover"
              />
            )}
            {backPreview && (
              <img
                src={backPreview}
                alt="Check back preview"
                className="aspect-[4/3] rounded-xl border border-border object-cover"
              />
            )}
          </div>

          <Button
            disabled={submit.isPending}
            onClick={() => submit.mutate()}
            className="h-12 w-full rounded-xl text-base"
          >
            {submit.isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
            Submit deposit
          </Button>
          <Button variant="ghost" className="h-11 w-full rounded-xl" onClick={() => setStep("form")}>
            Edit details
          </Button>
        </div>
      )}

      <section className="mt-8">
        <SectionTitle>Recent deposits</SectionTitle>
        {history.isLoading ? (
          <Skeleton className="h-16 w-full rounded-2xl" />
        ) : (history.data ?? []).length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border bg-card/60 px-4 py-8 text-center text-sm text-muted-foreground">
            No deposits yet.
          </p>
        ) : (
          <ul className="rounded-2xl border border-border bg-card px-4">
            {(history.data ?? []).map((d) => (
              <li
                key={d.id}
                className="flex items-center justify-between border-b border-border/60 py-3.5 last:border-0"
              >
                <div>
                  <p className="font-semibold">{formatCents(d.amount_cents)}</p>
                  <p className="text-xs capitalize text-muted-foreground">{d.status}</p>
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(d.created_at).toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </AppShell>
  );
}

function PhotoSlot({
  label,
  preview,
  onClick,
  done,
}: {
  label: string;
  preview: string | null;
  onClick: () => void;
  done: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative flex aspect-[4/3] flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl border border-border bg-card text-muted-foreground transition-colors active:bg-muted"
    >
      {preview ? (
        <img src={preview} alt={`Check ${label.toLowerCase()} preview`} className="absolute inset-0 size-full object-cover" />
      ) : (
        <>
          {done ? <Camera className="size-6" /> : <Upload className="size-6" />}
          <span className="text-xs font-semibold">{label}</span>
        </>
      )}
    </button>
  );
}
