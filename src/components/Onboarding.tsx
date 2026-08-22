import { useState } from "react";
import {
  Sparkles,
  Wallet,
  ShieldCheck,
  PiggyBank,
  TrendingUp,
  ArrowRight,
  ArrowLeft,
  Check,
  FlaskConical,
} from "lucide-react";
import { useBudget } from "../hooks/useBudget";
import { useToast } from "../hooks/useToast";
import { CURRENCIES, CurrencyCode, formatMoney } from "../utils/currency";
import { EXPENSE_CATEGORIES } from "../utils/categories";
import { monthKey } from "../utils/budget";
import { enableDemo } from "../utils/demo";
import type { Category, Transaction } from "../types";

interface Props {
  onDone: () => void;
}

const TOTAL_STEPS = 6;

export default function Onboarding({ onDone }: Props) {
  const { state, dispatch } = useBudget();
  const { push } = useToast();

  const [step, setStep] = useState(0);
  const [currency, setCurrency] = useState<CurrencyCode>(state.currency);
  const [incomeName, setIncomeName] = useState("Monthly salary");
  const [incomeAmount, setIncomeAmount] = useState("");
  const [repeatIncome, setRepeatIncome] = useState(true);
  const [capCategory, setCapCategory] = useState<Category>("Food");
  const [capAmount, setCapAmount] = useState("");
  const [savingsAmount, setSavingsAmount] = useState("");
  const [created, setCreated] = useState<string[]>([]);

  const now = new Date();
  const currentKey = monthKey(now.getFullYear(), now.getMonth());
  const incomeValid =
    incomeName.trim().length > 0 && Number(incomeAmount) > 0;
  const capValid = Number(capAmount) > 0;
  const savingsValid = Number(savingsAmount) > 0;

  function finish() {
    onDone();
  }

  function loadSample() {
    enableDemo(dispatch);
    push({
      message: "Sample data loaded — explore freely, exit anytime",
      tone: "success",
    });
    finish();
  }

  function applyCurrency() {
    if (currency !== state.currency) {
      dispatch({ type: "SET_CURRENCY", payload: currency });
    }
    setCreated((c) => [...c, `${currency} as your currency`]);
    setStep(2);
  }

  function applyIncome() {
    const amount = Number(incomeAmount);
    const base: Omit<Transaction, "id"> = {
      name: incomeName.trim(),
      amount,
      type: "income",
      category: "Salary",
      date: `${currentKey}-01`,
      method: "bank",
      ...(repeatIncome ? { recurring: true, frequency: "monthly" as const } : {}),
    };
    dispatch({ type: "ADD_TRANSACTION", payload: { id: crypto.randomUUID(), ...base } });
    if (repeatIncome) {
      dispatch({ type: "ADD_RECURRING", payload: { id: crypto.randomUUID(), ...base } });
    }
    setCreated((c) => [
      ...c,
      `Income “${incomeName.trim()}” — ${formatMoney(amount, currency)}${repeatIncome ? "/mo" : ""}`,
    ]);
    setStep(3);
  }

  function applyCap() {
    if (!capValid) {
      setStep(4);
      return;
    }
    dispatch({
      type: "SET_BUDGET_LIMIT",
      payload: { key: currentKey, limit: { category: capCategory, limit: Number(capAmount) } },
    });
    setCreated((c) => [
      ...c,
      `Spending cap for ${capCategory} — ${formatMoney(Number(capAmount), currency)}/mo`,
    ]);
    setStep(4);
  }

  function applySavings() {
    if (savingsValid) {
      dispatch({
        type: "SET_SAVINGS_GOAL",
        payload: { key: currentKey, goal: Number(savingsAmount) },
      });
      setCreated((c) => [
        ...c,
        `Monthly savings target — ${formatMoney(Number(savingsAmount), currency)}/mo`,
      ]);
    }
    setStep(5);
  }

  function back() {
    if (step > 0) setStep((s) => s - 1);
  }

  const inputClass =
    "w-full px-4 py-2.5 rounded-input border border-gray-700 bg-gray-800 text-sm text-white placeholder:text-gray-500 outline-none focus:ring-2 focus:ring-primary transition";
  const primaryBtn =
    "w-full py-3.5 rounded-2xl font-black text-white bg-primary hover:bg-primary-dark transition flex items-center justify-center gap-2 shadow-lg disabled:opacity-40 disabled:pointer-events-none";
  const ghostBtn =
    "text-xs text-gray-500 hover:text-gray-300 transition";

  return (
    <div className="fixed inset-0 z-[100] bg-surface-dark flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-sm my-auto">
        <div className="flex items-center justify-center gap-2 mb-8">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div
              key={i}
              className={`rounded-full transition-all duration-300 ${
                i === step
                  ? "w-6 h-2 bg-primary"
                  : i < step
                    ? "w-2 h-2 bg-primary-dark"
                    : "w-2 h-2 bg-gray-700"
              }`}
            />
          ))}
        </div>

        <div className="bg-surface-dark-alt rounded-3xl p-8 border border-gray-800">
          {step === 0 && (
            <div className="text-center">
              <div className="w-20 h-20 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-6 shadow-2xl">
                <Sparkles size={36} className="text-white" />
              </div>
              <h2 className="text-2xl font-black text-white mb-3">
                Welcome to BudgetBold!
              </h2>
              <p className="text-gray-400 text-sm leading-relaxed mb-8">
                Let's set up your budget in under a minute — or poke around
                with sample data first. Your money stays on this device,
                always.
              </p>
              <button
                onClick={() => setStep(1)}
                className={primaryBtn}
              >
                Set up my budget <ArrowRight size={18} />
              </button>
              <button
                onClick={loadSample}
                className="w-full mt-3 py-3 rounded-2xl font-bold text-sm text-primary-light border border-gray-700 hover:border-gray-600 hover:bg-gray-800/60 transition flex items-center justify-center gap-2"
              >
                <FlaskConical size={15} /> Explore with sample data
              </button>
              <button onClick={finish} className={`${ghostBtn} mt-4`}>
                Skip setup
              </button>
            </div>
          )}

          {step === 1 && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                applyCurrency();
              }}
            >
              <StepHeader
                icon={<Wallet size={26} className="text-white" />}
                color="bg-emerald-500"
                title="Pick your currency"
                desc="Just labels — your amounts are never converted behind your back."
              />
              <div className="grid grid-cols-4 gap-2 mb-8">
                {CURRENCIES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCurrency(c)}
                    className={`py-2.5 rounded-button text-xs font-bold transition-all border ${
                      currency === c
                        ? "bg-primary/20 border-primary text-primary-light"
                        : "border-gray-700 text-gray-400 hover:border-gray-600"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
              <NavRow
                onBack={back}
                submitLabel="Next"
                primaryLabelExtra={<ArrowRight size={16} />}
              />
            </form>
          )}

          {step === 2 && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (incomeValid) applyIncome();
              }}
            >
              <StepHeader
                icon={<TrendingUp size={26} className="text-white" />}
                color="bg-emerald-500"
                title="Add your main income"
                desc="This becomes this month's starting point."
              />
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                Name
              </label>
              <input
                type="text"
                value={incomeName}
                onChange={(e) => setIncomeName(e.target.value)}
                className={`${inputClass} mb-4`}
                placeholder="e.g. Monthly salary"
              />
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                Amount ({currency})
              </label>
              <input
                type="number"
                min="0"
                step="any"
                inputMode="decimal"
                value={incomeAmount}
                onChange={(e) => setIncomeAmount(e.target.value)}
                className={`${inputClass} mb-4`}
                placeholder="0"
                autoFocus
              />
              <label className="flex items-center gap-2.5 text-sm text-gray-300 mb-8 cursor-pointer">
                <input
                  type="checkbox"
                  checked={repeatIncome}
                  onChange={(e) => setRepeatIncome(e.target.checked)}
                  className="w-4 h-4 accent-teal-500"
                />
                Repeats every month (auto-posted)
              </label>
              <NavRow
                onBack={back}
                submitLabel="Next"
                disabled={!incomeValid}
                primaryLabelExtra={<ArrowRight size={16} />}
              />
            </form>
          )}

          {step === 3 && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                applyCap();
              }}
            >
              <StepHeader
                icon={<ShieldCheck size={26} className="text-white" />}
                color="bg-rose-500"
                title="Set one spending cap"
                desc="Start with the category you most want to control. You can add more anytime."
              />
              <select
                value={capCategory}
                onChange={(e) => setCapCategory(e.target.value as Category)}
                className={`${inputClass} mb-4`}
              >
                {EXPENSE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                Monthly limit ({currency})
              </label>
              <input
                type="number"
                min="0"
                step="any"
                inputMode="decimal"
                value={capAmount}
                onChange={(e) => setCapAmount(e.target.value)}
                className={`${inputClass} mb-2`}
                placeholder="Leave empty to skip"
                autoFocus
              />
              <p className="text-xs text-gray-500 mb-8">
                Optional — skip if you'd rather explore first.
              </p>
              <NavRow
                onBack={back}
                submitLabel={capValid ? "Next" : "Skip"}
                primaryLabelExtra={<ArrowRight size={16} />}
              />
            </form>
          )}

          {step === 4 && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                applySavings();
              }}
            >
              <StepHeader
                icon={<PiggyBank size={26} className="text-white" />}
                color="bg-teal-500"
                title="Set a savings target"
                desc="A monthly number to aim at — your progress ring tracks it."
              />
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                Target per month ({currency})
              </label>
              <input
                type="number"
                min="0"
                step="any"
                inputMode="decimal"
                value={savingsAmount}
                onChange={(e) => setSavingsAmount(e.target.value)}
                className={`${inputClass} mb-2`}
                placeholder="Leave empty to skip"
                autoFocus
              />
              <p className="text-xs text-gray-500 mb-8">
                Optional — named goals (new laptop, emergency fund…) come next.
              </p>
              <NavRow
                onBack={back}
                submitLabel={savingsValid ? "Finish" : "Skip"}
                primaryLabelExtra={<Check size={16} />}
              />
            </form>
          )}

          {step === 5 && (
            <div className="text-center">
              <div className="w-20 h-20 rounded-2xl bg-teal-500 flex items-center justify-center mx-auto mb-6 shadow-2xl">
                <Check size={38} className="text-white" />
              </div>
              <h2 className="text-2xl font-black text-white mb-3">
                You're all set!
              </h2>
              {created.length > 0 ? (
                <ul className="text-left space-y-2 mb-8">
                  {created.map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2 text-sm text-gray-300"
                    >
                      <Check size={14} className="text-teal-400 shrink-0 mt-1" />
                      {item}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-400 text-sm leading-relaxed mb-8">
                  Nothing set up yet — no problem. Use the{" "}
                  <span className="font-bold text-teal-400">+</span> button
                  whenever you're ready.
                </p>
              )}
              <button onClick={finish} className={primaryBtn}>
                Open Dashboard <ArrowRight size={18} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StepHeader({
  icon,
  color,
  title,
  desc,
}: {
  icon: React.ReactNode;
  color: string;
  title: string;
  desc: string;
}) {
  return (
    <div className="text-center mb-6">
      <div
        className={`w-16 h-16 rounded-2xl ${color} flex items-center justify-center mx-auto mb-5 shadow-xl`}
      >
        {icon}
      </div>
      <h2 className="text-xl font-black text-white mb-2">{title}</h2>
      <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
    </div>
  );
}

function NavRow({
  onBack,
  submitLabel,
  disabled,
  primaryLabelExtra,
}: {
  onBack?: () => void;
  submitLabel: string;
  disabled?: boolean;
  primaryLabelExtra?: React.ReactNode;
}) {
  return (
    <div className={`flex items-center gap-3 ${onBack ? "" : "mt-2"}`}>
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-3 rounded-2xl font-bold text-sm text-gray-400 hover:text-white border border-gray-700 hover:border-gray-600 transition flex items-center gap-1.5"
        >
          <ArrowLeft size={15} /> Back
        </button>
      )}
      <button
        type="submit"
        disabled={disabled}
        className="flex-1 py-3 rounded-2xl font-black text-white bg-primary hover:bg-primary-dark transition flex items-center justify-center gap-2 shadow-lg disabled:opacity-40 disabled:pointer-events-none"
      >
        {submitLabel} {primaryLabelExtra}
      </button>
    </div>
  );
}
