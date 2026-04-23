"use client";

import { useEffect, useState } from "react";
import type { Tweaks } from "@/lib/types";

const DEFAULTS: Tweaks = {
  theme: "dark",
  accentHue: 200,
  density: "spacious",
  font: "inter",
  cardStyle: "frost",
};

export function useTweaks() {
  const [tweaks, setTweaks] = useState<Tweaks>(DEFAULTS);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("prism-tweaks");
      if (saved) setTweaks({ ...DEFAULTS, ...JSON.parse(saved) });
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem("prism-tweaks", JSON.stringify(tweaks));
    } catch {}
    const el = document.documentElement;
    el.dataset.theme = tweaks.theme;
    el.dataset.font = tweaks.font;
    el.dataset.card = tweaks.cardStyle;
    el.style.setProperty("--accent-hue", String(tweaks.accentHue));
  }, [tweaks, hydrated]);

  return [tweaks, setTweaks] as const;
}
