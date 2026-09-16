import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeftRight,
  ArrowRight,
  Camera,
  ChevronRight,
  Landmark,
  LineChart,
  Lock,
  PiggyBank,
  PlusCircle,
  Receipt,
  ShieldCheck,
  Smartphone,
} from "lucide-react";

import { SitePage, SiteSectionTitle } from "@/components/SiteChrome";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Empower Credit Union — Member-Owned Banking" },
      {
        name: "description",
        content:
          "Empower Credit Union offers free checking and savings, instant transfers, bill pay, budgeting tools and mobile check deposit. Open an account or log in.",
      },
      { property: "og:title", content: "Empower Credit Union — Member-Owned Banking" },
      {
        property: "og:description",
        content:
          "Free checking and savings, instant transfers, bill pay, budgets and mobile deposit — all in one member-owned account.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LandingPage,
});

const QUICK_ACTIONS = [
  { label: "Add money", icon: PlusCircle },
  { label: "Transfer", icon: ArrowLeftRight },
  { label: "Pay a bill", icon: Receipt },
  { label: "Deposit", icon: Camera },
] as const;

const SAMPLE_ACCOUNTS = [
  { name: "Everyday Checking", kind: "checking", mask: "4821", amount: "$3,204.18" },
  { name: "Member Savings", kind: "savings", mask: "9106", amount: "$9,276.47" },
] as const;

const SAMPLE_ACTIVITY = [
  { name: "Riverline Power", note: "Bill payment", amount: "-$142.60" },
  { name: "Payroll deposit", note: "Added money", amount: "+$2,410.00" },
  { name: "Member Savings", note: "Transfer", amount: "-$300.00" },
] as const;

const ACCOUNT_FEATURES = [
  {
    icon: Landmark,
    title: "Everyday Checking",
    body: "No monthly fees, no minimum balance, and a balance you can trust to the cent.",
  },
  {
    icon: PiggyBank,
    title: "Member Savings",
    body: "Keep savings separate and move money back the moment you need it.",
  },
  {
    icon: ArrowLeftRight,
    title: "Instant transfers",
    body: "Move money between accounts with a description on every transfer, posted immediately.",
  },
] as const;

const TOOL_FEATURES = [
  {
    icon: Receipt,
    title: "Bill pay",
    body: "Save payees once, then schedule one-time or monthly payments from any account.",
  },
  {
    icon: LineChart,
    title: "Budgets",
    body: "Set monthly limits by category and track spending against them in real time.",
  },
] as const;

