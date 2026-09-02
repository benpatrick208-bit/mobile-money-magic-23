# Empower Credit Union — Mobile Banking App

A mobile-first banking app with real accounts, login, and persistent data powered by Lovable Cloud.

## Screens

1. **Auth** — email/password sign up and sign in, session persistence, sign out. New members get two demo accounts (Checking, Savings) seeded on first login so the app is never empty.
2. **Home / Dashboard** — greeting, total balance, account cards (Checking, Savings) with balances, quick actions (Transfer, Pay Bill, Deposit), and the 5 most recent transactions.
3. **Accounts detail** — per-account balance, available vs. current, and full paginated transaction history with search and category/date filters.
4. **Transfers** — move money between own accounts or to a saved recipient; amount entry, review step, confirmation. Balances update atomically.
5. **Bill Pay** — list of payees, add a payee, schedule a one-time or recurring payment, upcoming payments list, payment history.
6. **Budgets** — monthly spend by category with progress bars vs. limits, set/edit category budgets, month-over-month spend summary.
7. **Mobile Deposit** — capture or upload front and back of the check, enter amount, choose deposit account, review and submit. Images stored privately; deposit lands as a pending transaction with status (pending / accepted / rejected).
8. **Profile & Security** — name, contact info, sign out, and a security section (recent sign-ins, change password).

Bottom tab navigation: Home, Accounts, Pay, Budgets, Deposit — with Profile in the header.

## Design

Credit-union trustworthy but modern: confident deep-tone brand color with a warm accent, generous card surfaces, large legible balance typography, subtle motion on balance reveal and transaction rows. I will generate a few design directions for you to pick before building the UI.

## Data & security (technical)

Lovable Cloud (Postgres + auth + storage). Tables: `profiles`, `accounts`, `transactions`, `payees`, `bill_payments`, `transfers`, `budgets`, `check_deposits`.

- Row Level Security on every table: a user can only read/write rows tied to their own `auth.uid()`. Money movement (transfers, bill payments, deposits) runs through server functions with server-side validation, never client-side balance writes.
- Balance changes happen in a single transactional database function so a transfer can never debit without crediting.
- Check images go to a private storage bucket with per-user path policies and signed URLs; never public.
- All amounts stored as integer cents to avoid floating-point drift.
- Zod validation on every form, client and server.

## Out of scope for this first build

No real bank/ACH connection, no real check clearing, and no card issuing — money movement and deposits are simulated inside the app's own ledger. Adding a real provider later is possible but is a separate step.
