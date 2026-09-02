import { Link, useRouterState } from "@tanstack/react-router";
import {
  ArrowLeftRight,
  Camera,
  LayoutDashboard,
  LogIn,
  Menu,
  PiggyBank,
  Receipt,
  ShieldCheck,
  Smartphone,
  UserPlus,
  Wallet,
  X,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

const SECTIONS = [
  { href: "/#overview", label: "Overview", icon: LayoutDashboard },
  { href: "/#banking", label: "Accounts", icon: Wallet },
  { href: "/#tools", label: "Bill pay & budgets", icon: Receipt },
  { href: "/#deposit", label: "Mobile deposit", icon: Camera },
  { href: "/#security", label: "Security", icon: ShieldCheck },
] as const;

function Brand({ onNavigate }: { onNavigate?: (() => void) | undefined }) {
  return (
    <Link to="/" onClick={onNavigate} className="flex min-w-0 items-center gap-2.5">
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground">
        <ShieldCheck className="size-5" />
      </span>
      <span className="min-w-0 leading-none">
        <span className="block truncate font-display text-base font-semibold text-foreground">
          Empower
        </span>
        <span className="block truncate text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Credit Union
        </span>
      </span>
    </Link>
  );
}

function SidebarBody({ onNavigate }: { onNavigate?: (() => void) | undefined }) {
  return (
    <div className="flex h-full flex-col gap-6 p-5">
      <Brand onNavigate={onNavigate} />

      <nav className="space-y-1">
        <p className="px-3 pb-2 text-[0.65rem] font-bold uppercase tracking-[0.16em] text-muted-foreground">
          Explore
        </p>
        {SECTIONS.map((item) => (
          <a
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <item.icon className="size-[1.05rem] shrink-0" />
            <span className="truncate">{item.label}</span>
          </a>
        ))}
      </nav>

      <nav className="space-y-1">
        <p className="px-3 pb-2 text-[0.65rem] font-bold uppercase tracking-[0.16em] text-muted-foreground">
          Members
        </p>
        <Link
          to="/login"
          onClick={onNavigate}
          activeProps={{ className: "bg-muted text-foreground" }}
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <LogIn className="size-[1.05rem] shrink-0" /> Log in
        </Link>
        <Link
          to="/signup"
          onClick={onNavigate}
          activeProps={{ className: "bg-muted text-foreground" }}
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <UserPlus className="size-[1.05rem] shrink-0" /> Open an account
        </Link>
        <Link
          to="/home"
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Smartphone className="size-[1.05rem] shrink-0" /> Open the app
        </Link>
      </nav>

      <div className="mt-auto rounded-2xl bg-primary p-4 text-primary-foreground">
        <p className="font-display text-sm font-semibold">Bank in your pocket</p>
        <p className="mt-1 text-xs text-primary-foreground/75">
          One membership works on the site and in the app.
        </p>
        <Link
          to="/signup"
          onClick={onNavigate}
          className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-accent px-3.5 py-2 text-xs font-semibold text-accent-foreground"
        >
          <UserPlus className="size-3.5" /> Join today
        </Link>
      </div>
    </div>
  );
}

export function SitePage({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <div className="min-h-screen bg-background lg:grid lg:grid-cols-[17rem_minmax(0,1fr)]">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen border-r border-border/70 bg-card lg:block">
        <SidebarBody />
      </aside>

      {/* Mobile drawer */}
      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
          />
          <div className="absolute inset-y-0 left-0 w-[17rem] max-w-[85%] border-r border-border bg-card shadow-2xl">
            <button
              type="button"
              aria-label="Close menu"
              onClick={() => setOpen(false)}
              className="absolute right-3 top-4 grid size-9 place-items-center rounded-full border border-border bg-card text-foreground"
            >
              <X className="size-4" />
            </button>
            <SidebarBody onNavigate={() => setOpen(false)} />
          </div>
        </div>
      ) : null}

      <div className="flex min-h-screen flex-col">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-30 border-b border-border/70 bg-background/90 backdrop-blur lg:hidden">
          <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3">
            <button
              type="button"
              aria-label="Open menu"
              onClick={() => setOpen(true)}
              className="grid size-10 shrink-0 place-items-center rounded-full border border-border bg-card text-foreground active:bg-muted"
            >
              <Menu className="size-5" />
            </button>
            <div className="min-w-0">
              <Brand />
            </div>
            <Link
              to="/login"
              className="shrink-0 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
            >
              Log in
            </Link>
          </div>
        </header>

        {/* Desktop top bar */}
        <header className="sticky top-0 z-20 hidden border-b border-border/70 bg-background/90 px-8 py-4 backdrop-blur lg:block">
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              Member-owned banking · empowercu.com
            </p>
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="rounded-full px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
              >
                Log in
              </Link>
              <Link
                to="/signup"
                className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Open account
              </Link>
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 pb-10 pt-5 sm:px-6 lg:px-8 lg:pt-8">
          <div className="mx-auto w-full max-w-4xl">{children}</div>
        </main>

        <footer className="border-t border-border/70 bg-muted/40 px-4 py-8 sm:px-6 lg:px-8">
          <div className="mx-auto grid w-full max-w-4xl gap-6 text-sm sm:grid-cols-2">
            <div>
              <p className="font-display text-base font-semibold text-foreground">
                Empower Credit Union
              </p>
              <p className="mt-2 max-w-xs text-muted-foreground">
                Member-owned banking at empowercu.com. Balances and deposits in this build are
                simulated in our own ledger.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4 text-muted-foreground">
              <div className="space-y-2">
                <p className="font-semibold text-foreground">Members</p>
                <Link to="/login" className="block hover:text-foreground">Log in</Link>
                <Link to="/signup" className="block hover:text-foreground">Open an account</Link>
                <Link to="/home" className="block hover:text-foreground">Open the app</Link>
              </div>
              <div className="space-y-2">
                <p className="font-semibold text-foreground">Explore</p>
                <a href="/#banking" className="block hover:text-foreground">Accounts</a>
                <a href="/#tools" className="block hover:text-foreground">Money tools</a>
                <a href="/#security" className="block hover:text-foreground">Security</a>
              </div>
            </div>
          </div>
          <p className="mx-auto mt-8 w-full max-w-4xl text-xs text-muted-foreground">
            © {new Date().getFullYear()} Empower Credit Union. All rights reserved.
          </p>
        </footer>
      </div>
    </div>
  );
}

/** Card-style section heading matching the in-app look. */
export function SiteSectionTitle({ children, hint }: { children: ReactNode; hint?: ReactNode }) {
  return (
    <div className="mb-3 flex items-baseline justify-between gap-3">
      <h2 className="text-[0.78rem] font-bold uppercase tracking-[0.14em] text-muted-foreground">
        {children}
      </h2>
      {hint}
    </div>
  );
}

export const QUICK_ACTION_ICONS = { ArrowLeftRight, Receipt, Camera, PiggyBank };