function LandingPage() {
  return (
    <SitePage>
      {/* Hero */}
      <section id="overview" className="scroll-mt-24">
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Member owned since 1953
        </p>
        <h1 className="mt-3 max-w-2xl font-display text-[2.6rem] font-normal leading-[1.02] text-foreground sm:text-5xl">
          Banking that answers to you, not shareholders.
        </h1>
        <p className="mt-3 max-w-lg text-sm text-muted-foreground sm:text-base">
          Checking, savings, transfers, bill pay, budgets and mobile check deposit — one membership,
          on the site and in the app.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            to="/signup"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Open an account <ArrowRight className="size-4" />
          </Link>
          <Link
            to="/home"
            className="inline-flex items-center gap-2 rounded-full border border-input px-5 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
          >
            <Smartphone className="size-4" /> Open the app
          </Link>
        </div>
        <p className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
          <Lock className="size-3.5 shrink-0" /> One secure login shared by the site and the app.
        </p>
      </section>

      {/* Dashboard preview — mirrors the in-app cards */}
      <section className="mt-8">
        <SiteSectionTitle hint={<span className="text-xs text-muted-foreground">Sample view</span>}>
          Your dashboard
        </SiteSectionTitle>

        <div className="overflow-hidden rounded-xl bg-primary p-6 text-primary-foreground shadow-lg shadow-primary/10">
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-primary-foreground/70">
            Total balance
          </p>
           <p className="mt-2 font-display text-[3rem] font-normal leading-none sm:text-[3.5rem]">
            $12,480<span className="text-2xl text-primary-foreground/70">.65</span>
          </p>
          <p className="mt-3 text-xs text-primary-foreground/70">
            Across 2 accounts · Federally insured · Shown in your chosen currency
          </p>
        </div>

        <div className="mt-4 grid grid-cols-4 gap-2">
          {QUICK_ACTIONS.map((action) => (
            <div
              key={action.label}
              className="flex flex-col items-center gap-2 rounded-lg border border-border bg-card px-2 py-4 text-center shadow-sm"
            >
              <span className="grid size-10 place-items-center rounded-full bg-accent/25 text-accent-foreground">
                <action.icon className="size-[1.1rem]" />
              </span>
              <span className="text-[0.7rem] font-semibold leading-tight sm:text-xs">
                {action.label}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="space-y-3">
            {SAMPLE_ACCOUNTS.map((account) => (
              <div
                key={account.mask}
                 className="flex items-center gap-3 rounded-lg border border-border bg-card p-4 shadow-sm"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-foreground">{account.name}</p>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">
                    {account.kind} ···· {account.mask}
                  </p>
                </div>
                <span className="shrink-0 font-display text-lg font-semibold text-foreground">
                  {account.amount}
                </span>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
              </div>
            ))}
          </div>

          <ul className="divide-y divide-border rounded-lg border border-border bg-card px-4 shadow-sm">
            {SAMPLE_ACTIVITY.map((item) => (
              <li key={item.name} className="flex items-center gap-3 py-3.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">{item.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{item.note}</p>
                </div>
                <span
                  className={`shrink-0 text-sm font-semibold ${
                    item.amount.startsWith("+") ? "text-primary" : "text-foreground"
                  }`}
                >
                  {item.amount}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Accounts */}
      <section id="banking" className="mt-10 scroll-mt-24">
        <SiteSectionTitle>Everyday banking</SiteSectionTitle>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ACCOUNT_FEATURES.map((item) => (
            <article key={item.title} className="rounded-lg border border-border bg-card p-5 shadow-sm">
              <span className="grid size-10 place-items-center rounded-xl bg-secondary text-secondary-foreground">
                <item.icon className="size-5" />
              </span>
              <h3 className="mt-3 font-display text-base font-semibold text-foreground">
                {item.title}
              </h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Tools */}
      <section id="tools" className="mt-10 scroll-mt-24">
        <SiteSectionTitle>Money tools built in</SiteSectionTitle>
        <div className="grid gap-3 sm:grid-cols-2">
          {TOOL_FEATURES.map((item) => (
            <article key={item.title} className="rounded-lg border border-border bg-card p-5 shadow-sm">
              <span className="grid size-10 place-items-center rounded-xl bg-secondary text-secondary-foreground">
                <item.icon className="size-5" />
              </span>
              <h3 className="mt-3 font-display text-base font-semibold text-foreground">
                {item.title}
              </h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Deposit */}
      <section id="deposit" className="mt-10 scroll-mt-24">
        <SiteSectionTitle>Mobile deposit</SiteSectionTitle>
        <div className="grid gap-4 rounded-xl border border-border bg-card p-6 shadow-sm lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div>
            <span className="grid size-10 place-items-center rounded-xl bg-accent/25 text-accent-foreground">
              <Camera className="size-5" />
            </span>
            <h3 className="mt-3 font-display text-lg font-semibold text-foreground">
              Deposit a check from anywhere
            </h3>
            <p className="mt-1.5 max-w-md text-sm text-muted-foreground">
              Photograph the front and back, add a description, choose the account and review before
              you submit. Check images are stored privately and never shared.
            </p>
          </div>
          <Link
            to="/signup"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Get started <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>

      {/* Security */}
      <section id="security" className="mt-10 scroll-mt-24">
        <SiteSectionTitle>Security</SiteSectionTitle>
        <div className="grid gap-5 rounded-xl bg-primary p-6 text-primary-foreground sm:p-8">
          <div>
            <span className="grid size-10 place-items-center rounded-xl bg-primary-foreground/15">
              <ShieldCheck className="size-5" />
            </span>
            <h3 className="mt-3 font-display text-xl font-semibold sm:text-2xl">
              Security you can feel
            </h3>
            <p className="mt-2 max-w-lg text-sm text-primary-foreground/80">
              Every member only ever sees their own accounts. Money movement is validated on our
              servers, balances change atomically, and a transaction PIN protects deposits and
              top-ups.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-3 text-sm font-semibold text-accent-foreground"
            >
              Become a member <ArrowRight className="size-4" />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/30 px-5 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-foreground/10"
            >
              Log in
            </Link>
          </div>
        </div>
      </section>
    </SitePage>
  );
}
