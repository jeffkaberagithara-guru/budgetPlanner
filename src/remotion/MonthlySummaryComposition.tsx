import {
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
  AbsoluteFill,
} from "remotion";
import AnimatedNumber from "./AnimatedNumber";
import { CurrencyCode, formatMoney } from "../utils/currency";

interface Props {
  month: string;
  income: number;
  expense: number;
  balance: number;
  topCategory: string;
  topAmount: number;
  savingsGoal: number;
  saved: number;
  currency?: CurrencyCode;
}

function FadeSlide({
  children,
  delay = 0,
}: {
  children: React.ReactNode;
  delay?: number;
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const progress = spring({
    frame: frame - delay,
    fps,
    config: { damping: 35, stiffness: 90 },
  });
  const opacity = interpolate(progress, [0, 1], [0, 1]);
  const translateY = interpolate(progress, [0, 1], [40, 0]);
  if (frame < delay) return null;
  return (
    <div style={{ opacity, transform: `translateY(${translateY}px)` }}>
      {children}
    </div>
  );
}

function AnimatedProgressBar({
  pct,
  color,
  delay = 0,
}: {
  pct: number;
  color: string;
  delay?: number;
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const progress = spring({
    frame: frame - delay,
    fps,
    config: { damping: 40, stiffness: 50 },
  });
  const width = interpolate(progress, [0, 1], [0, pct]);
  if (frame < delay)
    return (
      <div
        style={{
          background: "rgba(255,255,255,0.1)",
          borderRadius: 99,
          height: 8,
        }}
      />
    );
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.1)",
        borderRadius: 99,
        height: 8,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: `${width}%`,
          background: color,
          height: "100%",
          borderRadius: 99,
        }}
      />
    </div>
  );
}

function AnimatedRing({ pct, delay = 0 }: { pct: number; delay?: number }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const progress = spring({
    frame: frame - delay,
    fps,
    config: { damping: 40, stiffness: 40 },
  });
  const animPct = interpolate(progress, [0, 1], [0, pct]);
  const r = 40;
  const circ = 2 * Math.PI * r;
  const offset = circ - (animPct / 100) * circ;
  const color =
    pct >= 100
      ? "#10b981"
      : pct >= 60
        ? "#a78bfa"
        : pct >= 30
          ? "#fbbf24"
          : "#f43f5e";
  if (frame < delay) return null;
  return (
    <svg
      width="100"
      height="100"
      viewBox="0 0 100 100"
      style={{ transform: "rotate(-90deg)" }}
    >
      <circle
        cx="50"
        cy="50"
        r={r}
        fill="none"
        stroke="rgba(255,255,255,0.1)"
        strokeWidth="8"
      />
      <circle
        cx="50"
        cy="50"
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="8"
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={offset}
      />
    </svg>
  );
}

