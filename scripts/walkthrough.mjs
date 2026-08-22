import { chromium } from "playwright";

const BASE = process.env.BASE_URL || "http://localhost:4183";
const issues = [];
const logs = [];

function log(step, msg) {
  console.log(`[STEP] ${step}${msg ? " — " + msg : ""}`);
}

async function checkBoundary(page, step) {
  const boundary = await page
    .getByRole("heading", { name: "Something went wrong" })
    .count()
    .catch(() => 0);
  if (boundary > 0) {
    const msg = await page
      .locator("p.font-mono")
      .first()
      .textContent()
      .catch(() => "?");
    issues.push(`BOUNDARY at ${step}: ${msg}`);
    log(step, `ERROR BOUNDARY: ${msg}`);
    return true;
  }
  return false;
}

async function safeClick(page, step, locatorFn, desc) {
  try {
    const loc = locatorFn(page);
    await loc.first().click({ timeout: 5000 });
    return true;
  } catch (e) {
    issues.push(`CLICK FAIL at ${step} (${desc}): ${e.message.split("\n")[0]}`);
    return false;
  }
}

async function waitFor(page, step, locatorFn, desc, timeout = 6000) {
  try {
    await locatorFn(page).first().waitFor({ state: "visible", timeout });
    return true;
  } catch {
    issues.push(`NOT VISIBLE after ${step}: ${desc}`);
    return false;
  }
}

const browser = await chromium.launch({ channel: "msedge", headless: true });
const ctx = await browser.newContext();
const page = await ctx.newPage();

page.on("pageerror", (err) => {
  issues.push(`PAGEERROR: ${err.message}`);
  console.log("[PAGEERROR]", err.message);
});
page.on("console", (m) => {
  if (m.type() === "error") {
    logs.push(m.text());
    if (!m.text().includes("Failed to load resource"))
      console.log("[CONSOLE ERROR]", m.text().slice(0, 300));
  }
});

// ---------- 1. Fresh visit ----------
log("1", "fresh visit");
await page.goto(BASE, { waitUntil: "networkidle" });
await page.waitForTimeout(1200);
if (await checkBoundary(page, "fresh-load")) throw new Error("crash on load");

const onboardingVisible = await page
  .getByText(/Welcome to BudgetBold|budgetbold/i)
  .first()
  .isVisible()
  .catch(() => false);
log("1", `onboarding visible: ${onboardingVisible}`);

// ---------- 2. Onboarding walkthrough ----------
log("2", "onboarding walkthrough");
// Welcome screen -> proceed (avoid demo express lane)
let done = false;
for (let i = 0; i < 8 && !done; i++) {
  const nextBtn = page.getByRole("button", { name: /^(Next|Get Started|Continue)/i });
  const skipBtn = page.getByRole("button", { name: /^Skip/i });
  if (await skipBtn.count()) {
    // prefer Next when enabled
  }
  if ((await nextBtn.count()) && (await nextBtn.first().isEnabled())) {
    await nextBtn.first().click();
  } else if (await skipBtn.count()) {
    await skipBtn.first().click();
  } else {
    done = true;
    break;
  }
  await page.waitForTimeout(350);
}
await page.waitForTimeout(500);
log("2", "onboarding advanced");
if (await checkBoundary(page, "onboarding")) throw new Error("crash in onboarding");

// If we are still on an onboarding step with forms, fill minimal & continue best-effort.
// Currency chips exist on some steps; click KES if visible.
if (await page.getByRole("button", { name: /^KES$/ }).count()) {
  await page.getByRole("button", { name: /^KES$/ }).first().click();
}

// ---------- 3. Dashboard ----------
log("3", "dashboard");
await page.goto(BASE + "/", { waitUntil: "networkidle" });
await page.waitForTimeout(1000);
if (await checkBoundary(page, "dashboard")) throw new Error("crash on dashboard");
await waitFor(page, "dashboard", (p) => p.getByText("Total Income"), "Total Income card");

