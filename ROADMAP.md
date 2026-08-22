# BudgetBold — Feature Roadmap

Working backlog derived from the full feature checklist. This is a local-first,
offline-by-design app (React 19 + Vite + Tailwind v4, Context + useReducer,
localStorage). Anything requiring a backend is marked explicitly rather than
silently assumed.

Status legend:

- ✅ Shipped
- 🟡 Partial / basic version exists
- ⬜ Planned
- 🔭 Differentiator — later, only if it fits the product
- 🏗️ Needs backend or major schema change — explicit scoping decision required

## Delivery Phases

Sequence follows the agreed principle: solid transaction + budget core →
insights/reporting → goals → data portability/security → notifications → UX
polish.

| Phase | Theme | Highlights |
| --- | --- | --- |
| 1 ✅ shipped | Core tracking hardening & UX foundations | Notes on transactions, undo-delete toast system, duplicate warning, centralized quick-add + FAB, keyboard shortcuts (`n`, `/`, `Esc`), system-preference dark mode, tabular figures, reduced-motion |
| 2 ✅ shipped | Budgeting depth | Budget vs. actual report with drill-down, previous-period comparison, rollover mode, recurring auto-generation, payment methods, amount/date filters. Weekly/biweekly periods deferred (schema-scale; see Custom budget periods) |
| 3 ✅ shipped | Goals | Multiple named goals (target + date), savings-type transactions as the contribution ledger, auto-allocation plans with fund-all, milestone celebrations, `s` shortcut, recurring auto-save templates. Guided setup deferred to onboarding work |
| 4 ✅ shipped | Insights & reporting | Spending trend w/ average line, recurring cost audit, cash-flow forecast, year-in-review, custom month-range report, unusual-spending alerts. Local digest view still a candidate |
| 5 ✅ shipped | Data portability | JSON backup export + validated restore (schema migration + two-step confirm), CSV import wizard (auto column detection, date-format handling, sign/type inference, dedupe, 500-row cap), print/PDF monthly report |
| 6 ✅ shipped | Trust layer (local-first) | PIN app-lock (salted SHA-256 hash, keypad lock screen, lock-now + verified removal), `/privacy` page, hardened two-step clear-all-data flow. Real auth stays 🏗️ out of scope |
| 7 ✅ shipped | Accessibility & performance pass | Show-more pagination on transaction lists (Transactions + Dashboard), mobile swipe-to-delete, sr-only chart summaries + `role="img"` + recharts `accessibilityLayer`, global focus-visible rings, skeleton route loader, per-chart error boundaries. Full tab-order audit still open |
| 8 ✅ shipped | Sample data mode | Isolated demo store (`budgetbold-demo` + active flag) so real data is never touched, seeded deterministic 6-month generator (recurring templates, goals with contribution ledger, budget limits), demo banner in the app shell, toggles in Settings + dashboard zero-month hero |
| 9 ✅ shipped | Guided setup | First-run wizard replacing the passive carousel: currency → first income (optional monthly auto-repeat → template + posted transaction) → one spending cap → monthly savings target; every step skippable, Back navigation, Enter-to-advance, summary screen of what was created, and an "Explore with sample data" express lane wired to demo mode |
| 10 ✅ shipped | Transaction editing | Pencil action on every transaction row (Dashboard + Transactions lists), shared quick-add modal reused in edit mode (prefilled, duplicate check off for self), new `UPDATE_TRANSACTION` reducer action that moves entries across months when the date changes month, goal links preserved only while type stays `savings`, success toast on save |
| 11 ✅ shipped | Accounts (schema v5) | User-created accounts with enum types (Cash/Bank/Mobile Money/Card/Other) + opening balance; every transaction optionally tagged (`accountId`); v4→v5 migration auto-creates a Default account and backfills all untagged transactions; account manager card in Settings (add/edit/delete with delete→Default reassignment, default account undeletable); account selector in the add/edit modal; per-account balances + "across N accounts" net strip on Dashboard; demo generator now spans 3 sample accounts. Transfers, low-balance warnings and pending/cleared stay parked until follow-up phases |
| 12 ✅ shipped | Recurring edit flows | New `UPDATE_RECURRING` action; editing an auto-posted instance now asks whether to also update the matching template ("edit just this month" default vs "also update future months"); templates themselves are editable in RecurringManager via inline form (name/amount/type/category/frequency) with explicit future-months semantics |
| 13 ✅ shipped | Account awareness | Optional per-account `lowBalanceThreshold` (set in the account form, no schema bump); notifications panel flags accounts at/below their threshold or overdrawn; account filter added to the Transactions filter panel (visible when >1 account) and transaction rows show an account badge next to the method chip on both list surfaces; demo generator seeds thresholds so sample mode showcases alerts. Transfers remain parked pending the linked-pair vs new-type decision |
| 14 ✅ shipped | Transfers + pending states | User picked the "new transfer type" design via decision call. `TransactionType` widened with `"transfer"`, plus optional `toAccountId` and `pending` fields (schema stays v5 — no migration). Transfer modal flow: 4th type chip, From/To account selects (same-account blocked), category/method/goal suppressed, auto-name "Transfer", blue accent. `accountBalance()` debits source / credits destination; every income/expense/savings aggregate ignores transfers automatically; fixed `typeTotals` else-branch that would have booked transfers as savings. Rows show a blue "→ amount" cell and an A → B account badge; account filter matches transfers touching either side. Pending: checkbox in the add/edit modal, amber badge + dimmed rows on both lists, informational only (balances still count pending). Print report renders transfers with a "→" sign. Demo data includes a sample bank→M-Pesa transfer and one pending utility bill |

