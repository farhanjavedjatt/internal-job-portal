"use client";

type Props = { theme: "light" | "dark"; accentHue: number };

export default function Aurora({ theme, accentHue }: Props) {
  const dark = theme === "dark";
  const background = dark
    ? `radial-gradient(1200px 800px at 15% 10%, oklch(28% 0.08 ${accentHue} / 0.55), transparent 60%),
       radial-gradient(1000px 700px at 85% 90%, oklch(26% 0.06 ${accentHue + 60} / 0.45), transparent 60%),
       linear-gradient(180deg, #0a0b14 0%, #07080d 100%)`
    : `radial-gradient(1200px 800px at 15% 10%, oklch(90% 0.05 ${accentHue} / 0.6), transparent 60%),
       radial-gradient(1000px 700px at 85% 90%, oklch(92% 0.04 ${accentHue + 60} / 0.5), transparent 60%),
       linear-gradient(180deg, #eef0f6 0%, #e4e7f1 100%)`;

  return (
    <div
      className="aurora"
      style={{
        background,
        position: "fixed",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
      }}
      aria-hidden
    />
  );
}
