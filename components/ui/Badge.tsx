import type { ReactNode } from "react";

const TONES = {
  neutral: "bg-stone-100 text-stone-700",
  green: "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200",
  amber: "bg-amber-50 text-amber-800 ring-1 ring-amber-200",
  red: "bg-red-50 text-red-700 ring-1 ring-red-200",
  blue: "bg-sky-50 text-sky-800 ring-1 ring-sky-200",
} as const;

export type Tone = keyof typeof TONES;

export function Badge({ tone = "neutral", children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${TONES[tone]}`}>
      {children}
    </span>
  );
}

export function TrustedBadge() {
  return (
    <span title="Verified by a LendLoop admin">
      <Badge tone="blue">✓ Trusted Lender</Badge>
    </span>
  );
}
