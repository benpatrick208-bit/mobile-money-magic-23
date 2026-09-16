import { Link, useRouter } from "@tanstack/react-router";
import { ArrowLeft, Camera, CircleUser, Home, PiggyBank, Receipt, Wallet } from "lucide-react";
import type { ReactNode } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";

const TABS = [
  { to: "/home", label: "Home", icon: Home },
  { to: "/accounts", label: "Accounts", icon: Wallet },
  { to: "/pay", label: "Pay", icon: Receipt },
  { to: "/budgets", label: "Budgets", icon: PiggyBank },
  { to: "/deposit", label: "Deposit", icon: Camera },
] as const;

export function AppShell({
  title,
  subtitle,
  children,
  back,
  action,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  back?: boolean;
  action?: ReactNode;
}) {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-20 border-b border-border/70 bg-background/85 backdrop-blur-lg">
        <div className="mx-auto flex max-w-md items-center gap-3 px-5 pb-3 pt-4">
          {back ? (
            <button
              type="button"
              onClick={() => router.history.back()}
              aria-label="Go back"
              className="-ml-1 grid size-9 shrink-0 place-items-center rounded-full border border-border bg-card text-foreground transition-colors active:bg-muted"
            >
              <ArrowLeft className="size-4" />
            </button>
          ) : null}
          <div className="min-w-0 flex-1">
            {subtitle ? (
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                {subtitle}
              </p>
            ) : null}
            <h1 className="truncate text-[1.35rem] font-semibold leading-tight tracking-tight">
              {title}
            </h1>
          </div>
          <ThemeToggle />
          {action ?? (
            <Link
              to="/profile"
              aria-label="Profile and security"
              className="grid size-10 shrink-0 place-items-center rounded-full border border-border bg-card text-primary transition-colors active:bg-muted"
            >
              <CircleUser className="size-5" />
            </Link>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-md px-5 pt-6">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border/70 bg-card/95 backdrop-blur-lg">
        <ul className="mx-auto flex max-w-md items-stretch justify-between px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2">
          {TABS.map((tab) => (
            <li key={tab.to} className="flex-1">
              <Link
                to={tab.to}
                className="group flex flex-col items-center gap-1 rounded-lg px-1 py-1.5 text-muted-foreground transition-colors data-[status=active]:text-primary"
                activeProps={{ "aria-current": "page" }}
              >
                <span className="grid size-9 place-items-center rounded-lg transition-colors group-data-[status=active]:bg-primary/10">
                  <tab.icon className="size-[1.15rem]" />
                </span>
                <span className="text-[0.63rem] font-semibold tracking-wide">{tab.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-3 flex items-baseline justify-between">
      <h2 className="text-[0.78rem] font-bold uppercase tracking-[0.14em] text-muted-foreground">
        {children}
      </h2>
      {action}
    </div>
  );
}
