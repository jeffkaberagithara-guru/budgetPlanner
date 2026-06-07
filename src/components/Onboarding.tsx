import { useState } from "react";
import {
  Sparkles,
  TrendingUp,
  PiggyBank,
  BarChart2,
  ArrowRight,
  Check,
} from "lucide-react";

interface Props {
  onDone: () => void;
}

const steps = [
  {
    icon: Sparkles,
    color: "from-violet-500 to-pink-500",
    title: "Welcome to BudgetBold!",
    desc: "Your smart, beautiful personal finance tracker. Take control of your money in minutes.",
    cta: "Get Started",
  },
  {
    icon: TrendingUp,
    color: "from-emerald-400 to-teal-500",
    title: "Track Income & Expenses",
    desc: "Add your income and expenses with categories. See where your money goes every month.",
    cta: "Next",
  },
  {
    icon: PiggyBank,
    color: "from-violet-500 to-blue-500",
    title: "Set Savings Goals",
    desc: "Define monthly savings targets and watch your progress ring fill up as you save.",
    cta: "Next",
  },
  {
    icon: BarChart2,
    color: "from-pink-500 to-rose-500",
    title: "Beautiful Reports",
    desc: "Get animated video summaries powered by Remotion and insightful charts of your finances.",
    cta: "Let's Go!",
  },
];

export default function Onboarding({ onDone }: Props) {
  const [step, setStep] = useState(0);
  const current = steps[step];
  const Icon = current.icon;

  function next() {
    if (step < steps.length - 1) setStep((s) => s + 1);
    else onDone();
  }

  return (
    <div className="fixed inset-0 z-[100] bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`rounded-full transition-all duration-300 ${
                i === step
                  ? "w-6 h-2 bg-violet-500"
                  : i < step
                    ? "w-2 h-2 bg-violet-800"
                    : "w-2 h-2 bg-gray-700"
              }`}
            />
          ))}
        </div>

        {/* Card */}
        <div className="bg-gray-900 rounded-3xl p-8 border border-gray-800 text-center">
          {/* Icon */}
          <div
            className={`w-20 h-20 rounded-2xl bg-linear-to-br ${current.color} flex items-center justify-center mx-auto mb-6 shadow-2xl`}
          >
            <Icon size={36} className="text-white" />
          </div>

          {/* Text */}
          <h2 className="text-2xl font-black text-white mb-3">
            {current.title}
          </h2>
          <p className="text-gray-400 text-sm leading-relaxed mb-8">
            {current.desc}
          </p>

          {/* CTA */}
          <button
            onClick={next}
            className={`w-full py-3.5 rounded-2xl font-black text-white bg-linear-to-r ${current.color} hover:opacity-90 transition flex items-center justify-center gap-2 shadow-lg`}
          >
            {step === steps.length - 1 ? (
              <>
                <Check size={18} /> {current.cta}
              </>
            ) : (
              <>
                {current.cta} <ArrowRight size={18} />
              </>
            )}
          </button>

          {/* Skip */}
          {step < steps.length - 1 && (
            <button
              onClick={onDone}
              className="mt-4 text-xs text-gray-600 hover:text-gray-400 transition"
            >
              Skip intro
            </button>
          )}
        </div>
      </div>
    </div>
  );
}