---

## Core Money Tracking

- ✅ Manual transaction entry (amount, category, date)
- ✅ Edit existing transactions *(Phase 10 — row-level pencil action, shared modal in edit mode; changing the date's month moves the entry via `UPDATE_TRANSACTION`)*
- ✅ Day-level date picker clamped to viewed month
- ✅ Note field on transactions
- ✅ Payment method per transaction (Cash / Card / Mobile Money / Bank Transfer; optional field, shown in lists)
- 🟡 Recurring templates with manual apply-to-month; monthly templates auto-post on month entry (deduped), toggleable in Settings
- ✅ Recurring edit-one vs. edit-all-future *(Phase 12 — editing a posted instance offers an opt-in "also update the template" sync; templates editable inline in RecurringManager for future-month changes)*
- ⬜ Split transactions (one purchase across categories) 🏗️ *(schema: line items)*
- ✅ Transfers between accounts *(Phase 14 — new `"transfer"` type with From/To accounts per the user's decision call; excluded from all income/expense/savings aggregates, reflected in account balances and net worth)*
- ✅ Multiple accounts with individual balances *(Phase 11 — schema v5: user-created accounts, per-account balances in Settings + Dashboard net strip; Phase 13 added the account filter on Transactions, account badges on rows, and low-balance/overdraft alerts in Notifications)*
- 🟡 Multi-currency display (locale-aware Intl formatting); manual FX rates only relevant once multi-account lands
- 🟡 Pending vs. cleared states *(Phase 14 shipped the flag, badges and dimming — informational only; a follow-up could exclude pending from "available" balance math)*
- ⬜ Bulk edit/delete/categorize
- ✅ Undo for accidental deletes via toast (transactions and templates)
- ✅ Duplicate transaction detection with confirm-to-save warning

## Budgeting Logic

- ✅ Category budgets (monthly caps per category)
- ✅ Limits carried forward into empty months on month change
- ✅ Rollover vs. reset budget mode (user choice; effective limits shown everywhere, carried surplus accumulates from prior months)
- ⬜ Envelope / zero-based budgeting mode
- ⬜ Custom budget periods (weekly, biweekly, custom range) — deferred: month-keyed data model makes this a schema-scale change; revisit alongside accounts
- ⬜ Income allocation planner (50/30/20 or custom)
- ⬜ Shared/household budgets 🏗️
- ✅ Sinking funds *(named goals with monthly required amounts and auto-allocation serve this)*

## Goals & Debt

- 🟡 Monthly savings goal with progress ring (kept alongside named goals as the monthly target)
- ✅ Savings goals with target amount **and** target date (named goals, derived progress from savings transactions)
- ✅ Multiple concurrent goals with inline contribute/edit/delete-undo *(Phase 3)*
- ✅ Auto-allocate fixed amount or % of income per goal, with one-tap "Fund all" *(Phase 3)*
- ⬜ Debt payoff tracking (avalanche/snowball calculator)
- ⬜ Debt-free date projection
- ⬜ Net worth tracker over time

## Insights & Reporting

- ✅ Spending by category bar chart with category colors
- ✅ 6-month income vs. expense comparison chart
- ✅ Animated monthly summary video (Remotion) — differentiator already shipped
- ✅ Budget vs. actual per category with over/warn highlighting (in BudgetLimits)
- ✅ Dedicated budget-vs-actual report view (all categories, effective limits, over-by amounts, Reports page)
- ✅ Category drill-down ("where did my money go" — expandable per-category transaction lists)
- ✅ Spending trend line with 6-month average reference
- ✅ Comparison to previous period (Reports card + Dashboard metric deltas)
- ✅ Custom date-range reports (month-span aggregation + top-category breakdown)
- ✅ Recurring cost audit ("X/month committed" with per-item monthly equivalents)
- ✅ Cash flow forecast from unposted recurring items (current month only, honestly labeled)
- ✅ Year-in-review summary (totals, monthly net bars, best/worst month, top categories)

## Data Handling

- ✅ CSV export of month/all-time transactions
- ✅ JSON full backup/restore *(Phase 5 — versioned snapshot, validated + migrated on restore, two-step replace confirm)*
- ✅ CSV import from bank statements *(Phase 5 — quote-aware parser, auto column detection, Auto/DMY/MDY dates, credit-debit or sign-based direction, unknown categories → Other, exact-duplicate skip, 500-row cap; all parsing local)*
- ✅ PDF/print-friendly report export *(Phase 5 — self-contained print window with summary tiles, budget vs actual, goals, full transaction list)*
- ⬜ Receipt photo attachment per transaction (IndexedDB for blobs)
- 🏗️ Bank sync via Plaid — real integration decision, out of local-first scope for now

## Accounts & Trust

- ✅ Local-only storage; "your data never leaves your device" posture
- ✅ Clear-all-data with two-step confirm
- ✅ Account deletion equivalent = hardened data-reset flow *(Phase 6 — two-step confirm with transaction/month counts, explicit "no undo" warning, also removes app-lock PIN)*
- ✅ Optional PIN/biometric app-lock for quick re-entry *(Phase 6 — 4-digit PIN, salted SHA-256 hash stored device-side under `budgetbold-lock`, keypad lock screen gates the whole app on load, "Lock now" action, removal requires current PIN; honest about protecting against casual snooping only. Biometrics deferred — no WebAuthn without a backend)*
- ✅ Privacy policy / terms page *(Phase 6 — `/privacy`: what we collect = nothing, where data lives, exports, third parties = none)*
- 🏗️ Sign-up/login, OAuth, password reset, 2FA, session timeout, encryption at rest — requires backend; revisit before any public/hosted release

## Notifications & Alerts

- ✅ In-app notification panel: high-spending alerts, savings progress, budget warnings, get-started nudge
- ✅ Goal milestone celebration (25/50/75/100% toasts with sparkle icon on contribution)
- ✅ Upcoming recurring auto-posted on month entry (monthly templates, deduped, toggle in Settings)
- ⬜ Upcoming recurring bill reminder *(pairs with edit-one/edit-all work)*
- ✅ Unusual spending alert (category spike vs 3-month average, capped at 2 alerts)
- ⬜ Low balance warning *(accounts landed in Phase 11 — now a straightforward per-account check)*
- 🏗️ Email/push digest — needs backend; local digest view instead *(Phase 4 candidate)*

## Onboarding & Empty States

- ✅ First-run guided setup *(Phase 9 — actionable wizard replacing the old passive carousel; creates real data via the same dispatches the app uses, skippable throughout, sample-data express lane)*
- ✅ Empty states that guide the next action (dashboard zero-month hero with CTAs, reusable EmptyState everywhere)
- ✅ Sample/demo data toggle *(Phase 8 — demo state lives under its own storage key; enable from Settings or the dashboard zero-month hero, exit via the banner or Settings; Clear-all-data exits demo too)*

## Design & Feel (the "tiny knits")

- ✅ Locale-aware currency formatting (Intl, cached formatters)
- ✅ Negative amounts styled by color **and** sign (not color alone)
- ✅ Consistent zero/empty states
- ✅ Graceful large-number handling (truncate + min-w guards)
- ✅ Timezone-correct dates (parseISO, never `new Date(string)`)
- ✅ Category colors consistent from a single source (`utils/categories.ts`)
- ✅ Tabular figures so digits don't reflow
- 🟡 Count-up animation when totals change (SpendingBar counts up; unify across metrics later)
- ✅ Toast notifications for save/error/success (undo actions included; no silent failures)
- ✅ Keyboard shortcuts (`n` quick-add, `/` search, `Esc` close overlays)
- ✅ Dark/light toggle respecting `prefers-color-scheme` on first load
- ✅ Search/filter across transactions (text + type + amount range + date range with active-filter badge)
- ✅ Sticky add-transaction FAB on all screen sizes
- ✅ Swipe-to-delete on mobile lists *(Phase 7 — touch direction-locked swipe reveals delete action in `SwipeableRow`, used by both transaction lists; inline delete buttons kept for desktop/keyboard)*
- ⬜ Custom categories with icon/color picker
- ✅ Sensible default categories on first use (editable/deletable lands with custom categories)

## Accessibility

- ✅ aria-labels on icon-only buttons
- ✅ Respect `prefers-reduced-motion`
- ✅ Visible consistent focus states *(Phase 7 — global `:focus-visible` ring in brand teal via App.css base layer; mouse clicks stay clean)*
- ✅ Screen-reader summaries for charts *(Phase 7 — sr-only data summaries + `role="img"` labels on all three recharts, `accessibilityLayer` enabled; SpendingBar is a labeled `progressbar`)*
- 🟡 Full keyboard navigation audit *(focus rings + swipe fallback buttons landed in Phase 7; a systematic tab-order pass across every page is still open)*
- ✅ Resizable text without breakage (rem-based scale, truncation guards)

## Performance & Reliability

- ✅ Offline by design (localStorage, debounced writes)
- ✅ ErrorBoundary wrapping the whole app — no blank crash screens
- ✅ Code splitting: all 5 pages lazy-loaded; main bundle ~313KB gzip 98KB
- ✅ Memoized heavy derivations (`useMemo`) across pages/components
- ✅ Debounced persistence (300ms)
- ✅ Incremental pagination for long transaction lists *(Phase 7 — `ShowMoreList`: 30 rows initial / +50 on Transactions, 12/+30 on Dashboard, auto-reset on filter change; virtualization deliberately skipped as unjustified at local-data scale)*
- ✅ Deferred search filtering (`useDeferredValue` keeps typing snappy on long lists)
- ✅ Chart-library failure isolation (per-chart error boundary) *(Phase 7 — `ChartErrorBoundary` wraps all three recharts with compact retry fallback; page keeps rendering)*
- ✅ Skeleton loaders for route loading *(Phase 7 — `Skeleton` primitive + page-shaped Suspense fallback replacing the spinner; no data-fetch skeletons needed in a local-first app)*

## Nice-to-Have / Differentiators

- 🔭 "What-if" simulator (cut dining out $100/mo → goal impact)
- 🔭 Quick-text transaction entry ("coffee 5.50" parser)
- 🔭 Subscription-cancellation nudges from the recurring cost audit
- 🔭 Gamification (under-budget streaks, milestone badges)
- 🔭 Shared household view with per-member breakdown 🏗️
- 🔭 Widget/OS-level quick-add shortcuts
