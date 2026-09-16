import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { ArrowLeft, ArrowRight, Check, Fingerprint, Loader2, Lock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";

const credentials = z.object({
  email: z.string().trim().email({ message: "Enter a valid email address" }).max(255),
  password: z.string().min(8, { message: "Password must be at least 8 characters" }).max(72),
  fullName: z.string().trim().max(80).optional(),
});


export function AuthForm({ mode }: { mode: "signin" | "signup" }) {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);


  useEffect(() => {
    let active = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (active && data.session) void navigate({ to: "/home" });
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && (event === "SIGNED_IN" || event === "INITIAL_SESSION")) {
        void navigate({ to: "/home" });
      }
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [navigate]);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (mode === "signup" && step === 1) {
      const details = z.object({
        fullName: z.string().trim().min(2, "Enter your full name").max(80),
        email: z.string().trim().email("Enter a valid email address").max(255),
      }).safeParse({ fullName, email });
      if (!details.success) {
        toast.error(details.error.issues[0]?.message ?? "Please check your details");
        return;
      }
      setStep(2);
      return;
    }
    const parsed = credentials.safeParse({ email, password, fullName });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Please check your details");
      return;
    }
    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: parsed.data.email,
          password: parsed.data.password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: parsed.data.fullName ?? "" },
          },
        });
        if (error) throw error;
        toast.success("Membership created.");
        if (!data.session) {
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email: parsed.data.email,
            password: parsed.data.password,
          });
          if (signInError) throw signInError;
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: parsed.data.email,
          password: parsed.data.password,
        });
        if (error) throw error;
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function onGoogle() {
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setBusy(false);
      toast.error("Google sign-in failed. Please try again.");
      return;
    }
    if (result.redirected) return;
    void navigate({ to: "/home" });
  }

  return (

    <div className="rounded-xl border border-border bg-card p-6 text-card-foreground shadow-lg shadow-foreground/5">
      {mode === "signup" ? (
        <div className="mb-6">
          <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
            <span>Step {step} of 2</span>
            <span>{step === 1 ? "Your details" : "Secure your account"}</span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2" aria-hidden="true">
            <span className="h-1 rounded-full bg-primary" />
            <span className={`h-1 rounded-full ${step === 2 ? "bg-primary" : "bg-muted"}`} />
          </div>
        </div>
      ) : null}
      <form onSubmit={onSubmit} className="space-y-4">
        {mode === "signup" && step === 1 ? (
          <div className="space-y-1.5">
            <Label htmlFor="fullName">Full name</Label>
            <Input
              id="fullName"
              autoComplete="name"
              maxLength={80}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Alex Morgan"
            />
          </div>
        ) : null}
        {mode === "signin" || step === 1 ? <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            maxLength={255}
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </div> : null}
        {mode === "signin" || step === 2 ? <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          {mode === "signup" ? (
            <p className="pb-1 text-sm text-muted-foreground">
              Creating membership for <span className="font-medium text-foreground">{email}</span>
            </p>
          ) : null}
          <Input
            id="password"
            type="password"
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            required
            maxLength={72}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
          />
          {mode === "signup" ? (
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Check className="size-3.5 text-primary" /> Use at least 8 characters
            </p>
          ) : null}
        </div> : null}

        <div className="flex gap-2">
          {mode === "signup" && step === 2 ? (
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => setStep(1)}
              aria-label="Back to your details"
              className="size-12 shrink-0 rounded-lg"
            >
              <ArrowLeft />
            </Button>
          ) : null}
          <Button type="submit" disabled={busy} className="h-12 flex-1 rounded-lg text-base">
            {busy ? <Loader2 className="size-4 animate-spin" /> : mode === "signup" && step === 1 ? <ArrowRight /> : <Lock />}
            {mode === "signin" ? "Sign in securely" : step === 1 ? "Continue" : "Create my membership"}
          </Button>
        </div>
      </form>

      {mode === "signin" || step === 1 ? <><div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        or
        <span className="h-px flex-1 bg-border" />
      </div>

      <Button
        type="button"
        variant="outline"
        disabled={busy}
        onClick={onGoogle}
        className="h-12 w-full rounded-lg text-base"
      >
        Continue with Google
      </Button></> : null}

      <p className="mt-5 flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
        <Fingerprint className="mt-0.5 size-4 shrink-0" />
        Sessions are encrypted end to end. We never store your card PIN, and every member only ever
        sees their own accounts.
      </p>
    </div>
  );
}
