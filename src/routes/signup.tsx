import { createFileRoute, Link } from "@tanstack/react-router";

import { AuthForm } from "@/components/AuthForm";
import { SitePage } from "@/components/SiteChrome";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Open an account — Empower Credit Union" },
      {
        name: "description",
        content:
          "Become an Empower Credit Union member in minutes: free checking and savings, budgeting tools and mobile check deposit.",
      },
      { property: "og:title", content: "Open an account — Empower Credit Union" },
      {
        property: "og:description",
        content: "Join Empower Credit Union — member-owned banking with no monthly fees.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SignupPage,
});

function SignupPage() {
  return (
    <SitePage>
      <div className="mx-auto w-full max-w-md px-1 py-10 sm:py-14">
        <p className="text-xs font-semibold uppercase text-primary">Membership in minutes</p>
        <h1 className="mt-2 font-display text-4xl font-normal text-foreground">
          Open your account
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your membership comes with Everyday Checking and Member Savings, ready in seconds.
        </p>
        <div className="mt-7">
          <AuthForm mode="signup" />
        </div>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already a member?{" "}
          <Link to="/login" className="font-semibold text-primary hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </SitePage>
  );
}
