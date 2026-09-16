import { createFileRoute, Link } from "@tanstack/react-router";

import { AuthForm } from "@/components/AuthForm";
import { SitePage } from "@/components/SiteChrome";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Member log in — Empower Credit Union" },
      {
        name: "description",
        content:
          "Log in to Empower Credit Union online banking to check balances, transfer funds, pay bills and deposit checks.",
      },
      { property: "og:title", content: "Member log in — Empower Credit Union" },
      {
        property: "og:description",
        content: "Secure member log in for Empower Credit Union online and mobile banking.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  return (
    <SitePage>
      <div className="mx-auto w-full max-w-md px-1 py-10 sm:py-14">
        <p className="text-xs font-semibold uppercase text-primary">Secure member access</p>
        <h1 className="mt-2 font-display text-4xl font-normal text-foreground">
          Welcome back
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Log in to your Empower accounts. Same login for the website and the app.
        </p>
        <div className="mt-7">
          <AuthForm mode="signin" />
        </div>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Not a member yet?{" "}
          <Link to="/signup" className="font-semibold text-primary hover:underline">
            Open an account
          </Link>
        </p>
      </div>
    </SitePage>
  );
}