export default function MonthlySummaryComposition({
  month,
  income,
  expense,
  balance,
  topCategory,
  topAmount,
  savingsGoal,
  saved,
  currency = "KES",
}: Props) {
  const spendingPct =
    income > 0 ? Math.min(100, Math.round((expense / income) * 100)) : 0;
  const savingsPct =
    savingsGoal > 0
      ? Math.min(100, Math.round((saved / savingsGoal) * 100))
      : 0;
  const spendColor =
    spendingPct > 90 ? "#f43f5e" : spendingPct > 70 ? "#fbbf24" : "#10b981";

  return (
    <AbsoluteFill
      style={{
        background:
          "linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)",
        padding: 40,
        fontFamily: "'Inter', 'Segoe UI', sans-serif",
        overflow: "hidden",
      }}
    >
      {/* Background decoration */}
      <div
        style={{
          position: "absolute",
          top: -100,
          right: -100,
          width: 300,
          height: 300,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(124,58,237,0.2) 0%, transparent 70%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: -80,
          left: -80,
          width: 250,
          height: 250,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(236,72,153,0.15) 0%, transparent 70%)",
        }}
      />

      {/* Header */}
      <FadeSlide delay={0}>
        <div style={{ marginBottom: 24 }}>
          <div
            style={{
              fontSize: 11,
              color: "#a5b4fc",
              letterSpacing: 4,
              textTransform: "uppercase",
              marginBottom: 4,
            }}
          >
            Monthly Summary
          </div>
          <div
            style={{
              fontSize: 32,
              fontWeight: 900,
              color: "#fff",
              letterSpacing: -1,
            }}
          >
            {month}
          </div>
        </div>
      </FadeSlide>

      {/* Metric cards row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 12,
          marginBottom: 20,
        }}
      >
        {[
          { label: "Income", value: income, color: "#10b981", delay: 5 },
          { label: "Expenses", value: expense, color: "#f43f5e", delay: 10 },
          {
            label: balance >= 0 ? "Saved" : "Deficit",
            value: Math.abs(balance),
            color: balance >= 0 ? "#818cf8" : "#f43f5e",
            delay: 15,
          },
        ].map(({ label, value, color, delay }) => (
          <FadeSlide key={label} delay={delay}>
            <div
              style={{
                background: "rgba(255,255,255,0.07)",
                borderRadius: 16,
                padding: "14px 16px",
                border: "1px solid rgba(255,255,255,0.1)",
                backdropFilter: "blur(10px)",
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  color: "rgba(255,255,255,0.5)",
                  marginBottom: 6,
                }}
              >
                {label}
              </div>
              <div style={{ fontSize: 16, fontWeight: 800, color }}>
                {currency} <AnimatedNumber value={value} color={color} />
              </div>
            </div>
          </FadeSlide>
        ))}
      </div>

      {/* Spending bar */}
      <FadeSlide delay={20}>
        <div
          style={{
            background: "rgba(255,255,255,0.07)",
            borderRadius: 16,
            padding: "14px 16px",
            marginBottom: 12,
            border: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 8,
            }}
          >
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>
              Spending vs Income
            </span>
            <span style={{ fontSize: 12, fontWeight: 800, color: spendColor }}>
              {spendingPct}%
            </span>
          </div>
          <AnimatedProgressBar
            pct={spendingPct}
            color={spendColor}
            delay={25}
          />
        </div>
      </FadeSlide>

      {/* Bottom row — savings ring + top category */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {/* Savings ring */}
        <FadeSlide delay={30}>
          <div
            style={{
              background: "rgba(255,255,255,0.07)",
              borderRadius: 16,
              padding: "14px 16px",
              border: "1px solid rgba(255,255,255,0.1)",
              display: "flex",
              alignItems: "center",
              gap: 16,
            }}
          >
            <div
              style={{
                position: "relative",
                width: 80,
                height: 80,
                flexShrink: 0,
              }}
            >
              <AnimatedRing pct={savingsPct} delay={35} />
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexDirection: "column",
                }}
              >
                <span style={{ fontSize: 14, fontWeight: 900, color: "#fff" }}>
                  {savingsPct}%
                </span>
              </div>
            </div>
            <div>
              <div
                style={{
                  fontSize: 11,
                  color: "rgba(255,255,255,0.5)",
                  marginBottom: 4,
                }}
              >
                Savings Goal
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#a78bfa" }}>
                {savingsGoal > 0
                  ? formatMoney(savingsGoal, currency)
                  : "Not set"}
              </div>
            </div>
          </div>
        </FadeSlide>

        {/* Top category */}
        <FadeSlide delay={40}>
          <div
            style={{
              background: "rgba(255,255,255,0.07)",
              borderRadius: 16,
              padding: "14px 16px",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <div
              style={{
                fontSize: 11,
                color: "rgba(255,255,255,0.5)",
                marginBottom: 6,
              }}
            >
              Top Expense
            </div>
            <div
              style={{
                fontSize: 15,
                fontWeight: 800,
                color: "#fff",
                marginBottom: 4,
              }}
            >
              {topCategory || "—"}
            </div>
            {topCategory && (
              <div style={{ fontSize: 13, fontWeight: 700, color: "#f43f5e" }}>
                {currency} <AnimatedNumber value={topAmount} color="#f43f5e" />
              </div>
            )}
          </div>
        </FadeSlide>
      </div>

      {/* Footer */}
      <FadeSlide delay={50}>
        <div
          style={{
            position: "absolute",
            bottom: 24,
            left: 40,
            right: 40,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: 8,
                background: "linear-gradient(135deg, #7c3aed, #ec4899)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span style={{ color: "#fff", fontSize: 10, fontWeight: 900 }}>
                B
              </span>
            </div>
            <span
              style={{
                fontSize: 12,
                fontWeight: 800,
                color: "rgba(255,255,255,0.7)",
              }}
            >
              BudgetBold
            </span>
          </div>
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>
            Powered by Remotion
          </span>
        </div>
      </FadeSlide>
    </AbsoluteFill>
  );
}