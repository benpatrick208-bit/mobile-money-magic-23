import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { KeyRound, Lock, LogOut, Mail, Phone, ShieldCheck, User } from "lucide-react";

import { AppShell, SectionTitle } from "@/components/AppShell";
import { CurrencySwitcher } from "@/components/CurrencySwitcher";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useMember";
import { setCurrencyCode } from "@/lib/currency";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Profile & Security — Empower Credit Union" },
      {
        name: "description",
        content: "Manage your Empower Credit Union profile, security settings, and password.",
      },
      { property: "og:title", content: "Profile & Security — Empower Credit Union" },
      { property: "og:description", content: "Update your profile and security settings." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const navigate = useNavigate();
  const profile = useProfile();
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");

  const hasPin = !!profile.data?.pin_set_at;

  // Apply the currency saved on the member's profile.
  useEffect(() => {
    const saved = profile.data?.preferred_currency;
    if (saved) setCurrencyCode(saved);
  }, [profile.data?.preferred_currency]);

  async function saveCurrency(code: string) {
    if (!profile.data?.id) return;
    const { error } = await supabase
      .from("profiles")
      .update({ preferred_currency: code })
      .eq("id", profile.data.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ["profile"] });
    toast.success(`Showing balances in ${code}`);
  }

  async function savePin() {
    if (!/^\d{4,6}$/.test(newPin)) {
      toast.error("PIN must be 4 to 6 digits");
      return;
    }
    if (newPin !== confirmPin) {
      toast.error("PINs do not match");
      return;
    }
    if (hasPin && !/^\d{4,6}$/.test(currentPin)) {
      toast.error("Enter your current PIN");
      return;
    }
    setBusy(true);
    const { error } = await supabase.rpc("set_transaction_pin", {
      p_pin: newPin,
      ...(hasPin ? { p_current_pin: currentPin } : {}),
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setCurrentPin("");
    setNewPin("");
    setConfirmPin("");
    await queryClient.invalidateQueries({ queryKey: ["profile"] });
    toast.success(hasPin ? "Transaction PIN updated" : "Transaction PIN set");
  }


  async function signOut() {
    setBusy(true);
    const { error } = await supabase.auth.signOut();
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Signed out");
    void navigate({ to: "/" });
  }

  async function changePassword() {
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords do not match");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Password updated");
    setPassword("");
    setConfirm("");
  }

  return (
    <AppShell title="Profile & Security" subtitle="Your account">
      <section className="rounded-3xl border border-border bg-card p-5">
        <div className="flex items-center gap-4">
          <span className="grid size-14 place-items-center rounded-full bg-primary text-primary-foreground">
            <User className="size-7" />
          </span>
          <div className="min-w-0 flex-1">
            {profile.isLoading ? (
              <>
                <Skeleton className="h-5 w-40" />
                <Skeleton className="mt-2 h-4 w-56" />
              </>
            ) : (
              <>
                <p className="truncate font-semibold">
                  {profile.data?.full_name || profile.data?.email || "Member"}
                </p>
                <p className="truncate text-sm text-muted-foreground">{profile.data?.email}</p>
              </>
            )}
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <div className="flex items-start gap-3 rounded-2xl bg-muted/60 p-4">
            <Mail className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Email</p>
              <p className="text-sm text-muted-foreground">
                {profile.isLoading ? "Loading…" : profile.data?.email ?? "—"}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-2xl bg-muted/60 p-4">
            <Phone className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Phone</p>
              <p className="text-sm text-muted-foreground">
                {profile.isLoading ? "Loading…" : profile.data?.phone ?? "Not on file"}
              </p>
            </div>
          </div>
          <CurrencySwitcher onChange={(code) => void saveCurrency(code)} />
        </div>
      </section>

      <section className="mt-7 rounded-3xl border border-border bg-card p-5">
        <SectionTitle>
          <span className="flex items-center gap-2">
            <Lock className="size-4" /> Transaction PIN
          </span>
        </SectionTitle>
        <p className="-mt-1 mb-4 text-sm text-muted-foreground">
          {hasPin
            ? "Your PIN is required to add money and move funds."
            : "Set a 4-6 digit PIN to confirm money movement."}
        </p>
        <div className="space-y-4">
          {hasPin ? (
            <div className="space-y-1.5">
              <Label htmlFor="currentPin">Current PIN</Label>
              <Input
                id="currentPin"
                type="password"
                inputMode="numeric"
                maxLength={6}
                autoComplete="off"
                value={currentPin}
                onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, ""))}
                placeholder="••••"
                className="h-11 rounded-xl tracking-[0.5em]"
              />
            </div>
          ) : null}
          <div className="space-y-1.5">
            <Label htmlFor="newPin">{hasPin ? "New PIN" : "Create PIN"}</Label>
            <Input
              id="newPin"
              type="password"
              inputMode="numeric"
              maxLength={6}
              autoComplete="off"
              value={newPin}
              onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ""))}
              placeholder="4-6 digits"
              className="h-11 rounded-xl tracking-[0.5em]"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirmPin">Confirm PIN</Label>
            <Input
              id="confirmPin"
              type="password"
              inputMode="numeric"
              maxLength={6}
              autoComplete="off"
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ""))}
              placeholder="Re-enter PIN"
              className="h-11 rounded-xl tracking-[0.5em]"
            />
          </div>
          <Button onClick={savePin} disabled={busy} className="h-11 w-full rounded-xl">
            <Lock className="mr-2 size-4" />
            {hasPin ? "Update PIN" : "Set PIN"}
          </Button>
        </div>
      </section>

      <section className="mt-7 rounded-3xl border border-border bg-card p-5">
        <SectionTitle>
          <span className="flex items-center gap-2">
            <ShieldCheck className="size-4" /> Security
          </span>
        </SectionTitle>


        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="newPassword">New password</Label>
            <Input
              id="newPassword"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              className="h-11 rounded-xl"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword">Confirm new password</Label>
            <Input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Re-enter password"
              className="h-11 rounded-xl"
            />
          </div>
          <Button
            onClick={changePassword}
            disabled={busy}
            className="h-11 w-full rounded-xl"
          >
            <KeyRound className="mr-2 size-4" />
            Update password
          </Button>
        </div>
      </section>

      <Button
        variant="outline"
        onClick={signOut}
        disabled={busy}
        className="mt-7 h-12 w-full rounded-xl"
      >
        <LogOut className="mr-2 size-4" />
        Sign out
      </Button>
    </AppShell>
  );
}