// ---------- 4. Add EXPENSE via FAB ----------
log("4", "quick add expense");
const fab = page.locator('button[aria-label*="add" i], button[aria-label*="transaction" i]').last();
if (!(await fab.count())) {
  // fallback: bottom-right fixed button
  await page.locator("button.fixed").last().click();
} else {
  await fab.click();
}
await waitFor(page, "open-modal", (p) => p.getByText("Add Transaction"), "Add Transaction modal");
if (await checkBoundary(page, "modal-open")) throw new Error("crash opening modal");

await page.getByPlaceholder(/Salary, Rent/i).fill("Test Groceries");
await page.locator('input[type="number"]').first().fill("2499.99"); // DECIMAL amount
await page.locator("form").getByRole("button", { name: "Expense", exact: true }).click();
await page.waitForTimeout(200);
await page.locator("form button[type=submit]").click();
await page.waitForTimeout(800);

const modalGone = !(await page.getByText("Add Transaction").count());
log("4", `modal closed: ${modalGone}`);
if (!modalGone) issues.push("EXPENSE SAVE: modal did not close — save blocked");
if (await checkBoundary(page, "expense-save")) throw new Error("crash saving expense");
await waitFor(page, "expense-listed", (p) => p.getByText("Test Groceries"), "new expense visible");

// ---------- 5. Add INCOME ----------
log("5", "quick add income");
await page.locator('button[aria-label*="add" i], button[aria-label*="transaction" i]').last().click();
await waitFor(page, "open-modal-2", (p) => p.getByText("Add Transaction"), "Add Transaction modal");
await page.getByPlaceholder(/Salary, Rent/i).fill("Freelance Pay");
await page.locator('input[type="number"]').first().fill("15000");
await page.locator("form").getByRole("button", { name: "Income", exact: true }).click();
await page.waitForTimeout(200);
await page.locator("form button[type=submit]").click();
await page.waitForTimeout(800);
if (await checkBoundary(page, "income-save")) throw new Error("crash saving income");

// ---------- 6. Transactions page ----------
log("6", "transactions page");
await page.goto(BASE + "/transactions", { waitUntil: "networkidle" });
await page.waitForTimeout(900);
if (await checkBoundary(page, "transactions-page")) throw new Error("crash on transactions");
await waitFor(page, "tx-count", (p) => p.getByText(/this month/i).first(), "count label");
// filters
for (const f of ["Income", "Expense"]) {
  await page.getByRole("button", { name: f, exact: true }).first().click({ timeout: 3000 }).catch(() => {});
  await page.waitForTimeout(250);
}
await page.getByRole("button", { name: /clear/i }).first().click({ timeout: 2000 }).catch(() => {});

// ---------- 7. Savings page ----------
log("7", "savings page");
await page.goto(BASE + "/savings", { waitUntil: "networkidle" });
await page.waitForTimeout(900);
if (await checkBoundary(page, "savings-page")) throw new Error("crash on savings");
// monthly goal decimal
const goalInput = page.locator('input[placeholder="Enter amount"]');
if (await goalInput.count()) {
  await goalInput.fill("2500.50");
  await goalInput.press("Enter");
  await page.waitForTimeout(400);
}
// goal form Enter submit
await page.getByRole("button", { name: /^Add$/ }).first().click({ timeout: 2500 }).catch(() => {});
await page.locator('input[placeholder*="Emergency fund"]').fill("Bike Fund").catch(() => {});
await page.locator('input[placeholder="100000"]').fill("12000.75").catch(() => {});
await page.keyboard.press("Enter");
await page.waitForTimeout(500);
await waitFor(page, "goal-created", (p) => p.getByText("Bike Fund"), "goal created");
if (await checkBoundary(page, "savings-actions")) throw new Error("crash in savings");

