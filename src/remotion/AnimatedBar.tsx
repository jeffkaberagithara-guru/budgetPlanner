import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";

interface Props {
  value: number;
  maxValue: number;
  color: string;
  label: string;
  delay?: number;
}

export default function AnimatedBar({
  value,
  maxValue,
  color,
  label,
  delay = 0,
}: Props) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({
    frame: frame - delay,
    fps,
    config: { damping: 40, stiffness: 70 },
  });

  const heightPct =
    maxValue > 0
      ? interpolate(progress, [0, 1], [0, (value / maxValue) * 100])
      : 0;
  const opacity = interpolate(progress, [0, 1], [0, 1]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 6,
        opacity,
      }}
    >
      <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>
        {value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}
      </div>
      <div
        style={{
          width: 36,
          height: 140,
          background: "#f1f5f9",
          borderRadius: 8,
          overflow: "hidden",
          display: "flex",
          alignItems: "flex-end",
        }}
      >
        <div
          style={{
            width: "100%",
            height: `${heightPct}%`,
            background: color,
            borderRadius: "8px 8px 0 0",
            transition: "none",
          }}
        />
      </div>
      <div
        style={{
          fontSize: 10,
          color: "#94a3b8",
          textAlign: "center",
          maxWidth: 50,
        }}
      >
        {label}
      </div>
    </div>
  );
}