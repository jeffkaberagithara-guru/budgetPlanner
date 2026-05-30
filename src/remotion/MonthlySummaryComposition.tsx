import {
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
  AbsoluteFill,
  Sequence,
} from "remotion";
import AnimatedNumber from "./AnimatedNumber";

interface Props {
  month: string;
  income: number;
  expense: number;
  balance: number;
  topCategory: string;
  topAmount: number;
  savingsGoal: number;
  saved: number;
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
  const translateY = interpolate(progress, [0, 1], [30, 0]);

  return (
    <div style={{ opacity, transform: `translateY(${translateY}px)` }}>
      {children}
    </div>
  );
}

function ProgressBar({
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
    config: { damping: 40, stiffness: 60 },
  });

  const width = interpolate(progress, [0, 1], [0, pct]);

  return (
    <div
      style={{
        background: "#f1f5f9",
        borderRadius: 99,
        height: 10,
        overflow: "hidden",
        marginTop: 8,
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

export default function MonthlySummaryComposition({
  month,
  income,
  expense,
  balance,
  topCategory,
  topAmount,
  savingsGoal,
  saved,
}: Props) {
  const spendingPct =
    income > 0 ? Math.min(100, Math.round((expense / income) * 100)) : 0;
  const savingsPct =
    savingsGoal > 0
      ? Math.min(100, Math.round((saved / savingsGoal) * 100))
      : 0;

  return (
    <AbsoluteFill
      style={{
        background:
          "linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4c1d95 100%)",
        padding: 48,
        fontFamily: "sans-serif",
        color: "#fff",
      }}
    >
      {/* Header */}
      <Sequence from={0}>
        <FadeSlide delay={0}>
          <div style={{ marginBottom: 32 }}>
            <div
              style={{
                fontSize: 14,
                color: "#a5b4fc",
                letterSpacing: 3,
                textTransform: "uppercase",
                marginBottom: 6,
              }}
            >
              Monthly Summary
            </div>
            <div style={{ fontSize: 36, fontWeight: 900, color: "#fff" }}>
              {month}
            </div>
          </div>
        </FadeSlide>
      </Sequence>

      {/* Metric Row */}
      <Sequence from={0}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 16,
            marginBottom: 28,
          }}
        >
          {[
            { label: "Income", value: income, color: "#10b981", delay: 5 },
            { label: "Expenses", value: expense, color: "#f43f5e", delay: 10 },
            {
              label: "Balance",
              value: Math.abs(balance),
              color: balance >= 0 ? "#818cf8" : "#f43f5e",
              delay: 15,
            },
          ].map(({ label, value, color, delay }) => (
            <FadeSlide key={label} delay={delay}>
              <div
                style={{
                  background: "rgba(255,255,255,0.08)",
                  borderRadius: 16,
                  padding: "16px 20px",
                  backdropFilter: "blur(10px)",
                  border: "1px solid rgba(255,255,255,0.12)",
                }}
              >
                <div
                  style={{ fontSize: 12, color: "#c4b5fd", marginBottom: 6 }}
                >
                  {label}
                </div>
                <div style={{ fontSize: 20, fontWeight: 800, color }}>
                  KES <AnimatedNumber value={value} color={color} />
                </div>
              </div>
            </FadeSlide>
          ))}
        </div>
      </Sequence>

      {/* Spending Bar */}
      <Sequence from={0}>
        <FadeSlide delay={20}>
          <div
            style={{
              background: "rgba(255,255,255,0.08)",
              borderRadius: 16,
              padding: "16px 20px",
              marginBottom: 16,
              border: "1px solid rgba(255,255,255,0.12)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 13,
                color: "#c4b5fd",
              }}
            >
              <span>Spending vs Income</span>
              <span style={{ fontWeight: 700, color: "#fff" }}>
                {spendingPct}%
              </span>
            </div>
            <ProgressBar
              pct={spendingPct}
              color={
                spendingPct > 90
                  ? "#f43f5e"
                  : spendingPct > 70
                    ? "#fbbf24"
                    : "#10b981"
              }
              delay={25}
            />
          </div>
        </FadeSlide>
      </Sequence>

      {/* Savings Goal */}
      <Sequence from={0}>
        <FadeSlide delay={30}>
          <div
            style={{
              background: "rgba(255,255,255,0.08)",
              borderRadius: 16,
              padding: "16px 20px",
              marginBottom: 16,
              border: "1px solid rgba(255,255,255,0.12)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 13,
                color: "#c4b5fd",
              }}
            >
              <span>Savings Goal</span>
              <span style={{ fontWeight: 700, color: "#a78bfa" }}>
                {savingsPct}%
              </span>
            </div>
            <ProgressBar pct={savingsPct} color="#a78bfa" delay={35} />
          </div>
        </FadeSlide>
      </Sequence>

      {/* Top Category */}
      <Sequence from={0}>
        <FadeSlide delay={40}>
          <div
            style={{
              background: "rgba(255,255,255,0.08)",
              borderRadius: 16,
              padding: "16px 20px",
              border: "1px solid rgba(255,255,255,0.12)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <div style={{ fontSize: 12, color: "#c4b5fd", marginBottom: 4 }}>
                Top Expense Category
              </div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#fff" }}>
                {topCategory || "—"}
              </div>
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: "#f43f5e" }}>
              {topCategory ? (
                <>
                  KES <AnimatedNumber value={topAmount} color="#f43f5e" />
                </>
              ) : (
                "—"
              )}
            </div>
          </div>
        </FadeSlide>
      </Sequence>

      {/* Footer */}
      <Sequence from={0}>
        <FadeSlide delay={50}>
          <div
            style={{
              position: "absolute",
              bottom: 32,
              left: 48,
              right: 48,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div style={{ fontSize: 12, color: "#6d28d9" }}>BudgetBold</div>
            <div style={{ fontSize: 11, color: "#4c1d95" }}>
              Generated with ❤️
            </div>
          </div>
        </FadeSlide>
      </Sequence>
    </AbsoluteFill>
  );
}