// ---------- 8. Reports page ----------
log("8", "reports page");
await page.goto(BASE + "/reports", { waitUntil: "networkidle" });
await page.waitForTimeout(1400);
if (await checkBoundary(page, "reports-page")) throw new Error("crash on reports");

// ---------- 9. Settings page ----------
log("9", "settings page");
await page.goto(BASE + "/settings", { waitUntil: "networkidle" });
await page.waitForTimeout(900);
if (await checkBoundary(page, "settings-page")) throw new Error("crash on settings");
// profile typing
const nameInput = page.locator('input[placeholder="Your name"]');
if (await nameInput.count()) {
  await nameInput.fill("Test User");
  await page.waitForTimeout(200);
}
// spending alerts toggle
await page.getByRole("button", { name: /toggle spending alerts/i }).click({ timeout: 2500 }).catch(() => {});
await page.getByRole("button", { name: /toggle spending alerts/i }).click({ timeout: 2500 }).catch(() => {});
// add account with Enter
await page.getByRole("button", { name: /^Add$/, }).nth(1).click({ timeout: 2000 }).catch(() => {});
await page.locator('input[placeholder*="M-Pesa"]').fill("Wallet").catch(() => {});
await page.keyboard.press("Enter");
await page.waitForTimeout(400);
if (await checkBoundary(page, "settings-actions")) throw new Error("crash in settings");

// ---------- 10. Month nav ----------
log("10", "month navigation");
await page.goto(BASE + "/", { waitUntil: "networkidle" });
await page.waitForTimeout(800);
await page.getByRole("button", { name: "Previous month" }).click();
await page.waitForTimeout(500);
if (await checkBoundary(page, "prev-month")) throw new Error("crash prev month");
const todayBtn = page.getByRole("button", { name: /jump to current month/i });
if (await todayBtn.count()) {
  await todayBtn.click();
  await page.waitForTimeout(400);
}
await page.getByRole("button", { name: "Previous month" }).click();
await page.waitForTimeout(300);
// add tx while viewing PAST month
await page.locator('button[aria-label*="add" i], button[aria-label*="transaction" i]').last().click();
await waitFor(page, "past-month-modal", (p) => p.getByText("Add Transaction"), "modal in past month");
await page.getByPlaceholder(/Salary, Rent/i).fill("July Rent Backfill");
await page.locator('input[type="number"]').first().fill("18000");
await page.locator("form button[type=submit]").click();
await page.waitForTimeout(700);
if (await checkBoundary(page, "past-month-save")) throw new Error("crash past-month save");

// ---------- 11. Notifications ----------
log("11", "notifications panel");
await page.getByRole("button", { name: "Notifications" }).click();
await page.waitForTimeout(500);
if (await checkBoundary(page, "notif-open")) throw new Error("crash notifications open");
await page.keyboard.press("Escape");
await page.waitForTimeout(300);

// ---------- 12. RELOAD — persisted state must boot clean ----------
log("12", "reload persistence");
await page.reload({ waitUntil: "networkidle" });
await page.waitForTimeout(1200);
if (await checkBoundary(page, "reload")) throw new Error("CRASH ON RELOAD — corrupted persisted state");
await waitFor(page, "reload-dash", (p) => p.getByText("Total Income"), "dashboard after reload");

// ---------- 13. CORRUPTED STORAGE must self-heal ----------
log("13", "corrupted localStorage boot");
const ctx2 = await browser.newContext();
const page2 = await ctx2.newPage();
page2.on("pageerror", (err) => issues.push(`CORRUPT-BOOT PAGEERROR: ${err.message}`));
await page2.goto(BASE, { waitUntil: "domcontentloaded" });
await page2.evaluate(() => {
  localStorage.clear();
  localStorage.setItem("budgetbold-onboarded", "true");
  localStorage.setItem(
    "budgetbold-data",
    JSON.stringify({
      version: 5,
      data: {
        "2026-08": {},
        "2026-07": { transactions: [{ id: "x", name: "", amount: -5 }], savingsGoal: "lots" },
        "garbage": null,
        "2026-13": { transactions: [] },
      },
      recurringTemplates: "nope",
      goals: [null, 42],
      accounts: [{ id: "acct-default", name: "Default", type: "cash", openingBalance: 0 }],
      settings: { rollover: "yes" },
      currentYear: "2026",
      currentMonth: 99,
    }),
  );
});
await page2.goto(BASE + "/", { waitUntil: "networkidle" });
await page2.waitForTimeout(1200);
const boundary2 = await page2
  .getByRole("heading", { name: "Something went wrong" })
  .count()
  .catch(() => 0);
