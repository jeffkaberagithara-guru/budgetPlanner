import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";

interface Props {
  value: number;
  prefix?: string;
  suffix?: string;
  color?: string;
}

export default function AnimatedNumber({
  value,
  prefix = "",
  suffix = "",
  color = "#111827",
}: Props) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({
    frame,
    fps,
    config: { damping: 40, stiffness: 80, mass: 1 },
  });

  const display = Math.round(interpolate(progress, [0, 1], [0, value]));

  return (
    <span style={{ color, fontWeight: 800, fontFamily: "sans-serif" }}>
      {prefix}
      {display.toLocaleString()}
      {suffix}
    </span>
  );
}