"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginForm({ next }: { next: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        router.push(next || "/");
        router.refresh();
        return;
      }
      const j = await res.json().catch(() => ({}));
      setError(j?.error ?? "Login failed");
    } catch {
      setError("Network error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login-root">
      <div className="login-bg" aria-hidden />
      <form className="login-card glass" onSubmit={onSubmit}>
        <div className="login-brand" aria-hidden>
          <svg width="44" height="44" viewBox="0 0 32 32">
            <defs>
              <linearGradient id="login-g" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="var(--accent)" />
                <stop offset="100%" stopColor="var(--accent-2)" />
              </linearGradient>
            </defs>
            <rect x="2" y="10" width="28" height="18" rx="4" fill="url(#login-g)" />
            <path
              d="M11 10 V7.5 A1.5 1.5 0 0 1 12.5 6 H19.5 A1.5 1.5 0 0 1 21 7.5 V10"
              fill="none"
              stroke="url(#login-g)"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <rect x="13.5" y="16" width="5" height="2" rx="1" fill="rgba(255,255,255,0.9)" />
          </svg>
        </div>
        <h1 className="login-title">Internal Job Portal</h1>
        <p className="login-sub mono">Enter the shared password to continue</p>

        <label className="login-field">
          <span className="login-label mono">PASSWORD</span>
          <input
            type="password"
            autoFocus
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={submitting}
            required
          />
        </label>

        {error && <div className="login-error mono">{error}</div>}

        <button type="submit" className="login-submit" disabled={submitting}>
          {submitting ? "Verifying…" : "Enter"}
        </button>
      </form>
    </div>
  );
}