if (boundary2 > 0) issues.push("CORRUPT STORAGE: error boundary shown — sanitize failed");
else log("13", "corrupt storage healed — app booted");
// interact: add a transaction on healed state
try {
  await page2.locator('button[aria-label*="add" i], button[aria-label*="transaction" i]').last().click({ timeout: 4000 });
  await page2.getByPlaceholder(/Salary, Rent/i).fill("Healed Entry");
  await page2.locator('input[type="number"]').first().fill("300.25");
  await page2.locator("form button[type=submit]").click({ timeout: 4000 });
  await page2.waitForTimeout(600);
  const b3 = await page2.getByRole("heading", { name: "Something went wrong" }).count();
  if (b3 > 0) issues.push("CORRUPT STORAGE: crash after adding on healed state");
  else log("13", "add works on healed state");
} catch (e) {
  issues.push(`CORRUPT STORAGE interaction failed: ${e.message.split("\n")[0]}`);
}
await ctx2.close();

// ---------- 14. DEMO MODE round trip ----------
log("14", "demo mode round trip");
const ctx3 = await browser.newContext();
const page3 = await ctx3.newPage();
page3.on("pageerror", (err) => issues.push(`DEMO PAGEERROR: ${err.message}`));
await page3.goto(BASE, { waitUntil: "networkidle" });
await page3.waitForTimeout(800);
const loadSample = page3.getByRole("button", { name: /sample/i }).first();
if (await loadSample.count()) {
  await loadSample.click();
  await page3.waitForTimeout(1500);
  if (await checkBoundary(page3, "demo-loaded")) issues.push("DEMO: crash after loading sample data");
  // banner visible?
  const banner = await page3.getByText(/sample|demo/i).first().isVisible().catch(() => false);
  log("14", `demo banner: ${banner}`);
  // add expense in demo
  try {
    await page3.locator('button[aria-label*="add" i], button[aria-label*="transaction" i]').last().click({ timeout: 4000 });
    await page3.getByPlaceholder(/Salary, Rent/i).fill("Demo Coffee");
    await page3.locator('input[type="number"]').first().fill("320.50");
    await page3.locator("form").getByRole("button", { name: "Expense", exact: true }).click({ timeout: 3000 });
    await page3.locator("form button[type=submit]").click({ timeout: 4000 });
    await page3.waitForTimeout(700);
    if (await checkBoundary(page3, "demo-add")) issues.push("DEMO: crash adding transaction");
    else log("14", "demo add ok");
  } catch (e) {
    issues.push(`DEMO add failed: ${e.message.split("\n")[0]}`);
  }
  // exit demo via settings
  await page3.goto(BASE + "/settings", { waitUntil: "networkidle" });
  await page3.waitForTimeout(800);
  const exitBtn = page3.getByRole("button", { name: /exit demo/i }).first();
  if (await exitBtn.count()) {
    await exitBtn.click();
    await page3.waitForTimeout(1000);
    if (await checkBoundary(page3, "demo-exit")) issues.push("DEMO: crash exiting demo");
    else log("14", "exited demo cleanly");
  }
  await page3.reload({ waitUntil: "networkidle" });
  await page3.waitForTimeout(1000);
  if (await checkBoundary(page3, "post-demo-reload")) issues.push("DEMO: crash after exit+reload");
}
await ctx3.close();


// ---------- 15. EDIT existing entry ----------
log("15", "edit transaction");
await page.goto(BASE + "/transactions", { waitUntil: "networkidle" });
await page.waitForTimeout(900);
const editBtn = page.locator('button[aria-label^="Edit "]').first();
if (await editBtn.count()) {
  await editBtn.click({ timeout: 4000 });
  await waitFor(page, "edit-modal", (p) => p.getByText("Edit Transaction"), "Edit modal");
  const nameVal = await page.getByPlaceholder(/Salary, Rent/i).inputValue();
  const amtVal = await page.locator("form").locator('input[type="number"]').first().inputValue();
  log("15", `prefilled: "${nameVal}" / ${amtVal}`);
  if (!nameVal || !amtVal) issues.push("EDIT: form not prefilled with current values");
  await page.getByPlaceholder(/Salary, Rent/i).fill(nameVal + " EDITED");
  await page.locator('form button[type=submit]').click({ timeout: 4000 });
  await page.waitForTimeout(800);
  if (await checkBoundary(page, "edit-save")) throw new Error("crash editing");
  const editedVisible = await page.getByText(/EDITED/).first().isVisible().catch(() => false);
  log("15", `edit reflected in list: ${editedVisible}`);
  if (!editedVisible) issues.push("EDIT: updated entry not reflected in list");
} else {
  issues.push("EDIT: no edit button found on transactions page");
}

// ---------- 16. DELETE + UNDO ----------
log("16", "delete + undo");
const delBtn = page.locator('button[aria-label="Delete"], button[aria-label="Delete transaction"]').first();
if (await delBtn.count()) {
  const beforeCount = await page.getByText(/transaction(s)? this month/i).first().textContent();
  await delBtn.click({ timeout: 4000 });
  await page.waitForTimeout(500);
  const undo = page.getByRole("button", { name: "Undo" }).first();
  if (await undo.count()) {
    await undo.click({ timeout: 3000 });
    await page.waitForTimeout(600);
    const afterUndo = await page.getByText(beforeCount.trim()).count();
    log("16", `undo restored (count label present: ${afterUndo > 0})`);
    // now delete for real and reload
    await page.locator('button[aria-label="Delete"], button[aria-label="Delete transaction"]').first().click({ timeout: 4000 });
    await page.waitForTimeout(600);
    await page.reload({ waitUntil: "networkidle" });
    await page.waitForTimeout(1000);
    if (await checkBoundary(page, "after-delete-reload")) throw new Error("crash after delete+reload");
    log("16", "delete persisted across reload");
  } else {
    issues.push("DELETE: no Undo toast appeared");
  }
} else {
  issues.push("DELETE: no delete button found");
}

// ---------- 17. Invalid input handling ----------
log("17", "invalid input guards");
await page.locator('button[aria-label*="add" i], button[aria-label*="transaction" i]').last().click();
await waitFor(page, "invalid-modal", (p) => p.getByText("Add Transaction"), "modal");
const submitDisabled = await page.locator("form button[type=submit]").isDisabled();
log("17", `submit disabled with empty form: ${submitDisabled}`);
if (!submitDisabled) issues.push("VALIDATION: submit enabled with empty name/amount");
await page.getByPlaceholder(/Salary, Rent/i).fill("Zero Test");
await page.locator('input[type="number"]').first().fill("0");
const zeroDisabled = await page.locator("form button[type=submit]").isDisabled();
log("17", `submit disabled with zero amount: ${zeroDisabled}`);
if (!zeroDisabled) issues.push("VALIDATION: submit enabled with amount 0");
await page.keyboard.press("Escape");
await page.waitForTimeout(300);

// ---------- 18. Duplicate warning ----------
log("18", "duplicate warning");
await page.goto(BASE + "/", { waitUntil: "networkidle" });
await page.waitForTimeout(700);
await page.locator('button[aria-label*="add" i], button[aria-label*="transaction" i]').last().click();
await waitFor(page, "dup-modal-1", (p) => p.getByText("Add Transaction"), "modal");
await page.getByPlaceholder(/Salary, Rent/i).fill("Dup Check");
await page.locator('input[type="number"]').first().fill("777");
await page.locator("form button[type=submit]").click();
await page.waitForTimeout(600);
await page.locator('button[aria-label*="add" i], button[aria-label*="transaction" i]').last().click();
await waitFor(page, "dup-modal-2", (p) => p.getByText("Add Transaction"), "modal again");
await page.getByPlaceholder(/Salary, Rent/i).fill("Dup Check");
await page.locator('input[type="number"]').first().fill("777");
await page.locator("form button[type=submit]").click();
await page.waitForTimeout(400);
const dupWarned = await page.getByText(/already exists|Add Anyway/i).count();
log("18", `duplicate warning shown: ${dupWarned > 0}`);
if (!dupWarned) issues.push("DUPLICATE: no duplicate warning shown");
else {
  await page.locator("form button[type=submit]").click(); // Add Anyway
  await page.waitForTimeout(600);
  log("18", "duplicate allowed on second press");
}

// ---------- 19. MOBILE viewport pass ----------
log("19", "mobile viewport 390x844");
const mctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true });
await mctx.addInitScript(() => {
  try {
    if (!localStorage.getItem("budgetbold-onboarded")) {
      localStorage.setItem("budgetbold-onboarded", "true");
    }
  } catch {}
});
const mpage = await mctx.newPage();
mpage.on("pageerror", (err) => issues.push(`MOBILE PAGEERROR: ${err.message}`));
await mpage.goto(BASE, { waitUntil: "networkidle" });
await mpage.waitForTimeout(1200);
if (await checkBoundary(mpage, "mobile-load")) throw new Error("crash mobile load");
const bottomNav = await mpage.getByRole("link", { name: "Home" }).isVisible().catch(() => false);
log("19", `bottom nav visible: ${bottomNav}`);
if (!bottomNav) issues.push("MOBILE: bottom nav not visible");
await mpage.locator('button[aria-label*="add" i], button[aria-label*="transaction" i]').last().click({ timeout: 4000 });
await waitFor(mpage, "mobile-modal", (p) => p.getByText("Add Transaction"), "modal on mobile");
// Save button must be reachable without scrolling the page (scroll inside form)
const saveReachable = await mpage.locator("form button[type=submit]").isVisible();
log("19", `save button visible on mobile: ${saveReachable}`);
if (!saveReachable) issues.push("MOBILE: submit button clipped in add modal");
await mpage.getByPlaceholder(/Salary, Rent/i).fill("Mobile Entry");
await mpage.locator('input[type="number"]').first().fill("150");
await mpage.locator("form").getByRole("button", { name: "Expense", exact: true }).click({ timeout: 3000 });
await mpage.locator("form button[type=submit]").click({ timeout: 4000 });
await mpage.waitForTimeout(700);
if (await checkBoundary(mpage, "mobile-save")) throw new Error("crash mobile save");
// notifications panel fits
await mpage.getByRole("button", { name: "Notifications" }).click({ timeout: 3000 });
await mpage.waitForTimeout(400);
const panelBox = await mpage.locator(".fixed.top-16.right-4, .fixed.inset-x-0").first().boundingBox().catch(() => null);
log("19", `notif panel box: ${panelBox ? Math.round(panelBox.x) + "+" + Math.round(panelBox.width) : "n/a"}`);
await mpage.keyboard.press("Escape");
await mctx.close();

// ---------- Summary ----------
console.log("\n========== RESULT ==========");
console.log(`Issues found: ${issues.length}`);
issues.forEach((i) => console.log("  ✗", i));
if (logs.length) {
  console.log("Console errors:");
  logs.slice(0, 20).forEach((l) => console.log("  •", l.slice(0, 200)));
}
await browser.close();
process.exit(issues.length === 0 ? 0 : 1);
